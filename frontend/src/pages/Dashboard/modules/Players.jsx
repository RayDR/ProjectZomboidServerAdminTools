import React, { useEffect, useState } from 'react';
import CollapsibleGroup from '../../../components/CollapsibleGroup';
import { getPlayers } from '../../../services/api';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayers()
      .then(setPlayers)
      .catch(err => setError(err.message));
  }, []);

  return (
    <CollapsibleGroup title="🧑‍🤝‍🧑 Connected Players">
      {error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {players.length > 0 ? (
            players.map((name, i) => (
              <li key={i}>🎮 {name}</li>
            ))
          ) : (
            <li>No players connected</li>
          )}
        </ul>
      )}
    </CollapsibleGroup>
  );
}
