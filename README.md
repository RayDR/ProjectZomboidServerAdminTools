# PZWebAdmin - Compilación y Despliegue

## 🚀 Inicio Rápido

### 1. Compilar todo
```bash
cd /opt/pzwebadmin
./build.sh
```

### 2. Iniciar con PM2
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 3. Verificar estado
```bash
pm2 list
```

---

## 📦 Servicios PM2

- **pzwebadmin-backend** - API Backend (Puerto 3131)
- **pzwebadmin-frontend** - Frontend Web (Puerto 3000)

---

## 🔄 Comandos Útiles

```bash
# Ver logs
pm2 logs

# Reiniciar
pm2 restart pzwebadmin-backend pzwebadmin-frontend

# Detener
pm2 stop pzwebadmin-backend pzwebadmin-frontend

# Ver estado
pm2 status
```

---

## 📚 Documentación Completa

- [PM2_GUIDE.md](PM2_GUIDE.md) - Guía completa de PM2
- [MULTI_INSTANCE.md](MULTI_INSTANCE.md) - Sistema multi-instancia PZ
- [CHANGES.md](CHANGES.md) - Registro de cambios

---

## 🌐 Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3131
- **Servidor PZ Actual**: Puerto 16261 + RCON 27015
- **Servidor PZ Nuevo**: Puerto 16262 + RCON 27016
