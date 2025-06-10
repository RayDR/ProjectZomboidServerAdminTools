import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/Auth/LoginForm';

import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/dashboard');
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h2>🔐 Project Zomboid WebAdmin</h2>
        <LoginForm onLogin={handleLogin} />
      </div>
    </div>
  );
}
