@echo off
REM Security Check Script for Takers Marketplace
REM Run this before every deployment!

echo ===============================================
echo   TAKERS MARKETPLACE - SECURITY CHECK
echo ===============================================
echo.

echo [1/10] Checking for .env files in Git...
git ls-files | findstr "\.env" > nul
if %errorlevel% == 0 (
    echo [FAIL] .env files are tracked by Git!
    echo ACTION: Run 'git rm --cached .env' to remove
) else (
    echo [PASS] No .env files tracked
)
echo.

echo [2/10] Checking DEBUG mode...
cd backend
findstr /C:"DEBUG = True" config\settings.py > nul
if %errorlevel% == 0 (
    echo [WARNING] DEBUG might be True in code
    echo CHECK: Verify DEBUG controlled by environment
) else (
    echo [PASS] DEBUG not hardcoded to True
)
cd ..
echo.

echo [3/10] Checking for hardcoded secrets...
findstr /S /I "password.*=.*['\"]" backend\*.py > nul 2>&1
if %errorlevel% == 0 (
    echo [WARNING] Possible hardcoded passwords found
    echo ACTION: Review and move to environment variables
) else (
    echo [PASS] No obvious hardcoded passwords
)
echo.

echo [4/10] Checking .gitignore...
if exist .gitignore (
    findstr /C:".env" .gitignore > nul
    if %errorlevel% == 0 (
        echo [PASS] .gitignore includes .env
    ) else (
        echo [FAIL] .gitignore missing .env
    )
) else (
    echo [FAIL] .gitignore file not found!
)
echo.

echo [5/10] Checking for exposed database...
git ls-files | findstr "db.sqlite3" > nul
if %errorlevel% == 0 (
    echo [FAIL] Database tracked by Git!
    echo ACTION: Run 'git rm --cached backend/db.sqlite3'
) else (
    echo [PASS] Database not tracked
)
echo.

echo [6/10] Checking SECRET_KEY...
cd backend
findstr /C:"SECRET_KEY = \"django-insecure" config\settings.py > nul
if %errorlevel% == 0 (
    echo [WARNING] Using default SECRET_KEY
    echo ACTION: Generate new SECRET_KEY for production
) else (
    echo [PASS] SECRET_KEY appears customized
)
cd ..
echo.

echo [7/10] Checking ALLOWED_HOSTS...
cd backend
findstr /C:"ALLOWED_HOSTS = \[\]" config\settings.py > nul
if %errorlevel% == 0 (
    echo [FAIL] ALLOWED_HOSTS is empty
    echo ACTION: Configure ALLOWED_HOSTS
) else (
    echo [PASS] ALLOWED_HOSTS configured
)
cd ..
echo.

echo [8/10] Checking CORS settings...
cd backend
findstr /C:"CORS_ALLOW_ALL_ORIGINS = True" config\settings.py > nul
if %errorlevel% == 0 (
    echo [FAIL] CORS allows all origins (insecure!)
    echo ACTION: Whitelist specific origins only
) else (
    echo [PASS] CORS not set to allow all
)
cd ..
echo.

echo [9/10] Checking for node_modules in Git...
git ls-files | findstr "node_modules" > nul
if %errorlevel% == 0 (
    echo [WARNING] node_modules tracked (will bloat repo)
    echo ACTION: Add to .gitignore and remove
) else (
    echo [PASS] node_modules not tracked
)
echo.

echo [10/10] Checking for log files in Git...
git ls-files | findstr "\.log" > nul
if %errorlevel% == 0 (
    echo [WARNING] Log files tracked
    echo ACTION: Add *.log to .gitignore
) else (
    echo [PASS] Log files not tracked
)
echo.

echo ===============================================
echo   SECURITY CHECK COMPLETE
echo ===============================================
echo.
echo NEXT STEPS:
echo 1. Fix any [FAIL] items immediately
echo 2. Review [WARNING] items
echo 3. Run 'git status' to verify no sensitive files
echo 4. Set environment variables for production
echo 5. Test with DEBUG=False before deploying
echo.
pause
