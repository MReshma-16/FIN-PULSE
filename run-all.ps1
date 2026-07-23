Set-Location $PSScriptRoot
Write-Host 'Starting FIN PULSE...'
if (-not (Test-Path 'backend/target/finpulse-backend-1.0.0.jar')) {
    Write-Host 'Building backend...'
    Set-Location backend
    mvn clean package -DskipTests
    Set-Location ..
}
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location "'+$PSScriptRoot+'\backend"; .\start-https.bat' -WindowStyle Normal
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location "'+$PSScriptRoot+'\frontend"; flutter pub get; flutter run -d chrome' -WindowStyle Normal
Write-Host 'FIN PULSE is starting. Open Edge and visit https://localhost:8443'
