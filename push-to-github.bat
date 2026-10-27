@echo off
setlocal
echo ========================================================
echo   LunaRay Studio - Push to GitHub Repository
echo   Target: https://github.com/luna00l/lunaray-website.git
echo ========================================================
echo.
set "PATH=c:\LunaRay\.tools\git\cmd;c:\LunaRay\.tools\git\ucrt64\bin;%PATH%"
echo Pushing branch 'main' to origin...
git.exe push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
  echo [SUCCESS] Successfully pushed all project files to GitHub!
) else (
  echo [NOTE] If GitHub asks for credentials, use your GitHub username (luna00l)
  echo and a Personal Access Token (PAT) with 'repo' scope as your password.
)
echo.
pause
