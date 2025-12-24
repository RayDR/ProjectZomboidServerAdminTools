# Configuración Multi-Instancia de Project Zomboid

## Resumen

Este sistema permite ejecutar múltiples instancias de Project Zomboid en el mismo servidor, pero solo una a la vez. Puedes cambiar entre instancias desde la interfaz web.

## Estructura

```
/opt/pzserver/          # Instancia actual (original)
/opt/pzserver-new/      # Nueva instancia (última versión)
/opt/pzwebadmin/        # Panel de administración web
```

## Configuración de Instancias

Las instancias se configuran en `/opt/pzwebadmin/backend/src/config/instances.json`:

```json
{
  "instances": [
    {
      "id": "current",
      "name": "PZ Server Actual",
      "serviceName": "pzomboid",
      "pzDir": "/opt/pzserver",
      "gamePort": 16261,
      "rconPort": 27015,
      "isActive": true
    },
    {
      "id": "new",
      "name": "PZ Server Nuevo",
      "serviceName": "pzomboid-new",
      "pzDir": "/opt/pzserver-new",
      "gamePort": 16262,
      "rconPort": 27016,
      "isActive": false
    }
  ]
}
```

## Instalación de Nueva Instancia

### 1. Ejecutar el script de configuración

```bash
cd /opt/pzwebadmin/scripts
chmod +x setup-new-instance.sh
./setup-new-instance.sh
```

Este script:
- Crea el directorio `/opt/pzserver-new`
- Descarga la última versión de Project Zomboid
- Copia la configuración de la instancia actual
- Actualiza los puertos para evitar conflictos
- Crea el servicio systemd `pzomboid-new`
- Configura permisos sudoers

### 2. Verificar la instalación

```bash
# Verificar que el servicio existe
sudo systemctl status pzomboid-new

# Verificar archivos de configuración
ls -la /home/pzadmin/Zomboid/Server/pzdesveladitas-new.ini
```

### 3. Configurar puertos en el firewall (si es necesario)

```bash
# Puerto del juego
sudo ufw allow 16262/udp

# Puerto RCON
sudo ufw allow 27016/tcp
```

## Uso desde la Interfaz Web

1. **Acceder a Server Control**
   - Ve a la sección "Server Control"
   - Verás el panel "INSTANCIAS DE SERVIDOR"

2. **Cambiar de Instancia**
   - Haz clic en "Activar Instancia" en la instancia deseada
   - Confirma el cambio
   - La instancia actual se detendrá automáticamente
   - La nueva instancia se iniciará

3. **Estado de las Instancias**
   - **ACTIVA**: Es la instancia seleccionada actualmente
   - **● En línea**: El servidor está ejecutándose
   - **○ Detenido**: El servidor está apagado

## Servicios Systemd

### Instancia Actual
```bash
sudo systemctl start pzomboid    # Iniciar
sudo systemctl stop pzomboid     # Detener
sudo systemctl status pzomboid   # Ver estado
```

### Nueva Instancia
```bash
sudo systemctl start pzomboid-new    # Iniciar
sudo systemctl stop pzomboid-new     # Detener
sudo systemctl status pzomboid-new   # Ver estado
```

## Configuración Manual

### Archivos de Configuración INI

- **Instancia actual**: `/home/pzadmin/Zomboid/Server/pzdesveladitas.ini`
- **Nueva instancia**: `/home/pzadmin/Zomboid/Server/pzdesveladitas-new.ini`

### Parámetros importantes a verificar:

```ini
# Nueva instancia debe usar puertos diferentes
DefaultPort=16262
RCONPort=27016
RCONPassword=TheSup3r_Secure!

# Nombre del servidor
PublicName=Tu Servidor Nuevo
```

### Archivos de Guardado

- **Instancia actual**: `/home/pzadmin/Zomboid/Saves/Multiplayer/pzdesveladitas/`
- **Nueva instancia**: `/home/pzadmin/Zomboid/Saves/Multiplayer/pzdesveladitas-new/`

## Logs

### Instancia Actual
```bash
tail -f /opt/pzserver/logs/server.log
```

### Nueva Instancia
```bash
tail -f /opt/pzserver-new/logs/server.log
```

## Backups

