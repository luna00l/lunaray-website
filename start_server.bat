@echo off
title LunaRay Animation Server
echo Starting LunaRay Scroll Animation Server on http://localhost:3000 ...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" 3000
pause
