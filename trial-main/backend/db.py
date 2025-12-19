#!/usr/bin/env python3
"""
Minimal SQLite DB layer for PowerPoint Compliance Checker
- Zero external dependency (uses Python's sqlite3)
- Persists jobs, file paths, and review status

Tables:
- jobs(job_id PRIMARY KEY, filename, created_at, completed_at, status, progress, message,
       extraction_method, has_prospectus, total_violations, critical_violations,
       major_violations, minor_violations, duration_seconds, review_status, reviewer_notes)
- job_files(job_id PRIMARY KEY, path_pptx, path_metadata, path_prospectus,
           path_report, path_violations_json, path_result_json, path_extracted_json)
"""
import sqlite3
from typing import Optional, Dict, Any
from datetime import datetime

from path_utils import RESULTS_DIR
from logger_config import logger

DB_PATH = RESULTS_DIR / "app.db"


def _connect():
    return sqlite3.connect(str(DB_PATH))


def init_db():
    """Initialize database and create tables if not exist"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                filename TEXT,
                created_at TEXT,
                completed_at TEXT,
                status TEXT,
                progress INTEGER DEFAULT 0,
                message TEXT,
                extraction_method TEXT,
                has_prospectus INTEGER,
                total_violations INTEGER DEFAULT 0,
                critical_violations INTEGER DEFAULT 0,
                major_violations INTEGER DEFAULT 0,
                minor_violations INTEGER DEFAULT 0,
                duration_seconds REAL DEFAULT 0,
                review_status TEXT DEFAULT 'pending_review',
                reviewer_notes TEXT
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS job_files (
                job_id TEXT PRIMARY KEY,
                path_pptx TEXT,
                path_metadata TEXT,
                path_prospectus TEXT,
                path_report TEXT,
                path_violations_json TEXT,
                path_result_json TEXT,
                path_extracted_json TEXT
            )
            """
        )
        conn.commit()
        logger.info(f"SQLite DB initialized at: {DB_PATH}")
    finally:
        conn.close()


def create_job(job_id: str, filename: str, status: str, created_at: str,
               review_status: str = "pending_review",
               extraction_method: Optional[str] = None,
               has_prospectus: Optional[bool] = None):
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT OR REPLACE INTO jobs (
                job_id, filename, created_at, status, progress, message,
                extraction_method, has_prospectus, review_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job_id, filename, created_at, status, 0, "",
                extraction_method, int(has_prospectus) if has_prospectus is not None else None,
                review_status
            )
        )
        conn.commit()
    finally:
        conn.close()


def update_job_status(job_id: str, status: str, progress: int, message: str):
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE jobs SET status=?, progress=?, message=? WHERE job_id=?",
            (status, progress, message, job_id)
        )
        conn.commit()
    finally:
        conn.close()


def set_job_summary(job_id: str,
                    total_violations: int,
                    critical_violations: int,
                    major_violations: int,
                    minor_violations: int,
                    duration_seconds: float,
                    completed_at: Optional[str] = None):
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE jobs SET
                total_violations=?, critical_violations=?, major_violations=?, minor_violations=?,
                duration_seconds=?, completed_at=?, status=?, progress=?, message=?
            WHERE job_id=?
            """,
            (
                total_violations, critical_violations, major_violations, minor_violations,
                duration_seconds, completed_at or datetime.now().isoformat(),
                "completed", 100, "Compliance check completed successfully", job_id
            )
        )
        conn.commit()
    finally:
        conn.close()


def save_job_files(job_id: str,
                   path_pptx: Optional[str] = None,
                   path_metadata: Optional[str] = None,
                   path_prospectus: Optional[str] = None,
                   path_report: Optional[str] = None,
                   path_violations_json: Optional[str] = None,
                   path_result_json: Optional[str] = None,
                   path_extracted_json: Optional[str] = None):
    conn = _connect()
    try:
        cur = conn.cursor()
        # Upsert pattern for single-row per job_id
        cur.execute("SELECT job_id FROM job_files WHERE job_id=?", (job_id,))
        exists = cur.fetchone() is not None
        if exists:
            cur.execute(
                """
                UPDATE job_files SET
                    path_pptx=COALESCE(?, path_pptx),
                    path_metadata=COALESCE(?, path_metadata),
                    path_prospectus=COALESCE(?, path_prospectus),
                    path_report=COALESCE(?, path_report),
                    path_violations_json=COALESCE(?, path_violations_json),
                    path_result_json=COALESCE(?, path_result_json),
                    path_extracted_json=COALESCE(?, path_extracted_json)
                WHERE job_id=?
                """,
                (path_pptx, path_metadata, path_prospectus, path_report,
                 path_violations_json, path_result_json, path_extracted_json, job_id)
            )
        else:
            cur.execute(
                """
                INSERT INTO job_files (
                    job_id, path_pptx, path_metadata, path_prospectus,
                    path_report, path_violations_json, path_result_json, path_extracted_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (job_id, path_pptx, path_metadata, path_prospectus,
                 path_report, path_violations_json, path_result_json, path_extracted_json)
            )
        conn.commit()
    finally:
        conn.close()


