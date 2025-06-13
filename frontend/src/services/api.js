// Return the Authorization headers if a token exists in localStorage
export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Get list of connected players via RCON
 * @returns {Promise<string>} - The list of connected players
 */
export async function getPlayers() {
  const res = await fetch('/api/players', {
    headers: authHeaders()
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || 'Failed to fetch players');
  }

  const data = await res.json();
  return data.players;
}

/**
 * Get server logs from the backend (main or maintenance)
 * @param {string} type - Log type ('main' or 'maintenance')
 * @param {number} lines - Number of lines to fetch
 * @returns {Promise<string>} - The raw log content
 */
export async function getLogs(type = 'main', lines = 50) {
  const logType = ['main', 'maintenance', 'errors'].includes(type) ? type : 'main';
  const res = await fetch(`/api/logs?type=${logType}&lines=${lines}`, {
    headers: authHeaders()
  });
  const data = await res.json();
  if (!data?.log) throw new Error('Invalid log response');
  return data.log;
}

/**
 * Get error logs from the server
 * @param {number} lines - Number of lines to fetch
 * @returns {Promise<string>} - The log output (same as main)
 */
export async function getErrors(lines = 50) {
  return getLogs('errors', lines);
}

/**
 * Fetch the current Project Zomboid INI file content
 * @returns {Promise<string>} - Raw INI file content
 */
export async function getIni() {
  const res = await fetch('/api/config/ini', {
    headers: authHeaders()
  });

  const data = await res.json();
  if (!data?.content) throw new Error('Invalid INI response');
  return data.content;
}

/**
 * Save updated INI content back to the server
 * @param {string} content - New INI file content
 * @returns {Promise<string>} - Response message from the server
 */
export async function saveIni(content) {
  const res = await fetch('/api/config/ini', {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });

  const data = await res.json();
  return data?.message || 'INI updated.';
}

/**
 * Executes a backend command (e.g. restart, backup, update).
 * @param {string} action - The command action name
 * @returns {Promise<string>} - Command output message
 */
export async function runCommand(action) {
  const res = await fetch('/api/commands', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to execute command.');
  return data?.message || 'Command executed.';
}

/**
 * Get full server status: memory, PZ service, database, etc.
 * @returns {Promise<object>} - JSON object with server diagnostics
 */
export async function getServerStatus() {
  const res = await fetch('/api/status', {
    headers: authHeaders()
  });

  const data = await res.json();
  if (!data?.status) throw new Error('Invalid status response');
  return data;
}

/**
 * Sends a broadcast message to the server
 * @returns {Promise<string>} - Response message from the server
 */
export async function sendBroadcast(message) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  return res.json();
}