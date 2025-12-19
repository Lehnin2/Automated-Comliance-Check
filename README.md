# PowerPoint Compliance Checker

A full-stack, AI-powered platform to extract, analyze, and validate financial PowerPoint presentations for regulatory compliance.

## Table of Contents
- Introduction
- Features
- Architecture Overview
- Tech Stack
- Project Structure
- Getting Started
  - Backend (FastAPI)
  - Frontend (React)
  - Environment Variables
- Usage Walkthrough
- API Reference (Backend)
- Extraction Methods & Decision Trace
- Data & Outputs
- Development Tips
- Troubleshooting
- Testing
- Contributing

---

## Introduction
PowerPoint Compliance Checker streamlines the review process for financial presentations by automatically extracting slide content, running compliance checks against curated rule sets, and generating violation reports with clear summaries. It offers multiple extraction engines, including a multi-agent LLM workflow, and a modern UI for uploads, previews, and results.

## Features

### Document Processing
- Upload PowerPoint presentations with metadata files
- Live slide preview during upload process
- Background extraction processing with status tracking
- Support for multiple document formats and sizes

### Advanced Extraction
- Multiple extraction approaches including baseline and AI-powered methods
- Sophisticated language model integration for deep document understanding
- Multi-agent workflows for complex reasoning and analysis
- High-performance parallel processing capabilities

### Compliance Analysis
- Comprehensive compliance checking across 8 specialized modules:
  - **Structure**: Document format and layout validation
  - **Registration**: Fund registration requirements verification
  - **ESG**: Environmental, Social, and Governance compliance
  - **Disclaimers**: Required legal disclaimer validation
  - **Performance**: Performance data presentation rules
  - **Values**: Securities and values mention compliance
  - **Prospectus**: Prospectus alignment requirements
  - **General**: General compliance guidelines

### Reporting & Visualization
- Detailed violation reports with specific locations and recommendations
- Master compliance report summarizing all findings
- Annotated PowerPoint download highlighting issues
- JSON data export for integration with other systems
- Decision trace visualization for transparency in AI-powered extraction

### User Interface
- Modern React-based interface with Material Design components
- Smooth animations and transitions using Framer Motion
- Real-time status updates and progress indicators
- Intuitive file upload and management system
- Comprehensive results viewer with filtering and search capabilities

## Architecture Overview

