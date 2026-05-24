@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo PZWebAdmin Windows Compatibility Setup
echo ===============================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARN] Not running as Administrator.
  echo        Some directives (registry updates) may fail.
  echo.
)

echo [1/4] Enabling Windows long paths policy...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f >nul 2>&1
if %errorlevel% equ 0 (
  echo [OK] Long paths policy enabled.
) else (
  echo [WARN] Could not update LongPathsEnabled. Run this script as Administrator.
)

echo.
echo [2/4] Creating Project Zomboid user directories...
set PZROOT=%USERPROFILE%\Zomboid
if not exist "%PZROOT%\Server" mkdir "%PZROOT%\Server"
if not exist "%PZROOT%\Saves\Multiplayer" mkdir "%PZROOT%\Saves\Multiplayer"
if not exist "%PZROOT%\db" mkdir "%PZROOT%\db"
echo [OK] Ensured directories under %PZROOT%

echo.
echo [3/4] Checking required tools...
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARN] Node.js not found in PATH.
) else (
  for /f "tokens=*" %%A in ('node -v') do set NODEVER=%%A
  echo [OK] Node.js detected: !NODEVER!
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARN] npm not found in PATH.
) else (
  for /f "tokens=*" %%A in ('npm -v') do set NPMVER=%%A
  echo [OK] npm detected: !NPMVER!
)

where wsl >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARN] WSL not detected.
  echo        Native Windows mode has feature limitations.
) else (
  echo [OK] WSL detected. Recommended for full lifecycle automation.
)

echo.
echo [4/4] Final compatibility notes:
echo  - Native Windows backend does NOT support systemd/sudo/bash automation.
echo  - Use WSL2 + systemd for full create/start/stop/delete instance support.
echo  - See WINDOWS_UNIX_COMPATIBILITY.md for details.

echo.
echo Done.
endlocal
