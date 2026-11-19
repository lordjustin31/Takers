@echo off
echo ========================================
echo STARTING MARKETPLACE - LOCALHOST MODE
echo ========================================
echo.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:5173
echo.
echo This mode is for local development only.
echo ========================================
echo.

echo [1/2] Starting Backend on port 8000...
start "Django Backend" cmd /k "cd backend && python manage.py runserver"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend on port 5173...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo ✅ SERVERS STARTING!
echo ========================================
echo.
echo Access your app at: http://localhost:5173
echo API running at: http://localhost:8000/api
echo.
echo Press any key to close this window...
pause >nul
