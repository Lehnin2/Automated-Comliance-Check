#!/usr/bin/env python3
"""
FastAPI REST API for PowerPoint Compliance Checking
Provides endpoints for frontend integration

Install requirements:
    pip install fastapi uvicorn python-multipart aiofiles python-pptx

Run server:
    uvicorn api:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import json
import shutil
from pathlib import Path
from datetime import datetime
import uuid
import sys
import asyncio

from compliance_backend import ComplianceBackend
from path_utils import UPLOADS_DIR, RESULTS_DIR, ensure_directories
from logger_config import logger, log_progress, log_error
from db import (
    init_db,
    create_job,
    update_job_status as db_update_job_status,
    save_job_files,
    get_job as db_get_job,
    list_jobs as db_list_jobs,
    delete_job as db_delete_job,
    get_history as db_get_history,
    get_history_item as db_get_history_item,
    get_history_stats as db_get_history_stats,
    upsert_review,
    set_job_summary as db_set_job_summary,
)

# Initialize FastAPI app
app = FastAPI(
    title="PowerPoint Compliance Checker API",
    description="Backend API for automated PowerPoint compliance validation",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure all required directories exist
ensure_directories()

# Storage directory for uploads and results - use path-utils
UPLOAD_DIR = UPLOADS_DIR
RESULTS_DIR = RESULTS_DIR
init_db()

# Pydantic models for request/response
class JobStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: int  # 0-100
    message: str
    results: Optional[Dict[str, Any]] = None


class ComplianceResult(BaseModel):
    success: bool
    job_id: str
    total_violations: int
    critical_violations: int
    major_violations: int
    minor_violations: int
    duration_seconds: float
    report_url: Optional[str] = None
    violations_url: Optional[str] = None
    annotated_pptx_url: Optional[str] = None


class JobHistory(BaseModel):
    job_id: str
    filename: str
    created_at: str
    completed_at: Optional[str] = None
    status: str  # pending, processing, completed, failed
    review_status: str  # pending_review, validated, needs_revision
    total_violations: int = 0
    critical_violations: int = 0
    reviewer_notes: Optional[str] = None


# In-memory job tracking (in production, use Redis or database)
jobs: Dict[str, JobStatus] = {}

# Job history with review status (in production, use database)
job_history: Dict[str, JobHistory] = {}

# History file path for persistence
HISTORY_FILE = RESULTS_DIR / "job_history.json"

# SSE queues per job for decision trace streaming (global)
sse_queues: Dict[str, asyncio.Queue] = {}

def get_sse_queue(job_id: str) -> asyncio.Queue:
    if job_id not in sse_queues:
        sse_queues[job_id] = asyncio.Queue()
    return sse_queues[job_id]


def load_history():
    """Load job history from file"""
    global job_history
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                job_history = {k: JobHistory(**v) for k, v in data.items()}
                logger.info(f"Loaded {len(job_history)} jobs from history")
        except Exception as e:
            logger.error(f"Failed to load history: {e}")
            job_history = {}


def save_history():
    """Save job history to file"""
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump({k: v.model_dump() for k, v in job_history.items()}, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save history: {e}")


# Load history on startup
load_history()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "PowerPoint Compliance Checker API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/upload",
            "status": "/api/status/{job_id}",
            "download_report": "/api/download/{job_id}/report",
            "download_violations": "/api/download/{job_id}/violations",
            "download_pptx": "/api/download/{job_id}/pptx",
            "list_jobs": "/api/jobs"
        }
    }


@app.post("/api/upload")
async def upload_files(
    background_tasks: BackgroundTasks,
    pptx_file: UploadFile = File(...),
    metadata_file: UploadFile = File(...),
    prospectus_file: Optional[UploadFile] = File(None)
):
    """
    Upload PowerPoint, metadata, and optionally prospectus files
    Returns a job_id for tracking progress
    """
    
    # Validate file types
    if not pptx_file.filename.endswith('.pptx'):
        raise HTTPException(status_code=400, detail="PowerPoint file must be .pptx format")
    
    if not metadata_file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Metadata file must be .json format")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Create job directory
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Save uploaded files
        pptx_path = job_dir / pptx_file.filename
        metadata_path = job_dir / "metadata.json"
        
        # Save PowerPoint
        with open(pptx_path, "wb") as f:
            shutil.copyfileobj(pptx_file.file, f)
        
        # Save metadata
        with open(metadata_path, "wb") as f:
            shutil.copyfileobj(metadata_file.file, f)
        
        # Save prospectus if provided
        prospectus_path = None
        if prospectus_file:
            prospectus_path = job_dir / prospectus_file.filename
            with open(prospectus_path, "wb") as f:
                shutil.copyfileobj(prospectus_file.file, f)
        
        # Initialize job status
        jobs[job_id] = JobStatus(
            job_id=job_id,
            status="pending",
            progress=0,
            message="Files uploaded successfully"
        )
        # Persist to DB
        create_job(
            job_id=job_id,
            filename=pptx_file.filename,
            status="pending",
            created_at=datetime.now().isoformat(),
            review_status="pending_review",
            extraction_method=None,
            has_prospectus=prospectus_file is not None
        )
        save_job_files(job_id, path_pptx=str(pptx_path), path_metadata=str(metadata_path), path_prospectus=str(prospectus_path) if prospectus_path else None)
        
        # Add to history
        job_history[job_id] = JobHistory(
            job_id=job_id,
            filename=pptx_file.filename,
            created_at=datetime.now().isoformat(),
            status="pending",
            review_status="pending_review"
        )
        save_history()
        
        # Start background processing
        background_tasks.add_task(
            process_compliance_check,
            job_id=job_id,
            pptx_path=str(pptx_path),
            metadata_path=str(metadata_path),
            prospectus_path=str(prospectus_path) if prospectus_path else None
        )
        
        return {
            "job_id": job_id,
            "status": "pending",
            "message": "Files uploaded successfully. Processing started.",
            "check_status_url": f"/api/status/{job_id}"
        }
        
    except Exception as e:
        # Cleanup on error
        if job_dir.exists():
            shutil.rmtree(job_dir)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


async def process_compliance_check(job_id: str, pptx_path: str, 
                                   metadata_path: str, 
                                   prospectus_path: Optional[str],
                                   selected_modules: Optional[list] = None):
    """
    Background task to process compliance check
    """
    try:
        logger.info(f"[{job_id[:8]}] Starting compliance check")
        log_progress(job_id, "Initialize", 10, "Setting up compliance backend")
        
        # Update status: processing
        jobs[job_id].status = "processing"
        jobs[job_id].progress = 10
        jobs[job_id].message = "Initializing compliance backend..."
        db_update_job_status(job_id, "processing", 10, "Initializing compliance backend...")
        
        # Initialize backend
        job_work_dir = RESULTS_DIR / job_id
        backend = ComplianceBackend(work_dir=str(job_work_dir))
        
        # Check if extraction already exists (done in background during preview)
        job_upload_dir = UPLOAD_DIR / job_id
        existing_extraction = job_upload_dir / "extracted_document.json"
        
        if existing_extraction.exists():
            log_progress(job_id, "Extract", 20, "Using existing extraction (already done)")
            jobs[job_id].progress = 20
            jobs[job_id].message = "Using existing extraction..."
            db_update_job_status(job_id, jobs[job_id].status, jobs[job_id].progress, jobs[job_id].message)
        else:
            log_progress(job_id, "Extract", 20, "Extracting PowerPoint content")
            jobs[job_id].progress = 20
            jobs[job_id].message = "Extracting PowerPoint content..."
            db_update_job_status(job_id, jobs[job_id].status, jobs[job_id].progress, jobs[job_id].message)
        
        # Run pipeline
        logger.info(f"[{job_id[:8]}] Running pipeline with modules: {selected_modules or 'all'}")
        try:
            results = backend.run_full_pipeline(
                pptx_path=pptx_path,
                metadata_path=metadata_path,
                prospectus_path=prospectus_path,
                selected_modules=selected_modules
            )
            logger.info(f"[{job_id[:8]}] Pipeline completed successfully")
        except Exception as pipeline_error:
            logger.error(f"[{job_id[:8]}] Pipeline error: {pipeline_error}")
            import traceback
            logger.error(traceback.format_exc())
            results = {
                'success': False,
                'error': str(pipeline_error),
                'summary': {'total_violations': 0, 'critical_violations': 0, 'major_violations': 0, 'minor_violations': 0}
            }
        
        log_progress(job_id, "Save", 90, "Saving results")
        jobs[job_id].progress = 90
        jobs[job_id].message = "Saving results..."
        db_update_job_status(job_id, jobs[job_id].status, jobs[job_id].progress, jobs[job_id].message)
        
        # Save results
        result_json_path = job_work_dir / "pipeline_result.json"
        backend.save_pipeline_result(results, str(result_json_path))
        # Copy output files to results directory
        if Path("MASTER_COMPLIANCE_REPORT.txt").exists():
            shutil.copy("MASTER_COMPLIANCE_REPORT.txt", 
                       job_work_dir / "MASTER_COMPLIANCE_REPORT.txt")
            # Clean up from root
            Path("MASTER_COMPLIANCE_REPORT.txt").unlink()
        
        if Path("CONSOLIDATED_VIOLATIONS.json").exists():
            shutil.copy("CONSOLIDATED_VIOLATIONS.json",
                       job_work_dir / "CONSOLIDATED_VIOLATIONS.json")
            # Clean up from root
            Path("CONSOLIDATED_VIOLATIONS.json").unlink()
        
        # Update job status: completed
        jobs[job_id].status = "completed"
        jobs[job_id].progress = 100
        jobs[job_id].message = "Compliance check completed successfully"
        # Update DB summary
        db_set_job_summary(
            job_id,
            results.get('summary', {}).get('total_violations', 0),
            results.get('summary', {}).get('critical_violations', 0),
            results.get('summary', {}).get('major_violations', 0),
            results.get('summary', {}).get('minor_violations', 0),
            results.get('duration_seconds', 0),
            completed_at=datetime.now().isoformat()
        )
        jobs[job_id].results = {
            "success": results.get('success', False),
            "total_violations": results.get('summary', {}).get('total_violations', 0),
            "critical_violations": results.get('summary', {}).get('critical_violations', 0),
            "major_violations": results.get('summary', {}).get('major_violations', 0),
            "minor_violations": results.get('summary', {}).get('minor_violations', 0),
            "duration_seconds": results.get('duration_seconds', 0),
            "report_url": f"/api/download/{job_id}/report",
            "violations_url": f"/api/download/{job_id}/violations",
            "annotated_pptx_url": f"/api/download/{job_id}/pptx",
            "result_json_url": f"/api/download/{job_id}/result"
        }
        
        # Update history with completion
        if job_id in job_history:
            job_history[job_id].status = "completed"
            job_history[job_id].completed_at = datetime.now().isoformat()
            job_history[job_id].total_violations = results.get('summary', {}).get('total_violations', 0)
            job_history[job_id].critical_violations = results.get('summary', {}).get('critical_violations', 0)
            save_history()
        
    except Exception as e:
        # Log error
        log_error(job_id, e, "process_compliance_check")
        # Update job status: failed
        jobs[job_id].status = "failed"
        jobs[job_id].progress = 0
        jobs[job_id].message = f"Processing failed: {str(e)}"
        db_update_job_status(job_id, "failed", 0, jobs[job_id].message)
        jobs[job_id].results = {"error": str(e)}
        
        # Update history with failure
        if job_id in job_history:
            job_history[job_id].status = "failed"
            save_history()
        
        logger.error(f"[{job_id[:8]}] Job failed: {str(e)}")


@app.get("/api/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Check the status of a compliance checking job
    """
    if job_id not in jobs:
        # Fallback to DB
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        return db_job
    return jobs[job_id]


