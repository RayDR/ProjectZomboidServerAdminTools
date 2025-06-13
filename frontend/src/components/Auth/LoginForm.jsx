import React, { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[LOGIN] Token recibido del backend:', data.token);
      localStorage.setItem('token', data.token);
      onLogin();
    } else {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem', textAlign: 'center' }}>
      <img src="/zombielogo.png" alt="Project Zomboid"/>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </div>
      <button type="submit">
        Login
      </button>
    </form>
  );
}
