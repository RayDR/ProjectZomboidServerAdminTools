import React, { useState, useEffect } from 'react';

export default function LogViewer({ token }) {
  const [logTab, setLogTab] = useState('server');
  const [logs, setLogs] = useState({ server: '', maintenance: '', errors: '' });
  const [lines, setLines] = useState(100);

  const fetchLog = (type) =>
    fetch(\`/api/logs/\${type}?lines=\${lines}\`, {
      headers: { Authorization: \`Bearer \${token}\` }
    }).then(res => res.text());

  useEffect(() => {
    Promise.all(['server', 'maintenance', 'errors'].map(fetchLog))
      .then(([server, maintenance, errors]) => setLogs({ server, maintenance, errors }));
  }, [lines]);

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        {['server', 'maintenance', 'errors'].map(tab => (
          <button key={tab} onClick={() => setLogTab(tab)} style={{ marginRight: 5 }}>
            {tab}
          </button>
        ))}
        <input
          type="number"
          min="10"
          value={lines}
          onChange={(e) => setLines(e.target.value)}
          style={{ marginLeft: 10, width: 80 }}
        />
      </div>
      <pre style={{ background: '#222', color: '#aaffaa', maxHeight: 300, overflow: 'auto', padding: 10 }}>
        {logs[logTab]}
      </pre>
    </div>
  );
}