@app.get("/api/download/{job_id}/report")
async def download_report(job_id: str):
    # Determine status from in-memory or DB
    if job_id in jobs:
        status = jobs[job_id].status
    else:
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        status = db_job.get("status", "")
    if status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    report_path = RESULTS_DIR / job_id / "MASTER_COMPLIANCE_REPORT.txt"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path=report_path, filename="compliance_report.txt", media_type="text/plain")


@app.get("/api/download/{job_id}/violations")
async def download_violations(job_id: str):
    if job_id in jobs:
        status = jobs[job_id].status
    else:
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        status = db_job.get("status", "")
    if status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    violations_path = RESULTS_DIR / job_id / "CONSOLIDATED_VIOLATIONS.json"
    if not violations_path.exists():
        raise HTTPException(status_code=404, detail="Violations file not found")
    return FileResponse(path=violations_path, filename="violations.json", media_type="application/json")


@app.get("/api/download/{job_id}/result")
async def download_result(job_id: str):
    if job_id in jobs:
        status = jobs[job_id].status
    else:
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        status = db_job.get("status", "")
    if status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    result_path = RESULTS_DIR / job_id / "pipeline_result.json"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found")
    return FileResponse(path=result_path, filename="pipeline_result.json", media_type="application/json")


@app.get("/api/download/{job_id}/extracted-json")
async def download_extracted_json(job_id: str):
    # Look for extracted JSON in uploads directory (serve if exists)
    job_upload_dir = UPLOAD_DIR / job_id
    extracted_path = job_upload_dir / "extracted_document.json"
    if not extracted_path.exists():
        extracted_path = job_upload_dir / "document.json"
    if not extracted_path.exists():
        raise HTTPException(status_code=404, detail="Extracted JSON not found")
    with open(extracted_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return JSONResponse(content=data)


@app.get("/api/download/{job_id}/pptx")
async def download_annotated_pptx(job_id: str):
    if job_id in jobs:
        status = jobs[job_id].status
    else:
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        status = db_job.get("status", "")
    if status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    job_upload_dir = UPLOAD_DIR / job_id
    pptx_files = list(job_upload_dir.glob("*.pptx"))
    if not pptx_files:
        raise HTTPException(status_code=404, detail="PowerPoint file not found")
    pptx_path = pptx_files[0]
    return FileResponse(path=pptx_path, filename=f"original_{pptx_path.name}", media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")


@app.get("/api/jobs")
async def list_jobs():
    """
    List all jobs with their current status
    """
    return db_list_jobs()


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its associated files
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete upload directory
    job_upload_dir = UPLOAD_DIR / job_id
    if job_upload_dir.exists():
        shutil.rmtree(job_upload_dir)
    
    # Delete results directory
    job_results_dir = RESULTS_DIR / job_id
    if job_results_dir.exists():
        shutil.rmtree(job_results_dir)
    
    # Remove from jobs dict
    if job_id in jobs:
        del jobs[job_id]
    # Also delete in DB
    db_delete_job(job_id)
    return {"message": f"Job {job_id} deleted successfully"}


@app.get("/api/health")
async def health_check():
    """
    Detailed health check
    """
    return {
        "status": "healthy",
        "active_jobs": len([j for j in jobs.values() if j.status == "processing"]),
        "completed_jobs": len([j for j in jobs.values() if j.status == "completed"]),
        "failed_jobs": len([j for j in jobs.values() if j.status == "failed"]),
        "total_jobs": len(jobs),
        "upload_dir": str(UPLOAD_DIR),
        "results_dir": str(RESULTS_DIR)
    }


# ==================== HISTORY & REVIEW ENDPOINTS ====================

@app.get("/api/history")
async def get_history():
    return db_get_history()


@app.get("/api/history/stats")
async def get_history_stats():
    return db_get_history_stats()


@app.get("/api/history/{job_id}")
async def get_history_item(job_id: str):
    item = db_get_history_item(job_id)
    if not item:
        raise HTTPException(status_code=404, detail="Job not found in history")
    return item


@app.put("/api/history/{job_id}/review")
async def update_review_status(
    job_id: str,
    review_status: str = Form(...),
    reviewer_notes: Optional[str] = Form(None)
):
    valid_statuses = ["pending_review", "validated", "needs_revision"]
    if review_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid review_status. Must be one of: {valid_statuses}")
    upsert_review(job_id, review_status, reviewer_notes)
    item = db_get_history_item(job_id)
    if not item:
        raise HTTPException(status_code=404, detail="Job not found in history")
    return {"message": f"Review status updated to '{review_status}'", "job": item}


@app.delete("/api/history/{job_id}")
async def delete_history_item(job_id: str):
    # Delete upload directory
    job_upload_dir = UPLOAD_DIR / job_id
    if job_upload_dir.exists():
        shutil.rmtree(job_upload_dir)
    # Delete results directory
    job_results_dir = RESULTS_DIR / job_id
    if job_results_dir.exists():
        shutil.rmtree(job_results_dir)
    # Remove from jobs dict if present
    if job_id in jobs:
        del jobs[job_id]
    # Remove from history (in-memory if present)
    if job_id in job_history:
        del job_history[job_id]
        save_history()
    # Also delete in DB
    db_delete_job(job_id)
    return {"message": f"Job {job_id} deleted from history"}


if __name__ == "__main__":
    import subprocess
    import sys
    
    # Load environment variables from path-utils
    from load_env import load_env_file
    from path_utils import ENV_FILE
    load_env_file(str(ENV_FILE))
    
    print("="*80)
    print("🚀 Starting PowerPoint Compliance Checker API")
    print("="*80)
    print(f"📡 API URL: http://localhost:8000")
    print(f"📚 API docs: http://localhost:8000/docs")
    print(f"📁 Upload directory: {UPLOAD_DIR.absolute()}")
    print(f"📁 Results directory: {RESULTS_DIR.absolute()}")
    print("="*80)
    
    # Run uvicorn using subprocess to avoid the reload warning
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ])


