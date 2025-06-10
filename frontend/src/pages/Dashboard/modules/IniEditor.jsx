import React, { useEffect, useState } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import ButtonConfirm from '../../../components/ButtonConfirm';

export default function IniEditor({ token }) {
  const [ini, setIni] = useState('');

  useEffect(() => {
    fetch('/api/config/ini', { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.text()).then(setIni);
  }, [token]);

  const saveIni = async () => {
    const res = await fetch('/api/config/ini', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: ini })
    });
    alert(await res.text());
  };

  return (
    <CollapsibleGroup title="📝 Archivo INI del Servidor">
      <textarea
        value={ini}
        onChange={(e) => setIni(e.target.value)}
        rows={20}
        style={{
          width: '100%',
          background: '#0d0d0f',
          color: '#0f0',
          fontFamily: 'monospace',
          padding: '10px',
          marginBottom: '10px',
          border: '1px solid #333'
        }}
      />
      <br />
      <ButtonConfirm onConfirm={saveIni}>💾 Guardar INI</ButtonConfirm>
    </CollapsibleGroup>
  )
}