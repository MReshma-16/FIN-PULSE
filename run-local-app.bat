@echo off
title FIN PULSE - Smart Loan Utilization
echo ====================================================
echo   FIN PULSE - Local Web Server
echo ====================================================
echo.
echo Launching application at http://localhost:5500 ...
echo.
start "" "http://localhost:5500"
npx -y serve "%~dp0frontend" -l 5500 -s --no-clipboard