@app.post("/api/upload-preview")
async def upload_for_preview(
    background_tasks: BackgroundTasks,
    pptx_file: UploadFile = File(...),
    metadata_file: UploadFile = File(...),
    extraction_method: str = Form("MO"),  # MO, FD, SF, or SL
    parallel_workers: int = Form(4)  # For SL method (1-8)
):
    """
    Upload files and return preview data, start extraction in background
    """
    # Validate file types
    if not pptx_file.filename.endswith('.pptx'):
        raise HTTPException(status_code=400, detail="PowerPoint file must be .pptx format")
    
    if not metadata_file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Metadata file must be .json format")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Create job directory
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Save uploaded files
        pptx_path = job_dir / pptx_file.filename
        metadata_path = job_dir / "metadata.json"
        
        # Save PowerPoint
        with open(pptx_path, "wb") as f:
            shutil.copyfileobj(pptx_file.file, f)
        
        # Save metadata
        with open(metadata_path, "wb") as f:
            shutil.copyfileobj(metadata_file.file, f)
        
        # Extract slide previews
        from pptx_preview import extract_slide_thumbnails
        slides = extract_slide_thumbnails(str(pptx_path))
        
        # Initialize job status
        jobs[job_id] = JobStatus(
            job_id=job_id,
            status="preview",
            progress=0,
            message="Files uploaded - extraction starting in background"
        )
        # Persist to DB
        create_job(
            job_id=job_id,
            filename=pptx_file.filename,
            status="preview",
            created_at=datetime.now().isoformat(),
            review_status="pending_review",
            extraction_method=extraction_method,
            has_prospectus=False
        )
        save_job_files(job_id, path_pptx=str(pptx_path), path_metadata=str(metadata_path))
        db_update_job_status(job_id, "preview", 0, "Files uploaded - extraction starting in background")
        
        # Add to history
        job_history[job_id] = JobHistory(
            job_id=job_id,
            filename=pptx_file.filename,
            created_at=datetime.now().isoformat(),
            status="preview",
            review_status="pending_review"
        )
        save_history()
        
        # Start background extraction to save time
        logger.info(f"[{job_id[:8]}] Starting background extraction with method: {extraction_method}, workers: {parallel_workers}")
        background_tasks.add_task(
            run_background_extraction,
            job_id=job_id,
            pptx_path=str(pptx_path),
            extraction_method=extraction_method,
            parallel_workers=parallel_workers
        )
        
        return {
            "job_id": job_id,
            "status": "preview",
            "message": "Files uploaded successfully. Extraction running in background.",
            "slides": slides,
            "total_slides": len(slides),
            "filename": pptx_file.filename,
            "extraction_method": extraction_method
        }
        
    except Exception as e:
        # Cleanup on error
        if job_dir.exists():
            shutil.rmtree(job_dir)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


