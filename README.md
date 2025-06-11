# 🧠 Project Zomboid WebAdmin Panel

Multilingual | [🇺🇸 English](#-english) | [🇪🇸 Español](#-español)

---

## 🇺🇸 English

### Overview

Project Zomboid WebAdmin is a web-based management tool for Project Zomboid servers.  
It provides real-time access to players, logs, server status, INI config edition, and remote server control (restart, backup, update).

This repository contains:

- `/backend`: Node.js Express API for server-side interaction
- `/frontend`: Vite + React interface to control the server

---

### 📦 Requirements

- Unix-based system
- Node.js v18+
- SQLite3
- Bash-compatible shell
- A running Project Zomboid server with admin scripts

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
# Optionally set PORT or use default (3131)
# Configure shell commands inside backend code if needed
```

3. **Setup SQLite authentication (optional)**

```bash
sqlite3 pzadmin.db < pzwebadmin.sql
# This creates tables for users, sessions, and audit logs
# You can manually insert users using bcrypt-hashed passwords
```

4. **Start backend**

```bash
node server.js
```

5. **Setup frontend**

```bash
cd ../frontend
npm install
npm run build
# Output will be placed in `dist/`
```

6. **Serve frontend**

Use your favorite web server (like Nginx) to serve `frontend/dist/`.
Make sure requests to `/api/*` are proxied to the backend port.

---

### 🔐 Authentication

Two modes supported:

* **Static token**: Set `Authorization: Bearer secret123` (default for testing)
* **Login**: Create users in SQLite and authenticate via `/api/login`

---

### 🧪 Features

* View server status, logs and players
* Edit and save INI configuration
* Run admin commands (restart, backup, update)
* Audit log for user actions (INI edits, login events)

---

## 🇪🇸 Español

### Descripción

Project Zomboid WebAdmin es un panel de control web para servidores de Project Zomboid.
Permite ver jugadores conectados, registros del servidor, editar configuraciones, ejecutar comandos y gestionar acceso.

Este repositorio incluye:

* `/backend`: API en Node.js Express
* `/frontend`: Interfaz React con Vite

---

### 📦 Requisitos

* Sistema Unix (Ubuntu, Debian, etc.)
* Node.js v18 o superior
* SQLite3
* Bash o shell compatible
* Un servidor Project Zomboid con scripts habilitados

---

### 🚀 Instalación

1. **Clona el repositorio**

```bash
git clone https://github.com/RayDR/ProjectZomboidServerAdminTools.git
cd pzwebadmin
```

2. **Configura el backend**

```bash
cd backend
npm install
# Opcional: modifica el puerto o comandos en el código
```

3. **Base de datos SQLite (opcional)**

```bash
sqlite3 pzadmin.db < pzwebadmin.sql
# Esto crea usuarios, sesiones y registros de auditoría
```

4. **Ejecuta el backend**

```bash
node server.js
```

5. **Configura el frontend**

```bash
cd ../frontend
npm install
npm run build
# Los archivos estarán en `dist/`
```

6. **Publica el frontend**

Sirve los archivos de `dist/` con Nginx o similar.
Asegúrate de redirigir `/api/*` al backend.

---

### 🔐 Autenticación

Soporte para dos modos:

* **Token estático**: Usa `Authorization: Bearer secret123`
* **Login**: Usuarios en base de datos SQLite mediante `/api/login`

---

### 🧪 Funciones

* Ver estado del servidor y jugadores conectados
* Ver logs de errores y del servidor
* Editar archivo INI desde el navegador
* Ejecutar comandos administrativos
* Registrar eventos de usuarios (login, edición, etc.)

---

### 📄 License

MIT — Use freely and contribute!

---
