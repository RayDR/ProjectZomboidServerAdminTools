import React, { useState, useEffect } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';

export default function Logs({ token }) {
  const [logTab, setLogTab] = useState('server');
  const [logs, setLogs] = useState({ server: '', maintenance: '', errors: '' });

  useEffect(() => {
    const fetchLog = (type) =>
      fetch(`/api/logs?type=${type}&lines=50`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.text());

    Promise.all(['main', 'maintenance'].map(fetchLog)).then(([main, maintenance]) =>
      setLogs({
        server: main,
        maintenance,
        errors: maintenance // reutiliza maintenance para mostrar "errors"
      })
    );
  }, [token]);

  const renderLog = () => logs[logTab] || '';

  return (
    <CollapsibleGroup title="📄 Logs del Servidor">
      <div style={{ marginBottom: 10 }}>
        {['server', 'maintenance', 'errors'].map(tab => (
          <button
            key={tab}
            onClick={() => setLogTab(tab)}
            style={{
              marginRight: 5,
              background: logTab === tab ? '#444' : '#222',
              color: logTab === tab ? '#fff' : '#ccc',
              border: '1px solid #555',
              padding: '5px 10px'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <pre style={{ background: '#111', color: '#aaffaa', padding: 10, maxHeight: '300px', overflow: 'auto' }}>
        {renderLog()}
      </pre>
    </CollapsibleGroup>
  );
}
