# FIN PULSE

FIN PULSE is a mobile-first financial wellness application built with Flutter, Spring Boot, MySQL, and Firebase Authentication.

## Structure
- Frontend: frontend/
- Backend: backend/

## Run the backend with HTTPS
1. Open PowerShell in the backend folder.
2. Generate a local certificate:
   ```powershell
   .\generate-cert.ps1
   ```
3. Build the backend:
   ```powershell
   mvn clean package -DskipTests
   ```
4. Start the backend:
   ```powershell
   .\start-https.bat
   ```
5. Open the app in Edge at:
   ```text
   https://localhost:8443
   ```

## Run the frontend
1. From frontend/, run:
   ```bash
   flutter pub get
   flutter run -d chrome
   ```
2. Open Edge and visit:
   ```text
   https://localhost:8443
   ```

## Notes
- The app now uses HTTPS locally for browser access.
- You may see a security warning in Edge for the self-signed certificate. Click "Advanced" and continue to the site.
