import React from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import ButtonConfirm from '../../../components/ButtonConfirm';
import { runCommand } from '../../../services/api';

export default function Actions() {
  const actions = [
    { action: 'restart', label: '🔁 Reiniciar servidor' },
    { action: 'backup', label: '📦 Backup' },
    { action: 'fullupdate', label: '🛠️ Full Update' }
  ];

  const handleAction = async (action) => {
    try {
      const text = await runCommand(action);
      alert(text);
    } catch (err) {
      console.error(`[ERROR] runCommand failed (${action}):`, err);
      alert('Error ejecutando la acción');
    }
  };

  return (
    <CollapsibleGroup title="⚙️ Acciones">
      <div
        className="pz-actions"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'flex-start'
        }}
      >
        {actions.map(({ action, label }) => (
          <ButtonConfirm key={action} onConfirm={() => handleAction(action)}>
            {label}
          </ButtonConfirm>
        ))}
      </div>
    </CollapsibleGroup>
  );
}
