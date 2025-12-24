# Guía de Compilación y Despliegue con PM2

## 🚀 Compilación

### Compilar todo (Backend + Frontend)
```bash
cd /opt/pzwebadmin
./build.sh
```

### Compilar solo Backend
```bash
cd /opt/pzwebadmin/backend
npm run build
# Genera: backend/dist/
```

### Compilar solo Frontend
```bash
cd /opt/pzwebadmin/frontend
npm run build
# Genera: frontend/dist/
```

---

## 📦 Gestión con PM2

### Iniciar servicios
```bash
cd /opt/pzwebadmin
pm2 start ecosystem.config.js
```

### Ver estado
```bash
pm2 list
pm2 status
```

### Ver logs
```bash
# Todos los logs
pm2 logs

# Solo backend
pm2 logs pzwebadmin-backend

# Solo frontend
pm2 logs pzwebadmin-frontend
```

### Reiniciar servicios
```bash
# Reiniciar ambos
pm2 restart all

# Solo backend
pm2 restart pzwebadmin-backend

# Solo frontend
pm2 restart pzwebadmin-frontend
```

### Detener servicios
```bash
# Detener ambos
pm2 stop all

# Solo backend
pm2 stop pzwebadmin-backend

# Solo frontend
pm2 stop pzwebadmin-frontend
```

### Eliminar servicios de PM2
```bash
pm2 delete pzwebadmin-backend
pm2 delete pzwebadmin-frontend
```

### Guardar configuración PM2
```bash
pm2 save
```

### Ver información detallada
```bash
pm2 show pzwebadmin-backend
pm2 show pzwebadmin-frontend
```

---

## 🔄 Workflow de Actualización

### 1. Detener servicios
```bash
pm2 stop pzwebadmin-backend pzwebadmin-frontend
```

### 2. Hacer cambios en el código
```bash
# Editar archivos...
```

### 3. Recompilar
```bash
cd /opt/pzwebadmin
./build.sh
```

### 4. Reiniciar servicios
```bash
pm2 restart pzwebadmin-backend pzwebadmin-frontend
```

---

## 🔧 Configuración

### Puertos
- **Backend**: Puerto 3131 (configurado en `.env`)
- **Frontend**: Puerto 3000 (configurado en `ecosystem.config.js`)

### Variables de entorno

Backend (`/opt/pzwebadmin/backend/.env`):
```env
PORT=3131
PZ_NAME=pzdesveladitas
PZ_DIR=/opt/pzserver
# ... etc
```

Frontend (`/opt/pzwebadmin/frontend/.env.local`):
```env
VITE_API_URL=http://localhost:3131
```

---

## 📁 Estructura de archivos generados

```
/opt/pzwebadmin/
├── backend/
│   ├── dist/              ← Código compilado (TypeScript → JavaScript)
│   └── logs/              ← Logs de PM2
├── frontend/
│   ├── dist/              ← Build de producción (HTML/JS/CSS)
│   └── logs/              ← Logs de PM2
└── ecosystem.config.js    ← Configuración PM2
```

---

## 🔍 Troubleshooting

### Backend no compila
```bash
cd /opt/pzwebadmin/backend
npm install
npm run build
```

### Frontend no compila
```bash
cd /opt/pzwebadmin/frontend
npm install
npm run build
```

### PM2 no encuentra el script
```bash
# Verificar que existe
ls -la /opt/pzwebadmin/backend/dist/index.js
ls -la /opt/pzwebadmin/frontend/dist/index.html
```

### Ver errores en tiempo real
```bash
pm2 logs --err
```

### Limpiar y recompilar
```bash
# Backend
cd /opt/pzwebadmin/backend
rm -rf dist node_modules
npm install
npm run build

# Frontend
cd /opt/pzwebadmin/frontend
rm -rf dist node_modules
npm install
npm run build
```

---

## 🎯 Comandos Rápidos

```bash
# Todo en uno: compilar y reiniciar
cd /opt/pzwebadmin && ./build.sh && pm2 restart all

# Ver todo en tiempo real
pm2 monit

# Logs en vivo
pm2 logs --lines 100

# Reinicio automático al cambiar archivos (desarrollo)
pm2 restart pzwebadmin-backend --watch
```

---

## 💾 Auto-inicio en boot

Para que PM2 inicie automáticamente al reiniciar el servidor:

```bash
# Guardar configuración actual
pm2 save

# Generar script de inicio
pm2 startup

# Copiar y ejecutar el comando que PM2 te muestra
```

---

## 📊 Monitoreo

### Uso de memoria y CPU
```bash
pm2 monit
```

### Información del sistema
```bash
pm2 info pzwebadmin-backend
```

### Ver historial de reinicios
```bash
pm2 list
# Columna "↺" muestra cantidad de reinicios
```