```
┌─────────────────────┐
│   Frontend Layer    │
│   (React + MUI)     │
└──────────┬──────────┘
           │ HTTP/REST API
           │
┌──────────▼──────────────────────────────────────────┐
│              FastAPI Backend                        │
│  ┌────────────────────────────────────────────┐    │
│  │         API Layer (main.py)                │    │
│  │  • Upload Management                       │    │
│  │  • Background Task Orchestration           │    │
│  │  • Job Status Tracking                     │    │
│  │  • Results Distribution                    │    │
│  └─────────┬──────────────────────────────────┘    │
│            │                                        │
│  ┌─────────▼──────────────────────────────────┐    │
│  │   Extraction Pipeline                      │    │
│  │   (extraction_manager.py)                  │    │
│  │                                            │    │
│  │   ┌─────────────────────────────────┐     │    │
│  │   │  Baseline Extraction            │     │    │
│  │   │  (python-pptx)                  │     │    │
│  │   └─────────────────────────────────┘     │    │
│  │                                            │    │
│  │   ┌─────────────────────────────────┐     │    │
│  │   │  AI-Powered Extraction          │     │    │
│  │   │  (fida.py + LangGraph)          │     │    │
│  │   │  • Multi-agent workflows        │     │    │
│  │   │  • Decision trace generation    │     │    │
│  │   │  • Gemini API integration       │     │    │
│  │   └─────────────────────────────────┘     │    │
│  │                                            │    │
│  │   ┌─────────────────────────────────┐     │    │
│  │   │  High-Performance Processing    │     │    │
│  │   │  • Groq API                     │     │    │
│  │   │  • TokenFactory API             │     │    │
│  │   │  • Parallel processing          │     │    │
│  │   └─────────────────────────────────┘     │    │
│  └─────────┬──────────────────────────────────┘    │
│            │ extracted_document.json                │
│            │                                        │
│  ┌─────────▼──────────────────────────────────┐    │
│  │   Compliance Pipeline                      │    │
│  │   (compliance_backend.py)                  │    │
│  │                                            │    │
│  │   ┌─────────────────────────────────┐     │    │
│  │   │  Rule Engine                    │     │    │
│  │   │  (run_all_compliance_checks.py) │     │    │
│  │   │                                 │     │    │
│  │   │  • Structure Module             │     │    │
│  │   │  • Registration Module          │     │    │
│  │   │  • ESG Module                   │     │    │
│  │   │  • Disclaimers Module           │     │    │
│  │   │  • Performance Module           │     │    │
│  │   │  • Values Module                │     │    │
│  │   │  • Prospectus Module            │     │    │
│  │   │  • General Module               │     │    │
│  │   └─────────────────────────────────┘     │    │
│  │                                            │    │
│  │   ┌─────────────────────────────────┐     │    │
│  │   │  Report Generation              │     │    │
│  │   │  • Violation consolidation      │     │    │
│  │   │  • Master report creation       │     │    │
│  │   │  • Annotated PPTX generation    │     │    │
│  │   └─────────────────────────────────┘     │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
           │
           │ File System Storage
           │
┌──────────▼──────────────────────────────────────────┐
│              Data Layer                             │
│  ┌────────────────────┐  ┌────────────────────┐    │
│  │  Uploads Storage   │  │  Results Storage   │    │
│  │  (by job_id)       │  │  (by job_id)       │    │
│  └────────────────────┘  └────────────────────┘    │
│                                                     │
│  ┌────────────────────┐  ┌────────────────────┐    │
│  │  Reference Data    │  │  Compliance Rules  │    │
│  │  (CSV files)       │  │  (JSON files)      │    │
│  └────────────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Pipeline Data Flow

**Phase 1: Document Upload & Preview**
```
User ──> Frontend ──> POST /api/upload-preview
                         │
                         ├─> Save files to uploads/<job_id>/
                         │   • presentation.pptx
                         │   • metadata.json
                         │   • prospectus.docx (optional)
                         │
                         └─> Generate slide previews
                             └─> pptx_preview.py
                                 └─> Returns base64 images
```

**Phase 2: Document Extraction**
```
User ──> Frontend ──> Background extraction initiated
                         │
                         └─> extraction_manager.py
                             │
                             ├─> Method Selection Logic:
                             │   ├─> Baseline: python-pptx
                             │   ├─> AI-Powered: fida.py + Gemini
                             │   └─> High-Performance: Groq + TokenFactory
                             │
                             └─> Output: uploads/<job_id>/extracted_document.json
                                 {
                                   "slides": [...],
                                   "metadata": {...},
                                   "decision_trace": [...] (if AI-powered)
                                 }
```

**Phase 3: Compliance Analysis**
```
User ──> Frontend ──> POST /api/check-modules
                         │
                         └─> compliance_backend.py
                             │
                             ├─> Load extracted_document.json
                             │
                             ├─> run_all_compliance_checks.py
                             │   │
                             │   ├─> Structure validation
                             │   ├─> Registration verification
                             │   ├─> ESG compliance
                             │   ├─> Disclaimers check
                             │   ├─> Performance rules
                             │   ├─> Values mentions
                             │   ├─> Prospectus alignment
                             │   └─> General guidelines
                             │
                             └─> Generate outputs:
                                 ├─> master_compliance_report.txt
                                 ├─> violations.json
                                 └─> annotated_presentation.pptx
