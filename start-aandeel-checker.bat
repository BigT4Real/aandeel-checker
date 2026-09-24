@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Eenmalig: onderdelen installeren...
  call npm install
)
echo Aandeel Checker starten op http://localhost:8901
start "" http://localhost:8901
call npm run preview -- --port 8901
pause
