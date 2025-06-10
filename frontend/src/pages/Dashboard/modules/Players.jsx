import React, { useEffect, useState } from 'react'
import CollapsibleGroup from '../../../components/CollapsibleGroup'
import { getPlayers } from '../../../services/api'

export default function Players() {
  const [players, setPlayers] = useState('')

  useEffect(() => {
    getPlayers().then(setPlayers)
  }, [])

  return (
    <CollapsibleGroup title="🧍 Jugadores Conectados">
      <pre className="pz-pre green">{players}</pre>
    </CollapsibleGroup>
  )
}