```

**Phase 4: Results & Visualization**
```
User ──> Frontend ──> Results Viewer
           │
           ├─> GET /api/download/{job_id}/report
           │   └─> master_compliance_report.txt
           │
           ├─> GET /api/download/{job_id}/violations
           │   └─> violations.json (displayed in UI)
           │
           ├─> GET /api/download/{job_id}/pptx
           │   └─> annotated_presentation.pptx
           │
           └─> JSON Viewer + Decision Trace
               └─> extracted_document.json with trace visualization
```

### Data Flow
1. **Upload Phase**: User uploads PowerPoint and metadata files through React interface
2. **Extraction Phase**: Backend processes documents using available extraction methods
3. **Analysis Phase**: Compliance engine applies rule sets to extracted content
4. **Reporting Phase**: System generates comprehensive violation reports and recommendations
5. **Visualization Phase**: Frontend displays results with interactive viewers and decision traces

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs with Python 3.9+ based on standard Python type hints
- **Uvicorn**: Lightning-fast ASGI server implementation, using uvloop and httptools
- **Pydantic**: Data validation using Python type annotations, enforces type hints at runtime
- **Python 3.9+**: Core language runtime with async support

### Extraction Engines
- **python-pptx**: Pure Python library for reading and writing PowerPoint files, provides baseline structured extraction
- **LangGraph**: Framework for building stateful, multi-actor applications with LLMs, powers the Gemini multi-agent workflow
- **Gemini API**: Google's multimodal AI model for complex document understanding and reasoning
- **Groq API**: Ultra-fast AI inference platform for rapid document conversion and metadata enrichment
- **TokenFactory**: Specialized document parsing service for parallel extraction and format conversion

### Frontend
- **React 18**: Latest version of the popular JavaScript library for building user interfaces
- **Material UI (MUI)**: React component library implementing Google's Material Design system
- **Framer Motion**: Production-ready motion library for React, powers smooth animations and transitions
- **Axios**: Promise-based HTTP client for the browser and Node.js, handles all API communications

### Data & Rules
- **JSON Rule Sets**: Structured compliance rules for each module (Structure, Registration, ESG, Disclaimers, Performance, Values, Prospectus, General)
- **CSV Files**: Registration data and disclaimer templates stored in structured format
- **Document Storage**: Local file system for uploads, results, and extracted documents

## Project Structure

```
trial-main/
├── backend/                    # FastAPI application and compliance engine
│   ├── main.py                 # Main FastAPI application with all REST endpoints
│   ├── extraction_manager.py   # Orchestrates document extraction using different engines
│   ├── fida.py                 # Multi-agent AI extraction with detailed decision tracking
│   ├── compliance_backend.py   # Compliance checking orchestrator and report generation
│   ├── run_all_compliance_checks.py  # Core compliance rule engine
│   ├── extraction.py           # Base extraction utilities and helpers
│   ├── pptx_preview.py         # PowerPoint slide preview generation
│   ├── pptx_utils.py           # PowerPoint file manipulation utilities
│   ├── llm_manager.py          # Large language model integration manager
│   ├── safa.py                 # Alternative extraction engine implementation
│   ├── slim.py                 # Lightweight extraction processor
│   ├── db.py                   # Database operations for job and history management
│   ├── logger_config.py        # Application logging configuration
│   ├── path_utils.py           # File path handling utilities
│   ├── load_env.py             # Environment variable loading
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variables template
│   ├── *rules.json             # Compliance rule definitions (8 modules)
│   ├── *.csv                   # Reference data files (registration, disclaimers)
│   ├── test_*.py               # Unit tests for each compliance module
│   ├── validation_report.txt   # Validation documentation
│   ├── uploads/                # Uploaded files storage (organized by job ID)
│   └── results/                # Generated reports and outputs (organized by job ID)
├── frontend/                   # React-based user interface
│   ├── src/
│   │   ├── AppEnhanced.js      # Main application component with routing
│   │   ├── components/         # Reusable UI components
│   │   │   ├── TechnologiesSection.jsx  # Technology showcase section
│   │   │   ├── FileUpload.jsx            # File upload component
│   │   │   ├── SlidePreview.jsx          # PowerPoint slide preview
│   │   │   ├── ResultsViewer.jsx         # Results display component
│   │   │   ├── JSONViewer.jsx            # JSON data viewer with syntax highlighting
│   │   │   └── TraceViewer.jsx           # Decision trace visualization
│   │   ├── services/         # API communication services
│   │   ├── utils/            # Utility functions and helpers
│   │   └── styles/           # CSS and styling files
│   ├── public/                 # Static assets and index.html
│   ├── package.json            # Node.js dependencies and scripts
│   └── README.md               # Frontend-specific documentation
├── documents/                  # Sample and reference documents
│   ├── *.pptx                  # Sample PowerPoint presentations for testing
│   ├── metadata.json           # Sample metadata files
│   ├── exemple.json            # Example configuration file
│   ├── prospectus.docx         # Sample prospectus document
│   ├── disclaimers.csv         # Disclaimer templates database
│   └── registration.csv        # Fund registration reference data
└── rules/                      # Compliance rule definitions
    ├── structure_rules.json    # Document structure validation rules
    ├── registration_rules.json # Fund registration compliance rules
    ├── esg_rules.json          # Environmental, Social, Governance rules
    ├── disclaimers_rules.json  # Required disclaimer validation
    ├── performance_rules.json  # Performance data presentation rules
    ├── values_rules.json       # Securities and values mention rules
    ├── prospectus_rules.json   # Prospectus alignment requirements
    └── general_rules.json      # General compliance guidelines
