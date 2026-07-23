@echo off
cd /d "%~dp0"

echo Starting FIN PULSE...
echo.
echo Step 1/3: Checking backend build...
if not exist "backend\target\finpulse-backend-1.0.0.jar" (
    echo Building backend...
    cd backend
    mvn clean package -DskipTests
    cd ..
)

echo Step 2/3: Starting backend on HTTPS...
start "FIN PULSE Backend" cmd /k "cd /d %~dp0backend && start-https.bat"

echo Step 3/3: Starting frontend in Edge...
start "FIN PULSE Frontend" cmd /k "cd /d %~dp0frontend && flutter pub get && flutter run -d chrome"

echo.
echo FIN PULSE is starting.
echo Open Edge and visit: https://localhost:8443
pause
