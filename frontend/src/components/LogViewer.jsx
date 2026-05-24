import React, { useState, useEffect } from 'react';

export default function LogViewer({ token }) {
  const [logTab, setLogTab] = useState('server');
  const [logs, setLogs] = useState({ server: '', maintenance: '', errors: '' });
  const [lines, setLines] = useState(100);

  const fetchLog = (type) =>
    fetch(`/api/logs?type=${type}&lines=${lines}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.text());

  useEffect(() => {
    Promise.all(['main', 'maintenance'].map(fetchLog)).then(([main, maintenance]) =>
      setLogs({
        server: main,
        maintenance,
        errors: maintenance // se reutiliza
      })
    );
  }, [lines, token]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {['server', 'maintenance', 'errors'].map(tab => (
          <button key={tab} onClick={() => setLogTab(tab)} className="btn btn-secondary text-sm px-2 py-1">
            {tab}
          </button>
        ))}
        <input
          type="number"
          min="10"
          value={lines}
          onChange={(e) => setLines(Number(e.target.value))}
          className="input w-24 ml-4"
        />
      </div>
      <pre className="console-shell max-h-[300px] overflow-auto whitespace-pre-wrap">
        {logs[logTab]}
      </pre>
    </div>
  );
}
