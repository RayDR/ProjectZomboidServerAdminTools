import React, { useEffect, useState, useRef } from 'react';
import { getServerStatus } from '../services/api';

export default function StatusBox() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStatus = async () => {
    if (document.hidden) return;
    try {
      const result = await getServerStatus();
      setStatus(result);
      setError(null);
    } catch {
      setError('Connection failed.');
    }
  };

  useEffect(() => {
    fetchStatus();

    const startInterval = () => {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchStatus, 15000);
      }
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        fetchStatus();
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (!document.hidden) startInterval();

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (error) {
    return (
      <div className="pz-status red">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!status) {
    return <div className="pz-status">Cargando estado...</div>;
  }

  const { server, status: serverStatus, components, checkedAt } = status;
  const mem = components?.memory || {};
  const db = components?.database;
  const zomboid = components?.zomboidProcess;

  return (
    <div className="bg-surfaceAlt p-4 border border-border rounded-lg text-text font-mono text-sm space-y-2">
      <div>
        <strong className="text-primary">🌐 Estado:</strong>{' '}
        <span className={serverStatus === 'RUNNING' ? 'text-success font-bold' : 'text-danger font-bold'}>{serverStatus}</span>
      </div>
      <div>
        <strong className="text-primary">🗄 Servidor:</strong> {server}
      </div>
      <div>
        <strong className="text-primary">🧬 Proceso:</strong> {zomboid || 'Desconocido'}
      </div>
      <div>
        <strong className="text-primary">📊 Memoria:</strong>{' '}
        {mem.usagePercent
          ? `${mem.usagePercent.toFixed(1)}% usada (${(mem.used / 1e9).toFixed(1)} GB de ${(mem.total / 1e9).toFixed(1)} GB)`
          : 'No disponible'}
      </div>
      <div>
        <strong className="text-primary">💾 Base de datos:</strong>{' '}
        {db?.ok ? '✅ OK' : '❌ Error'}
      </div>
      <div className="text-xs mt-2 text-muted">
        Última verificación: {checkedAt ? new Date(checkedAt).toLocaleString() : 'n/d'}
      </div>
    </div>
  );
}
