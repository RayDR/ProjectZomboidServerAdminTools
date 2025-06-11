import React from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import ButtonConfirm from '../../../components/ButtonConfirm';

export default function Actions() {
  const actions = [
    { action: 'restart', label: '🔁 Reiniciar servidor' },
    { action: 'backup', label: '📦 Backup' },
    { action: 'fullupdate', label: '🛠️ Full Update' }
  ];

  const handleAction = async (action) => {
    const res = await fetch(`/api/commands/${action}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    const text = await res.text();
    alert(text);
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
