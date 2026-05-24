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
      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('pzwebadmin-auth-changed'));
      onLogin();
    } else {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 text-center max-w-md mx-auto">
      <img src="/zombielogo.png" alt="Project Zomboid" className="mx-auto mb-6 max-h-32 object-contain" />
      <div className="mb-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input w-full"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full justify-center">
        Login
      </button>
    </form>
  );
}