async def run_background_extraction(job_id: str, pptx_path: str, extraction_method: str, parallel_workers: int = 4):
    """Run extraction in background while user previews slides"""
    try:
        logger.info(f"[{job_id[:8]}] Background extraction started (method={extraction_method}, workers={parallel_workers})")
        
        from extraction_manager import extraction_manager
        
        # Output path for extracted JSON
        job_dir = UPLOAD_DIR / job_id
        output_path = job_dir / "extracted_document.json"
        
        # Prepare SSE queue and on_event callback (FD method supports streaming)
        queue = get_sse_queue(job_id)
        def on_event(event: Dict[str, Any]):
            try:
                queue.put_nowait(event)
            except Exception as e:
                logger.debug(f"[{job_id[:8]}] SSE queue put failed: {e}")
        
        # Run extraction (pass parallel_workers for SL method)
        extracted_data = extraction_manager.extract(
            pptx_path=pptx_path,
            method=extraction_method,
            output_path=str(output_path),
            parallel_workers=parallel_workers,
            on_event=on_event if extraction_method == 'FD' else None,
        )
        save_job_files(job_id, path_extracted_json=str(output_path))
        if job_id in jobs:
            jobs[job_id].message = "Extraction complete - ready for compliance check"
            db_update_job_status(job_id, jobs[job_id].status, jobs[job_id].progress, jobs[job_id].message)
        
        # Signal SSE end
        try:
            queue.put_nowait("__SSE_END__")
        except Exception:
            pass
        
        logger.info(f"[{job_id[:8]}] Background extraction completed")
        
    except Exception as e:
        logger.error(f"[{job_id[:8]}] Background extraction failed: {e}")
        if job_id in jobs:
            jobs[job_id].message = f"Extraction failed: {str(e)}"


