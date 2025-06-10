import React, { useEffect, useState } from 'react'
import { getServerStatus } from '../services/api'

export default function StatusBox() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    getServerStatus().then(setStatus)
  }, [])

  return (
    <div className="pz-status">
      <strong>Estado del servidor:</strong>{' '}
      <span className={status === 'active' ? 'green' : 'red'}>{status}</span>
    </div>
  )
}