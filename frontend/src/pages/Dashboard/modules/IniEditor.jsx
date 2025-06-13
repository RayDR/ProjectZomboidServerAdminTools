import React, { useEffect, useState } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import ButtonConfirm from '../../../components/ButtonConfirm';
import { getIni, saveIni } from '../../../services/api';
export default function IniEditor() {
  const [ini, setIni] = useState('');

  useEffect(() => {
    getIni()
      .then(setIni)
      .catch(err => {
        console.error('[ERROR] INI Fetch failed:', err);
        alert('Error loading INI file');
      });
  }, []);

  const handleSave = async () => {
    try {
      const result = await saveIni(ini);
      alert(result);
    } catch (err) {
      console.error('[ERROR] INI Save failed:', err);
      alert('Error saving INI file');
    }
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
      <ButtonConfirm onConfirm={handleSave}>💾 Guardar INI</ButtonConfirm>
    </CollapsibleGroup>
  );
}
