// Devuelve los headers de autorización si el token está presente en localStorage
export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ⚠️ Desactivado temporalmente: el backend aún no implementa /api/players
export async function getPlayers() {
  return 'Not implemented';
}

// Ajustado para usar query ?type=main o ?type=maintenance
export async function getLogs(type = 'main', lines = 50) {
  const logType = type === 'maintenance' ? 'maintenance' : 'main';
  const res = await fetch(`/api/logs?type=${logType}&lines=${lines}`, {
    headers: authHeaders()
  });
  return res.text();
}

// Usa el tipo de log "maintenance" para obtener errores (por ahora reusa logs.service)
export async function getErrors(lines = 50) {
  const res = await fetch(`/api/logs?type=maintenance&lines=${lines}`, {
    headers: authHeaders()
  });
  return res.text();
}

// Obtiene el archivo INI actual del servidor
export async function getIni() {
  const res = await fetch('/api/config/ini', {
    headers: authHeaders()
  });
  return res.text();
}

// Guarda el contenido modificado del INI (usa método PUT, no POST)
export async function saveIni(content) {
  const res = await fetch('/api/config/ini', {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });
  return res.text();
}

// Ejecuta un comando en el servidor
export async function runCommand(cmd) {
  const res = await fetch(`/api/command/${cmd}`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.text();
}

// Consulta el estado actual del servidor (memoria, procesos, etc.)
export async function getServerStatus() {
  const res = await fetch('/api/status', {
    headers: authHeaders()
  });
  return res.text();
}