```

### Key Backend Components

**API Layer (main.py)**
- RESTful endpoints for file upload, slide preview, extraction, and compliance checking
- Background task management for long-running operations
- Job tracking and status monitoring
- Download endpoints for generated reports and processed files
- History management for completed analyses

**Extraction System (extraction_manager.py)**
- Coordinates multiple extraction approaches based on available resources
- Manages fallback mechanisms when primary extraction methods are unavailable
- Handles PowerPoint file parsing and content extraction
- Generates standardized JSON output format for downstream processing

**AI-Powered Extraction (fida.py)**
- Implements advanced multi-agent extraction using language models
- Provides detailed decision tracking and explanation capabilities
- Supports complex document understanding and reasoning
- Generates comprehensive extraction traces for transparency

**Compliance Engine (compliance_backend.py)**
- Orchestrates compliance checking across multiple rule modules
- Consolidates violations from different compliance areas
- Generates unified reports with clear violation summaries
- Supports both individual module checking and comprehensive analysis

**Rule Processing (run_all_compliance_checks.py)**
- Core engine that applies compliance rules to extracted content
- Supports 8 different compliance modules with specialized rule sets
- Generates detailed violation reports with specific locations and recommendations
- Provides both summary and detailed violation information

## Getting Started
### Prerequisites
- Python 3.9+
- Node.js 16+

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt

# Environment
copy .env.example .env
# Edit .env and add your API keys

# Run the API
python main.py
```
Backend runs at http://localhost:8000 (docs: http://localhost:8000/docs)

### Frontend (React)
```bash
cd frontend
npm install
npm start
```
Frontend runs at http://localhost:3000 (proxy to http://localhost:8000)

### Environment Variables

Create a `.env` file in the backend directory with your API keys:

**AI Service APIs** (optional - system will fall back to baseline extraction if not provided):
- `GEMINI_API_KEY`: Google Gemini API for advanced AI-powered extraction
- `GROQ_API_KEY`: Groq API for high-performance processing
- `TOKENFACTORY_API_KEY`: TokenFactory API for specialized document parsing

