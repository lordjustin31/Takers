@echo off
echo ========================================
echo STARTING MARKETPLACE - NETWORK MODE
echo ========================================
echo.
echo Your Local IP: 192.168.100.3
echo.
echo Backend will run on: http://192.168.100.3:8000
echo Frontend will run on: http://192.168.100.3:5174
echo.
echo Other devices on same WiFi can access your app!
echo ========================================
echo.

echo [1/2] Starting Backend on port 8000...
start "Django Backend" cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend on port 5174...
start "React Frontend" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo ========================================
echo ✅ SERVERS STARTING!
echo ========================================
echo.
echo Access your app at:
echo - From this computer: http://localhost:5174
echo - From other devices: http://192.168.100.3:5174
echo.
echo API running at:
echo - http://192.168.100.3:8000/api
echo.
echo Press any key to close this window...
pause >nul
