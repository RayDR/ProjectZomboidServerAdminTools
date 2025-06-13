# 🧠 Project Zomboid WebAdmin Panel

Multilingual | [🇺🇸 English](#-english) | [🇪🇸 Español](#-español)

## 🇺🇸 English

### Overview

Project Zomboid WebAdmin is a web-based management tool for Project Zomboid servers.  
It provides real-time access to connected players, error/server logs, INI config editor, remote control, and messaging capabilities.

This repository contains:

- `/backend`: Node.js (TypeScript) API for server-side interaction
- `/frontend`: React + Vite interface to manage the server in real time

---

### 📦 Requirements

To run the panel, make sure you have:

- Unix-based system (Linux or macOS)
- Node.js v18+ and npm
- SQLite3 (for optional user authentication)
- Bash-compatible shell
- A running **Project Zomboid server** with:
  - RCON enabled
  - INI config access
  - Admin control scripts
- `steamcmd` installed and accessible for updates
- Proper `.env` configuration file for the backend
- (Optional) `mcrcon` installed if you want to manually test RCON

📌 Windows support is not available yet but is planned for a future release.

---

### 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/RayDR/ProjectZomboidServerAdminTools.git
cd pzwebadmin
````

2. **Setup backend**

```bash
cd backend
npm install
# Optionally configure .env with ports, paths and credentials
```

3. **(Optional) SQLite Auth Setup**

```bash
sqlite3 pzadmin.db < pzwebadmin.sql
# Creates tables for users, sessions, and audit logs
```

4. **Start backend**

```bash
npm run build
npm run start
```

5. **Setup frontend**

```bash
cd ../frontend
npm install
npm run build
```

6. **Deploy frontend**

Serve the content of `dist/` with Nginx or your preferred web server.
Ensure `/api/*` routes are proxied to your backend port.

---

### 🔐 Authentication

Two supported modes:

* **Static token** — use `Authorization: Bearer secret123`
* **User login** — via `/api/login` with SQLite users

---

### 🧪 Features

- ✅ View server status (process, memory, database, time)
- ✅ View **error**, **server**, and **maintenance logs**
- ✅ View connected players via **RCON**
- ✅ Send **broadcast messages** to the server
- ✅ Edit and save `*.ini` configuration
- ✅ Run admin actions (restart, stop, update, backup)
- ✅ Authentication system (token-based and SQLite)
- ✅ Full audit log for admin events

---

## 🇪🇸 Español

### Descripción

Project Zomboid WebAdmin es un panel web para administrar servidores PZ.
Proporciona control total en tiempo real: jugadores conectados, logs de errores, comandos remotos, edición del archivo INI y mensajería al servidor.

Este repositorio contiene:

* `/backend`: API Node.js en TypeScript
* `/frontend`: Interfaz React moderna con Vite

---

### 📦 Requisitos

Para ejecutar el panel, asegúrate de tener:

- Sistema basado en Unix (Linux o macOS)
- Node.js v18+ y npm
- SQLite3 (opcional, para autenticación de usuarios)
- Shell compatible con Bash
- Un servidor **Project Zomboid** con:
  - RCON habilitado
  - Acceso a configuración INI
  - Scripts de administración disponibles
- `steamcmd` instalado y accesible (para actualizaciones)
- Archivo `.env` bien configurado para el backend
- (Opcional) `mcrcon` instalado para probar RCON manualmente

📌 Compatibilidad con Windows aún no disponible, pero se planea para una versión futura.

---

### 🚀 Instalación

1. **Clonar repositorio**

```bash
git clone https://github.com/RayDR/ProjectZomboidServerAdminTools.git
cd pzwebadmin
```

2. **Configurar backend**

```bash
cd backend
npm install
# Configura tu archivo .env con rutas, puertos y credenciales
```

3. **(Opcional) Configura autenticación SQLite**

```bash
sqlite3 pzadmin.db < pzwebadmin.sql
# Esto crea usuarios, sesiones y registros de auditoría
```

4. **Iniciar backend**

```bash
npm run build
npm run start
```

5. **Configurar frontend**

```bash
cd ../frontend
npm install
npm run build
```

6. **Desplegar frontend**

Publica el contenido de `dist/` con Nginx u otro servidor web.
Asegúrate de redirigir `/api/*` al backend.

---

### 🔐 Autenticación

Soporta dos modos:

* **Token estático** — Usa `Authorization: Bearer secret123`
* **Inicio de sesión** — Desde `/api/login` usando SQLite

---

### 🧪 Funciones

- ✅ Estado del servidor (proceso, memoria, DB, hora)
- ✅ Ver logs de **errores**, **servidor**, y **mantenimiento**
- ✅ Ver jugadores conectados con **RCON**
- ✅ Enviar **mensajes globales** al servidor
- ✅ Editar archivo `*.ini` directamente
- ✅ Ejecutar comandos (reiniciar, parar, actualizar, respaldar)
- ✅ Login y auditoría de acciones administrativas

---

### 📄 License

MIT — Use freely and contribute!