@app.post("/api/check-modules")
async def check_selected_modules(
    background_tasks: BackgroundTasks,
    job_id: str = Form(...),
    modules: str = Form(...)  # Comma-separated module names
):
    """
    Run compliance check on selected modules only
    
    Args:
        job_id: Job ID from upload-preview
        modules: Comma-separated list of modules (e.g., "Structure,ESG,Performance")
                 or "all" for all modules
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Parse modules
    if modules.lower() == "all":
        selected_modules = None  # Run all modules
    else:
        selected_modules = [m.strip() for m in modules.split(",")]
    
    # Get file paths
    job_dir = UPLOAD_DIR / job_id
    pptx_files = list(job_dir.glob("*.pptx"))
    
    if not pptx_files:
        raise HTTPException(status_code=404, detail="PowerPoint file not found")
    
    pptx_path = str(pptx_files[0])
    metadata_path = str(job_dir / "metadata.json")
    
    # Update job status
    jobs[job_id].status = "pending"
    jobs[job_id].message = f"Starting compliance check on {modules}"
    db_update_job_status(job_id, "pending", jobs[job_id].progress, jobs[job_id].message)
    
    # Start background processing
    background_tasks.add_task(
        process_compliance_check,
        job_id=job_id,
        pptx_path=pptx_path,
        metadata_path=metadata_path,
        prospectus_path=None,
        selected_modules=selected_modules
    )
    
    return {
        "job_id": job_id,
        "status": "pending",
        "message": f"Compliance check started for modules: {modules}",
        "check_status_url": f"/api/status/{job_id}"
    }


@app.get("/api/slides/{job_id}")
async def get_slides(job_id: str):
    """
    Get slide preview data for a job
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_dir = UPLOAD_DIR / job_id
    pptx_files = list(job_dir.glob("*.pptx"))
    
    if not pptx_files:
        raise HTTPException(status_code=404, detail="PowerPoint file not found")
    
    try:
        from pptx_preview import extract_slide_thumbnails
        slides = extract_slide_thumbnails(str(pptx_files[0]))
        
        return {
            "job_id": job_id,
            "slides": slides,
            "total_slides": len(slides)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract slides: {str(e)}")


@app.get("/api/stream/{job_id}/decision-trace")
async def stream_decision_trace(job_id: str):
    """Server-Sent Events endpoint to stream decision trace events for a job."""
    queue = get_sse_queue(job_id)

    async def event_generator():
        # Send an initial start event
        start_msg = {"type": "sse_start", "job_id": job_id, "timestamp": datetime.now().isoformat()}
        yield f"data: {json.dumps(start_msg)}\n\n"

        # If job already completed or failed, end the stream immediately
        job = jobs.get(job_id)
        if job and job.status in ("completed", "failed"):
            end_msg = {"type": "sse_end", "job_id": job_id, "timestamp": datetime.now().isoformat()}
            yield f"data: {json.dumps(end_msg)}\n\n"
            return

        while True:
            try:
                event = await queue.get()
                if event == "__SSE_END__":
                    end_msg = {"type": "sse_end", "job_id": job_id, "timestamp": datetime.now().isoformat()}
                    yield f"data: {json.dumps(end_msg)}\n\n"
                    break
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.CancelledError:
                break
            except Exception as e:
                err_msg = {"type": "error", "message": str(e), "job_id": job_id}
                yield f"data: {json.dumps(err_msg)}\n\n"
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/download/{job_id}/violations")
async def download_violations(job_id: str):
    if job_id in jobs:
        status = jobs[job_id].status
    else:
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        status = db_job.get("status", "")
    if status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    violations_path = RESULTS_DIR / job_id / "CONSOLIDATED_VIOLATIONS.json"
    if not violations_path.exists():
        raise HTTPException(status_code=404, detail="Violations file not found")
    return FileResponse(path=violations_path, filename="violations.json", media_type="application/json")


@app.get("/api/download/{job_id}/result")
async def download_result(job_id: str):
    if job_id in jobs:
        status = jobs[job_id].status
    else:
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        status = db_job.get("status", "")
    if status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    result_path = RESULTS_DIR / job_id / "pipeline_result.json"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found")
    return FileResponse(path=result_path, filename="pipeline_result.json", media_type="application/json")


@app.get("/api/download/{job_id}/extracted-json")
async def download_extracted_json(job_id: str):
    # Look for extracted JSON in uploads directory (serve if exists)
    job_upload_dir = UPLOAD_DIR / job_id
    extracted_path = job_upload_dir / "extracted_document.json"
    if not extracted_path.exists():
        extracted_path = job_upload_dir / "document.json"
    if not extracted_path.exists():
        raise HTTPException(status_code=404, detail="Extracted JSON not found")
    with open(extracted_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return JSONResponse(content=data)


@app.get("/api/download/{job_id}/pptx")
async def download_annotated_pptx(job_id: str):
    if job_id in jobs:
        status = jobs[job_id].status
    else:
        db_job = db_get_job(job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        status = db_job.get("status", "")
    if status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    job_upload_dir = UPLOAD_DIR / job_id
    pptx_files = list(job_upload_dir.glob("*.pptx"))
    if not pptx_files:
        raise HTTPException(status_code=404, detail="PowerPoint file not found")
    pptx_path = pptx_files[0]
    return FileResponse(path=pptx_path, filename=f"original_{pptx_path.name}", media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")


@app.get("/api/jobs")
async def list_jobs():
    """
    List all jobs with their current status
    """
    return db_list_jobs()


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its associated files
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete upload directory
    job_upload_dir = UPLOAD_DIR / job_id
    if job_upload_dir.exists():
        shutil.rmtree(job_upload_dir)
    
    # Delete results directory
    job_results_dir = RESULTS_DIR / job_id
    if job_results_dir.exists():
        shutil.rmtree(job_results_dir)
    
    # Remove from jobs dict
    if job_id in jobs:
        del jobs[job_id]
    # Also delete in DB
    db_delete_job(job_id)
    return {"message": f"Job {job_id} deleted successfully"}


@app.get("/api/health")
async def health_check():
    """
    Detailed health check
    """
    return {
        "status": "healthy",
        "active_jobs": len([j for j in jobs.values() if j.status == "processing"]),
        "completed_jobs": len([j for j in jobs.values() if j.status == "completed"]),
        "failed_jobs": len([j for j in jobs.values() if j.status == "failed"]),
        "total_jobs": len(jobs),
        "upload_dir": str(UPLOAD_DIR),
        "results_dir": str(RESULTS_DIR)
    }


# ==================== HISTORY & REVIEW ENDPOINTS ====================

@app.get("/api/history")
async def get_history():
    return db_get_history()


@app.get("/api/history/stats")
async def get_history_stats():
    return db_get_history_stats()


@app.get("/api/history/{job_id}")
async def get_history_item(job_id: str):
    item = db_get_history_item(job_id)
    if not item:
        raise HTTPException(status_code=404, detail="Job not found in history")
    return item


@app.put("/api/history/{job_id}/review")
async def update_review_status(
    job_id: str,
    review_status: str = Form(...),
    reviewer_notes: Optional[str] = Form(None)
):
    valid_statuses = ["pending_review", "validated", "needs_revision"]
    if review_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid review_status. Must be one of: {valid_statuses}")
    upsert_review(job_id, review_status, reviewer_notes)
    item = db_get_history_item(job_id)
    if not item:
        raise HTTPException(status_code=404, detail="Job not found in history")
    return {"message": f"Review status updated to '{review_status}'", "job": item}


@app.delete("/api/history/{job_id}")
async def delete_history_item(job_id: str):
    # Delete upload directory
    job_upload_dir = UPLOAD_DIR / job_id
    if job_upload_dir.exists():
        shutil.rmtree(job_upload_dir)
    # Delete results directory
    job_results_dir = RESULTS_DIR / job_id
    if job_results_dir.exists():
        shutil.rmtree(job_results_dir)
    # Remove from jobs dict if present
    if job_id in jobs:
        del jobs[job_id]
    # Remove from history (in-memory if present)
    if job_id in job_history:
        del job_history[job_id]
        save_history()
    # Also delete in DB
    db_delete_job(job_id)
    return {"message": f"Job {job_id} deleted from history"}


if __name__ == "__main__":
    import subprocess
    import sys
    
    # Load environment variables from path-utils
    from load_env import load_env_file
    from path_utils import ENV_FILE
    load_env_file(str(ENV_FILE))
    
    print("="*80)
    print("🚀 Starting PowerPoint Compliance Checker API")
    print("="*80)
    print(f"📡 API URL: http://localhost:8000")
    print(f"📚 API docs: http://localhost:8000/docs")
    print(f"📁 Upload directory: {UPLOAD_DIR.absolute()}")
    print(f"📁 Results directory: {RESULTS_DIR.absolute()}")
    print("="*80)
    
    # Run uvicorn using subprocess to avoid the reload warning
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ])
