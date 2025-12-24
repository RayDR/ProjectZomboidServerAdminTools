# Cambios Realizados - Sistema Multi-Instancia

## Resumen
Se ha implementado un sistema completo de multi-instancia para Project Zomboid que permite:
- Tener múltiples instalaciones del servidor
- Cambiar entre instancias desde la interfaz web
- Solo una instancia activa a la vez (se detiene automáticamente al cambiar)
- Configuraciones y puertos independientes para cada instancia

---

## 📁 Archivos Nuevos Creados

### Backend

1. **`/opt/pzwebadmin/backend/src/config/instances.json`**
   - Configuración de todas las instancias disponibles
   - Define puertos, rutas, nombres de servicios
   - Marca cuál instancia está activa

2. **`/opt/pzwebadmin/backend/src/services/instances.service.ts`**
   - Lógica para gestionar instancias
   - Funciones para cambiar, listar, obtener instancias
   - Manejo de inicio/parada automática

3. **`/opt/pzwebadmin/backend/src/controllers/instances.controller.ts`**
   - Controladores para endpoints de instancias
   - Manejo de peticiones HTTP

4. **`/opt/pzwebadmin/backend/src/routes/instances.ts`**
   - Rutas API: `/api/instances/*`
   - GET, POST para gestionar instancias

### Frontend

5. **`/opt/pzwebadmin/frontend/src/components/InstanceSelector.jsx`**
   - Componente visual para seleccionar instancias
   - Muestra estado de cada instancia
   - Botones para activar/cambiar

### Scripts

6. **`/opt/pzwebadmin/scripts/setup-new-instance.sh`**
   - Script bash para instalar nueva instancia
   - Descarga PZ, configura servicio, ajusta puertos
   - Configuración automática completa

### Documentación

7. **`/opt/pzwebadmin/MULTI_INSTANCE.md`**
   - Documentación completa del sistema
   - Guías de uso, configuración, troubleshooting

8. **`/opt/pzwebadmin/QUICK_START.sh`**
   - Guía rápida de implementación
   - Comandos útiles

9. **`/opt/pzwebadmin/CHANGES.md`**
   - Este archivo (documentación de cambios)

---

## ✏️ Archivos Modificados

### Backend

1. **`/opt/pzwebadmin/backend/src/services/server.service.ts`**
   - Ahora usa `getActiveInstance()` en lugar de configuración fija
   - Funciones `startServer()`, `stopServer()`, `restartServer()` adaptadas
   - `getServerStatus()` retorna info de instancia activa
   - Añadidos campos `instanceId` e `instanceName` en respuesta

2. **`/opt/pzwebadmin/backend/src/index.ts`**
   - Importado `instancesRoutes`
   - Añadida ruta `/api/instances`

### Frontend

3. **`/opt/pzwebadmin/frontend/src/pages/ServerControl.jsx`**
   - Importado componente `InstanceSelector`
   - Añadido selector de instancias antes del panel de estado
   - Muestra nombre de instancia activa en el estado del servidor
   - Callback `onInstanceChange` para refrescar estado

---

## 🌐 Nuevos Endpoints API

### GET `/api/instances`
Obtiene todas las instancias con su estado
```json
{
  "success": true,
  "data": [
    {
      "id": "current",
      "name": "PZ Server Actual",
      "running": true,
      "isActive": true,
      ...
    }
  ]
}
```

### GET `/api/instances/active`
Obtiene la instancia actualmente activa
```json
{
  "success": true,
  "data": {
    "id": "current",
    "name": "PZ Server Actual",
    ...
  }
}
```

### POST `/api/instances/switch`
Cambia la instancia activa
```json
{
  "instanceId": "new"
}
```

### PATCH `/api/instances/:instanceId`
Actualiza configuración de una instancia

---

## 🔧 Configuración de Instancias

