@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=5173"

if /I "%~1"=="start" goto start
if /I "%~1"=="stop" goto stop
if /I "%~1"=="restart" goto restart
if /I "%~1"=="status" goto status
goto usage

:start
call :port_in_use %BACKEND_PORT%
if errorlevel 1 (
  echo Starting backend on http://127.0.0.1:%BACKEND_PORT% ...
  start "TaskGenie Backend" /D "%ROOT%backend\app" cmd /c "python -m uvicorn main:app --reload --port %BACKEND_PORT%"
) else (
  echo Backend is already running on port %BACKEND_PORT%.
)

call :port_in_use %FRONTEND_PORT%
if errorlevel 1 (
  echo Starting frontend on http://127.0.0.1:%FRONTEND_PORT% ...
  start "TaskGenie Frontend" /D "%ROOT%frontend" cmd /c "npm run dev -- --host 127.0.0.1 --port %FRONTEND_PORT%"
) else (
  echo Frontend is already running on port %FRONTEND_PORT%.
)

echo TaskGenie startup requested.
exit /b 0

:stop
call :stop_port %BACKEND_PORT% Backend
call :stop_port %FRONTEND_PORT% Frontend
echo TaskGenie stopped.
exit /b 0

:restart
call :stop_port %BACKEND_PORT% Backend
call :stop_port %FRONTEND_PORT% Frontend
timeout /t 1 /nobreak >nul
goto start

:status
call :show_status %BACKEND_PORT% Backend
call :show_status %FRONTEND_PORT% Frontend
exit /b 0

:port_in_use
netstat -ano | findstr ":%~1 " | findstr "LISTENING" >nul 2>&1
exit /b %errorlevel%

:stop_port
call :port_in_use %~1
if errorlevel 1 (
  echo %~2 is not running on port %~1.
  exit /b 0
)

echo Stopping %~2 on port %~1 ...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%~1 " ^| findstr "LISTENING"') do (
  taskkill /PID %%P /T /F >nul 2>&1
)
exit /b 0

:show_status
call :port_in_use %~1
if errorlevel 1 (
  echo %~2: stopped
) else (
  echo %~2: running on port %~1
)
exit /b 0

:usage
echo Usage: task-genie.bat ^<start^|stop^|restart^|status^>
echo.
echo   start    Start the backend and frontend
echo   stop     Stop processes listening on ports 8000 and 5173
echo   restart  Stop and start both applications
echo   status   Show whether each application is running
exit /b 1
