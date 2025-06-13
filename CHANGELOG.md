# 📜 Changelog

All notable changes to this project will be documented in this file.

## [v0.9.0-beta] - 2025-06-12

### ✨ Added

- Full backend written in TypeScript using Express
- Frontend built with React + Vite and modular component structure
- Real-time server status via API
- INI file reader and editor with PUT support
- Player list via RCON (`/api/players`)
- Global broadcast messaging to the server via RCON (`/api/messages`)
- Log viewer for:
  - Main logs
  - Maintenance logs
  - Error logs (NEW)
- Admin command runner:
  - Restart
  - Stop
  - Start
  - Backup
  - Update via `steamcmd`
- Authentication system (token + SQLite login support)
- Role-based log and action tracking (audit)
- Multilingual frontend UI (English & Spanish)
- Responsive design with collapsible sections

### 🛠️ Changed

- `readLogFile()` service updated to support `errors` as log type
- INI editor now properly handles JSON responses and error cases
- Server status component rewritten to use JSON instead of text parsing

### 🐞 Fixed

- Authorization header not sent in some fetch requests
- Token not recognized when frontend was refreshed
- RCON errors now handled gracefully with detailed backend messages

### ⚠️ Known Issues

- Windows support not yet available (planned for v1.0.0)
- SteamCMD must be installed and accessible via config
- Backup scripts must be customized for your environment

---
