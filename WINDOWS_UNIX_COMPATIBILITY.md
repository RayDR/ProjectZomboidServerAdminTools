# Windows and Unix Compatibility Matrix

This project is designed first for Linux/Unix hosts. Windows support is possible with limitations.

## Compatibility Summary

- Frontend (React/Vite): Works on Linux and Windows.
- Backend API process (Node.js): Works on Linux and Windows.
- Service control (start/stop/restart/kill instances):
	- Linux/Unix: full via systemd
	- Windows native: supported for imported instances via PID-based runtime management
- Automatic instance provisioning/deletion: Linux/Unix only (requires sudo + bash scripts + systemd units).
- SteamCMD driven setup via backend script: Linux/Unix only in native mode.
- Manual instance import and metadata management: Works on Linux and Windows.

## Native Windows Limitations

When the backend runs natively on Windows (not inside WSL):

1. `systemctl` is not available.
2. `sudo` is not available.
3. Linux shell scripts (`.sh`) are not available by default.
4. Automatic instance create/retry/delete from UI remains blocked by design and returns `PLATFORM_UNSUPPORTED`.
5. Start script discovery on Windows requires one of these files in instance directory:
	- `StartServer64.bat`
	- `ProjectZomboidServer.bat`
	- `start-server.bat`

## Recommended Windows Setup (WSL2)

If you need parity with Linux features from a Windows machine:

1. Install WSL2 and Ubuntu.
2. Enable systemd in WSL (`/etc/wsl.conf`).
3. Run backend and game instance management stack inside WSL.
4. Access frontend from Windows browser.

This preserves Linux behavior while allowing Windows desktop usage.

## Included Helper Script

Use this script from Windows CMD (Run as Administrator):

- `scripts/windows/setup-windows-compat.bat`

What it does:

1. Enables Windows long paths policy.
2. Creates common `%USERPROFILE%\\Zomboid` directories.
3. Verifies Node.js/npm and optional WSL availability.
4. Prints the exact next steps to run this project safely on Windows.

## Operational Guidance

- For 100 percent feature parity (instance lifecycle + automation), use Linux/Unix host or WSL2 with systemd.
- For native Windows backend mode, use manual/import workflows for provisioning; runtime lifecycle controls are available for imported instances.
