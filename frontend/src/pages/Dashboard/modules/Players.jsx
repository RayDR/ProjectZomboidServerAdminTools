import React, { useEffect, useState } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import { getPlayers } from '../../../services/api';
import { useTranslation } from '../../../i18n';

export default function Players() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayers()
      .then(setPlayers)
      .catch(err => setError(err.message));
  }, []);

  return (
    <CollapsibleGroup title={`🧑‍🤝‍🧑 ${t('dashboard.connectedPlayers')}`}>
      {error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {players.length > 0 ? (
            players.map((name, i) => (
              <li key={i}>🎮 {name}</li>
            ))
          ) : (
            <li>{t('dashboard.noPlayersConnected')}</li>
          )}
        </ul>
      )}
    </CollapsibleGroup>
  );
}
