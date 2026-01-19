@echo off
setlocal

title Smart Agriculture System Launcher

echo ===================================================
echo       Smart Agriculture System Launcher
echo ===================================================
echo.

:: 1. Start Backend
echo [1/3] Starting Backend Server...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    call cd backend && npm install && cd ..
)
start "Backend Server (Port 3000/1883)" cmd /k "cd backend && npm start"

:: Wait a bit for backend to initialize
timeout /t 2 >nul

:: 2. Start Simulator
echo [2/3] Starting Sensor Simulators...
if exist "simulator\.venv\Scripts\python.exe" (
    echo Using virtual environment for simulator...
    start "IoT Simulator" cmd /k "cd simulator && .venv\Scripts\python run_simulators.py"
) else (
    echo Using system python for simulator...
    :: Check if requirements are installed (simple check)
    start "IoT Simulator" cmd /k "cd simulator && python run_simulators.py"
)

:: 3. Start Frontend
echo [3/3] Starting Frontend Dashboard...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    call cd frontend && npm install && cd ..
)
start "Frontend Dashboard (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo    All systems started!
echo    Frontend should open at: http://localhost:5173
echo ===================================================
echo.
pause
