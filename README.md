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

---

## 🎨 Motor de Temas

PZWebAdmin incluye un **Motor de Temas Semántico** que permite cambiar la paleta de colores de la interfaz sin modificar el código.

- Selecciona plantillas predefinidas (Classic, Dark Survival, Soft Dark, High Contrast).
- Personaliza colores individualmente y previsualiza los cambios en tiempo real.
- Los cambios se guardan localmente en tu navegador.

Para acceder, haz clic en el ícono de engranaje (⚙️) en la barra de navegación superior.

---

## 🛠️ Diagnóstico y Permisos

Si experimentas problemas con permisos de `systemctl` o errores de Git, ejecuta el script de diagnóstico:

```bash
cd /opt/pzwebadmin
./scripts/diagnose.sh
```

Para aplicar los permisos de systemctl al usuario de PM2 (`sysops`) sin pedir password, y solucionar problemas de ownership, ejecuta como root o con sudo:

```bash
sudo bash /opt/pzwebadmin/scripts/fix-permissions.sh
```
