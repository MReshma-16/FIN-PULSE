@echo off
chdir /d "%~dp0"
echo Starting FIN PULSE backend with HTTPS...
if exist "%JAVA_HOME%\bin\java.exe" (
  "%JAVA_HOME%\bin\java.exe" -jar target\finpulse-backend-1.0.0.jar
) else (
  java -jar target\finpulse-backend-1.0.0.jar
)
pause
