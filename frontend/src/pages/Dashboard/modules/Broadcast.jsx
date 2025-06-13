import React, { useState } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import ButtonConfirm from '../../../components/ButtonConfirm';
import { sendBroadcast } from '../../../services/api';

export default function Broadcast() {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    try {
      const result = await sendBroadcast(message);
      alert(`✅ Sent: ${result.message}`);
      setMessage('');
    } catch (err) {
      alert('❌ Failed to send broadcast');
      console.error('[Broadcast Error]', err);
    }
  };

  return (
    <CollapsibleGroup title="📢 Enviar Mensaje al Servidor">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Type your message to all players..."
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
      <ButtonConfirm onConfirm={handleSend}>📨 Enviar</ButtonConfirm>
    </CollapsibleGroup>
  );
}
