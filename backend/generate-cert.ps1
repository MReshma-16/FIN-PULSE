$certPath = Join-Path $PSScriptRoot 'src/main/resources/certs/finpulse.p12'
$certDir = Split-Path $certPath -Parent
if (-not (Test-Path $certDir)) { New-Item -ItemType Directory -Path $certDir -Force | Out-Null }
$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    Write-Host 'keytool not found. Install Java JDK and ensure keytool is available in PATH.'
    exit 1
}
$keytool -genkeypair -alias finpulse -keyalg RSA -keysize 2048 -storetype PKCS12 -keystore $certPath -storepass finpulse123 -dname "CN=localhost,OU=FINPULSE,O=FINPULSE,L=Unknown,ST=Unknown,C=US" -validity 365
Write-Host "Certificate created at $certPath"
