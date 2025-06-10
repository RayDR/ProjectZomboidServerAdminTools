import React, { useState, useEffect } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';

export default function Logs({ token }) {
  const [logTab, setLogTab] = useState('server');
  const [logs, setLogs] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [errors, setErrors] = useState('');

  useEffect(() => {
    fetch('/api/logs/server?lines=50', { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.text()).then(setLogs);
    fetch('/api/logs/maintenance?lines=50', { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.text()).then(setMaintenance);
    fetch('/api/errors?lines=50', { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.text()).then(setErrors);
  }, [token]);

  const renderLog = () => {
    if (logTab === 'server') return logs;
    if (logTab === 'maintenance') return maintenance;
    if (logTab === 'errors') return errors;
    return '';
  };

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
  )
}