def upsert_review(job_id: str, review_status: str, reviewer_notes: Optional[str] = None):
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE jobs SET review_status=?, reviewer_notes=? WHERE job_id=?",
            (review_status, reviewer_notes, job_id)
        )
        conn.commit()
    finally:
        conn.close()


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute("SELECT job_id, status, progress, message FROM jobs WHERE job_id=?", (job_id,))
        row = cur.fetchone()
        if not row:
            return None
        return {
            "job_id": row[0],
            "status": row[1],
            "progress": row[2],
            "message": row[3],
        }
    finally:
        conn.close()


def list_jobs() -> Dict[str, Any]:
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute("SELECT job_id, status, progress, message FROM jobs ORDER BY created_at DESC")
        rows = cur.fetchall()
        return {
            "total_jobs": len(rows),
            "jobs": [
                {
                    "job_id": r[0],
                    "status": r[1],
                    "progress": r[2],
                    "message": r[3],
                    "has_results": r[1] == "completed"
                } for r in rows
            ]
        }
    finally:
        conn.close()


def delete_job(job_id: str):
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM job_files WHERE job_id=?", (job_id,))
        cur.execute("DELETE FROM jobs WHERE job_id=?", (job_id,))
        conn.commit()
    finally:
        conn.close()


def get_history() -> Dict[str, Any]:
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT job_id, filename, created_at, completed_at, status, review_status,
                   total_violations, critical_violations, reviewer_notes
            FROM jobs ORDER BY created_at DESC
            """
        )
        rows = cur.fetchall()
        jobs = []
        for r in rows:
            jobs.append({
                "job_id": r[0],
                "filename": r[1],
                "created_at": r[2],
                "completed_at": r[3],
                "status": r[4],
                "review_status": r[5],
                "total_violations": r[6] or 0,
                "critical_violations": r[7] or 0,
                "reviewer_notes": r[8]
            })
        return {"total": len(jobs), "jobs": jobs}
    finally:
        conn.close()


def get_history_item(job_id: str) -> Optional[Dict[str, Any]]:
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT job_id, filename, created_at, completed_at, status, review_status,
                   total_violations, critical_violations, reviewer_notes
            FROM jobs WHERE job_id=?
            """,
            (job_id,)
        )
        r = cur.fetchone()
        if not r:
            return None
        return {
            "job_id": r[0],
            "filename": r[1],
            "created_at": r[2],
            "completed_at": r[3],
            "status": r[4],
            "review_status": r[5],
            "total_violations": r[6] or 0,
            "critical_violations": r[7] or 0,
            "reviewer_notes": r[8]
        }
    finally:
        conn.close()


def get_history_stats() -> Dict[str, Any]:
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute("SELECT status, review_status FROM jobs")
        rows = cur.fetchall()
        total = len(rows)
        by_status = {"completed": 0, "failed": 0, "processing": 0}
        by_review = {"pending_review": 0, "validated": 0, "needs_revision": 0}
        for status, review in rows:
            if status in by_status:
                by_status[status] += 1
            elif status in ["pending", "preview"]:
                by_status["processing"] += 1
            else:
                by_status["processing"] += 1
            if review in by_review:
                by_review[review] += 1
        return {"total_jobs": total, "by_status": by_status, "by_review": by_review}
    finally:
        conn.close()