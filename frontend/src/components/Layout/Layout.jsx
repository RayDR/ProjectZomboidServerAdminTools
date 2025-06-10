import React from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'

export default function Layout({ children }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="pz-container">
      <header className="pz-header">
        <h1>🧠 Project Zomboid WebAdmin</h1>
        <button onClick={handleLogout}>🚪 Logout</button>
      </header>
      {children}
    </div>
  )
}