Cada instancia tiene su propio directorio de backups:
- `/opt/pzserver/backups/`
- `/opt/pzserver-new/backups/`

## Solución de Problemas

### La nueva instancia no arranca

1. Verificar logs:
```bash
sudo journalctl -u pzomboid-new -n 50
tail -f /opt/pzserver-new/logs/server.log
```

2. Verificar permisos:
```bash
ls -la /opt/pzserver-new
sudo chown -R pzadmin:pzadmin /opt/pzserver-new
```

3. Verificar configuración:
```bash
cat /home/pzadmin/Zomboid/Server/pzdesveladitas-new.ini
```

### Conflicto de puertos

Si hay conflicto de puertos, edita el archivo INI:
```bash
nano /home/pzadmin/Zomboid/Server/pzdesveladitas-new.ini
```

Y cambia:
```ini
DefaultPort=16262  # Debe ser diferente de la instancia actual
RCONPort=27016     # Debe ser diferente de la instancia actual
```

### No se puede cambiar de instancia desde la web

1. Verificar permisos sudoers:
```bash
sudo cat /etc/sudoers.d/pzwebadmin-new
```

2. Verificar que el backend puede acceder a las instancias:
```bash
cat /opt/pzwebadmin/backend/src/config/instances.json
```

3. Reiniciar el backend:
```bash
cd /opt/pzwebadmin/backend
npm run dev
```

## API Endpoints

### Obtener todas las instancias
```
GET /api/instances
```

### Obtener instancia activa
```
GET /api/instances/active
```

### Cambiar instancia activa
```
POST /api/instances/switch
Body: { "instanceId": "new" }
```

## Migración de Datos

Para copiar el mundo/guardado de una instancia a otra:

```bash
# Detener ambas instancias
sudo systemctl stop pzomboid
sudo systemctl stop pzomboid-new

# Copiar guardado
cp -r /home/pzadmin/Zomboid/Saves/Multiplayer/pzdesveladitas/* \
      /home/pzadmin/Zomboid/Saves/Multiplayer/pzdesveladitas-new/

# Ajustar permisos
sudo chown -R pzadmin:pzadmin /home/pzadmin/Zomboid/Saves/Multiplayer/pzdesveladitas-new/

# Iniciar la nueva instancia
sudo systemctl start pzomboid-new
```

## Mantenimiento

### Actualizar una instancia

Desde la interfaz web:
1. Asegúrate de que la instancia esté DETENIDA
2. Selecciona la instancia como activa
3. Ve a "Server Control"
4. Haz clic en "UPDATE SERVER"

Desde la terminal:
```bash
# Para la instancia actual
/steamcmd/steamcmd.sh +login anonymous +force_install_dir /opt/pzserver +app_update 380870 validate +quit

# Para la nueva instancia
/steamcmd/steamcmd.sh +login anonymous +force_install_dir /opt/pzserver-new +app_update 380870 validate +quit
```

### Eliminar una instancia

```bash
# Detener servicio
sudo systemctl stop pzomboid-new
sudo systemctl disable pzomboid-new

# Eliminar archivos
sudo rm -rf /opt/pzserver-new
sudo rm /etc/systemd/system/pzomboid-new.service
sudo rm /etc/sudoers.d/pzwebadmin-new

# Recargar systemd
sudo systemctl daemon-reload

# Actualizar instances.json
# Editar /opt/pzwebadmin/backend/src/config/instances.json
# y eliminar la entrada de la instancia
```

## Seguridad

- Cada instancia usa puertos diferentes
- Los permisos sudoers están limitados a operaciones específicas
- Las contraseñas RCON deben ser diferentes por instancia (recomendado)
- Los logs se mantienen separados por instancia

## Notas Importantes

1. **Solo una instancia puede ejecutarse a la vez**
   - Al cambiar de instancia, la actual se detiene automáticamente

2. **Los mundos son independientes**
   - Cada instancia tiene su propio mundo/guardado
   - Para usar el mismo mundo, debes copiar los archivos manualmente

3. **Configuraciones independientes**
   - Cada instancia tiene su propio archivo .ini
   - Los mods deben instalarse por separado en cada instancia

4. **Actualizaciones**
   - Puedes actualizar una instancia sin afectar la otra
   - Útil para probar nuevas versiones antes de actualizar el servidor principal