**Configuration**:
- `API_BASE_URL`: Base URL for API services (default: http://localhost:8000)
- `UPLOAD_DIR`: Directory for uploaded files (default: ./uploads)
- `RESULTS_DIR`: Directory for generated reports (default: ./results)

**Note**: The system is designed to work without API keys using baseline extraction. Advanced features require corresponding API keys.

## Usage Walkthrough
1. Open the frontend at http://localhost:3000
2. Upload a PPTX and metadata JSON (optional prospectus is auto-located if missing)
3. Preview slides while background extraction runs
4. Start compliance check (select modules or run all)
5. Review results: violations, report, annotated PPTX
6. Open JSON viewer and, when using FD, explore the Trace tab (decision_trace)

## API Reference (Backend)
- Health: `GET /api/health`
- Upload & Preview: `POST /api/upload-preview`
- Slides preview: `GET /api/slides/{job_id}`
- Job status: `GET /api/status/{job_id}`
- Extracted JSON: `GET /api/download/{job_id}/extracted-json`
- Compliance (selected modules): `POST /api/check-modules`
- Reports: `GET /api/download/{job_id}/report`, `GET /api/download/{job_id}/violations`, `GET /api/download/{job_id}/pptx`
- Jobs: `GET /api/jobs`, `DELETE /api/jobs/{job_id}`
- History: `GET /api/history`, `GET /api/history/{job_id}`, `PUT /api/history/{job_id}/review`, `DELETE /api/history/{job_id}`

## Document Extraction & Analysis

The platform offers multiple extraction approaches to convert PowerPoint presentations into structured data for compliance analysis:

### Baseline Extraction
- Uses established Python libraries to parse PowerPoint files
- Provides fundamental text extraction and slide structure analysis
- Reliable fallback method when advanced options are unavailable

### Advanced AI-Powered Extraction
- Leverages sophisticated language models for deep document understanding
- Implements multi-agent workflows for complex reasoning tasks
- Generates detailed decision traces showing the AI's analytical process
- Provides transparency into how extraction decisions are made

### High-Performance Processing
- Utilizes specialized APIs for rapid document conversion
- Supports parallel processing for improved performance
- Offers enriched metadata extraction beyond basic text content

### Decision Trace Feature
- Available with advanced extraction methods
- Captures step-by-step reasoning and decision-making process
- Stored in the extracted document JSON for transparency
- Visualized in the frontend interface for user review
- Helpful for understanding complex extraction decisions and debugging

## Data & Outputs
- Uploads: `backend/uploads/<job_id>/` (stores PPTX, metadata, extracted_document.json)
- Results: `backend/results/<job_id>/` (pipeline outputs: reports, violations, annotated PPTX)
- History: persisted for listing jobs and summaries

## Development Tips
- The backend uses `subprocess.run` to launch Uvicorn with `--reload` for better DX when running `python main.py`
- CORS is enabled for local development; configure origins for production
- Frontend proxy is set to `http://localhost:8000` in `frontend/package.json`

## Troubleshooting

### Frontend Issues
- **Compile errors**: Ensure all JSX elements are properly closed. If you encounter Babel `Unexpected token` errors, check recent edits to image tags and container components
- **Port conflicts**: Change frontend port via `PORT=3001 npm start` or modify the backend port in `main.py`

### Backend Issues
- **Reload warning**: Resolved by launching Uvicorn via `python main.py` (already configured)
- **Missing API keys**: The system will automatically fall back to baseline extraction when advanced APIs are unavailable
- **Prospectus missing**: Backend attempts to locate prospectus files in the `documents/` directory or creates a placeholder document

### General Issues
- **File upload failures**: Check file permissions and ensure upload directories exist
- **Extraction timeouts**: Large presentations may take longer; monitor job status via the API
- **Memory issues**: For very large files, consider increasing Python memory limits

## Testing
- Backend rule tests are available under `backend/test_*.py` (ESG, General, Performance, Prospectus, Structure, Values)
- Run via your preferred test runner or manually execute scripts as needed

## Contributing
- Fork the repository and create feature branches
- Keep secrets out of version control (.env)
- Write clear commit messages and add tests when touching rules or extraction logic
- Open PRs with a short demo and description of changes
