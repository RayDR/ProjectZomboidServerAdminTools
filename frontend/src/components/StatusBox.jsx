import React, { useEffect, useState } from 'react';
import { getServerStatus } from '../services/api';

export default function StatusBox() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getServerStatus()
      .then(res => {
        try {
          const parsed = JSON.parse(res);
          setStatus(parsed);
        } catch (e) {
          setStatus({ error: 'Invalid response from server.' });
        }
      })
      .catch(() => setStatus({ error: 'Connection failed.' }));
  }, []);

  if (!status) return <div className="pz-status">Cargando estado...</div>;

  if (status.error)
    return (
      <div className="pz-status red">
        <strong>Error:</strong> {status.error}
      </div>
    );

  const {
    server,
    status: serverStatus,
    components,
    checkedAt
  } = status;

  const mem = components?.memory || {};
  const db = components?.database;
  const zomboid = components?.zomboidProcess;

  return (
    <div
      className="pz-status"
      style={{
        background: '#111',
        padding: '1rem',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#eee',
        fontFamily: 'monospace'
      }}
    >
      <div>
        <strong>🌐 Estado:</strong>{' '}
        <span style={{ color: 'limegreen' }}>{serverStatus}</span>
      </div>
      <div>
        <strong>🗄 Servidor:</strong> {server}
      </div>
      <div>
        <strong>🧬 Proceso:</strong> {zomboid}
      </div>
      <div>
        <strong>📊 Memoria:</strong>{' '}
        {mem.usagePercent
          ? `${mem.usagePercent.toFixed(1)}% usada (${(mem.used / 1e9).toFixed(1)} GB de ${(mem.total / 1e9).toFixed(1)} GB)`
          : 'No disponible'}
      </div>
      <div>
        <strong>💾 Base de datos:</strong>{' '}
        {db?.ok ? '✅ OK' : '❌ Error'}
      </div>
      <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#888' }}>
        Última verificación: {new Date(checkedAt).toLocaleString()}
      </div>
    </div>
  );
}
