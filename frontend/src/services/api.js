export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getPlayers() {
  const res = await fetch('/api/players', { headers: authHeaders() });
  return res.text();
}

export async function getLogs(type = 'server', lines = 50) {
  const res = await fetch(`/api/logs/${type}?lines=${lines}`, {
    headers: authHeaders()
  });
  return res.text();
}

export async function getErrors(lines = 50) {
  const res = await fetch(`/api/errors?lines=${lines}`, {
    headers: authHeaders()
  });
  return res.text();
}

export async function getIni() {
  const res = await fetch('/api/config/ini', {
    headers: authHeaders()
  });
  return res.text();
}

export async function saveIni(content) {
  const res = await fetch('/api/config/ini', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });
  return res.text();
}

export async function runCommand(cmd) {
  const res = await fetch(`/api/command/${cmd}`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.text();
}

export async function getServerStatus() {
  const res = await fetch('/api/status', {
    headers: authHeaders()
  });
  return res.text();
}