### Instancia Actual (Original)
- **ID**: `current`
- **Servicio**: `pzomboid`
- **Directorio**: `/opt/pzserver`
- **Puerto juego**: 16261
- **Puerto RCON**: 27015
- **Configuración**: `/home/pzadmin/Zomboid/Server/pzdesveladitas.ini`

### Instancia Nueva
- **ID**: `new`
- **Servicio**: `pzomboid-new`
- **Directorio**: `/opt/pzserver-new`
- **Puerto juego**: 16262
- **Puerto RCON**: 27016
- **Configuración**: `/home/pzadmin/Zomboid/Server/pzdesveladitas-new.ini`

---

## 📋 Pasos de Implementación

### 1. Instalar Nueva Instancia
```bash
cd /opt/pzwebadmin/scripts
./setup-new-instance.sh
```

### 2. Configurar Firewall (si necesario)
```bash
sudo ufw allow 16262/udp
sudo ufw allow 27016/tcp
```

### 3. Reiniciar Backend
```bash
cd /opt/pzwebadmin/backend
npm install
npm run dev
```

### 4. Usar desde Web
1. Ir a "Server Control"
2. Ver panel "INSTANCIAS DE SERVIDOR"
3. Clic en "Activar Instancia"
4. Confirmar cambio

---

## 🎯 Características Implementadas

✅ **Gestión Multi-Instancia**
- Sistema de configuración centralizado
- Cambio automático entre instancias
- Solo una instancia activa a la vez

✅ **Parada Automática**
- Al activar una instancia, las demás se detienen automáticamente
- Sin conflictos de puertos o recursos

✅ **Interfaz Visual**
- Selector de instancias con estado en tiempo real
- Indicadores visuales (activa, ejecutando, detenida)
- Confirmación antes de cambiar

✅ **Configuración Independiente**
- Cada instancia con sus propios puertos
- Archivos de configuración separados
- Mundos/guardados independientes

✅ **Scripts de Instalación**
- Setup automático de nueva instancia
- Configuración de servicios systemd
- Permisos sudoers configurados

✅ **Documentación Completa**
- Guías de uso
- Troubleshooting
- Ejemplos de configuración

---

## 🔐 Seguridad

- Permisos sudoers limitados por instancia
- Puertos separados para evitar conflictos
- Logs independientes por instancia
- Autenticación JWT requerida en API

---

## 🐛 Testing Recomendado

1. **Verificar cambio de instancias**
   - Cambiar de actual a nueva
   - Verificar que la actual se detiene
   - Verificar que la nueva inicia

2. **Verificar estado en web**
   - Refrescar estado
   - Ver nombre de instancia activa
   - Verificar uptime

3. **Verificar operaciones**
   - Start/Stop/Restart funcionan
   - Update funciona (con servidor detenido)
   - Logs se muestran correctamente

4. **Verificar persistencia**
   - Reiniciar backend
   - Verificar que instancia activa se mantiene

---

## 📝 Notas Importantes

1. **Mundos Separados**: Cada instancia tiene su propio mundo. Para compartir, copiar manualmente los archivos de guardado.

2. **Mods**: Los mods deben instalarse por separado en cada instancia.

3. **Backups**: Cada instancia mantiene sus propios backups en su directorio.

4. **Actualizaciones**: Puedes actualizar una instancia sin afectar la otra, útil para probar versiones nuevas.

---

## 🚀 Próximos Pasos Sugeridos

- [ ] Crear función de copia de mundo entre instancias
- [ ] Añadir opción de backup antes de cambiar instancia
- [ ] Implementar programación de cambios (scheduler)
- [ ] Añadir más instancias si necesario (fácil de extender)
- [ ] Dashboard comparativo de rendimiento entre instancias

---

## 📞 Soporte

Para problemas o dudas:
1. Revisar logs: `tail -f /opt/pzserver-new/logs/server.log`
2. Ver estado systemd: `sudo systemctl status pzomboid-new`
3. Consultar MULTI_INSTANCE.md para troubleshooting completo
