@echo off
REM ============================================================
REM ODDO BHF Compliance RAG - Windows Setup Script
REM ============================================================

echo.
echo ============================================================
echo   ODDO BHF COMPLIANCE RAG - SETUP
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [1/5] Python found!
python --version
echo.

REM Create virtual environment
echo [2/5] Creating virtual environment...
if exist venv (
    echo Virtual environment already exists. Skipping...
) else (
    python -m venv venv
    echo Virtual environment created!
)
echo.

REM Activate virtual environment
echo [3/5] Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install dependencies
echo [4/5] Installing dependencies...
echo This may take 2-5 minutes...
pip install -r requirements.txt
echo.

REM Setup .env file
echo [5/5] Setting up configuration...
if exist .env (
    echo .env file already exists. Skipping...
) else (
    copy .env.example .env
    echo .env file created!
    echo.
    echo ============================================================
    echo   IMPORTANT: EDIT .env FILE WITH YOUR API KEY
    echo ============================================================
    echo.
    echo Open .env in Notepad and add your Anthropic API key:
    echo   ANTHROPIC_API_KEY=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
    echo.
    echo Get your API key from: https://console.anthropic.com/
    echo.
    pause
)
echo.

echo ============================================================
echo   SETUP COMPLETE!
echo ============================================================
echo.
echo To run the system:
echo   1. Make sure .env has your API key
echo   2. Run: python quick_start.py
echo.
echo Press any key to exit...
pause >nul
