import React, { useState, useEffect } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import { getLogs } from '../../../services/api';

export default function Logs() {
  const [logTab, setLogTab] = useState('server');
  const [logs, setLogs] = useState({
    server: { content: '', error: false },
    maintenance: { content: '', error: false },
    errors: { content: '', error: false }
  });

  const fetchLog = async (type) => {
    try {
      const content = await getLogs(type);
      setLogs(prev => ({
        ...prev,
        [type]: { content, error: false }
      }));
    } catch {
      setLogs(prev => ({
        ...prev,
        [type]: { content: `❌ Failed to fetch ${type} log`, error: true }
      }));
    }
  };

  useEffect(() => {
    ['server', 'maintenance', 'errors'].forEach(fetchLog);
  }, []);

  const getLogColor = (type) => {
    switch (type) {
      case 'maintenance': return '#ffff66';
      case 'errors': return '#ff6666';
      default: return '#aaffaa'; // server
    }
  };

  const renderLog = () => logs[logTab]?.content || '';

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
        <button
          onClick={() => fetchLog(logTab)}
          style={{
            marginLeft: 10,
            background: '#222',
            color: '#fff',
            border: '1px solid #555',
            padding: '5px 10px'
          }}
        >
          🔁 Refresh
        </button>
      </div>

      <pre style={{
        background: '#111',
        color: getLogColor(logTab),
        padding: 10,
        maxHeight: '300px',
        overflow: 'auto',
        fontFamily: 'monospace',
        border: logs[logTab].error ? '1px solid red' : '1px solid #333'
      }}>
        {renderLog()}
      </pre>
    </CollapsibleGroup>
  );
}
