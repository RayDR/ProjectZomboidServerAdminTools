import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from './i18n/index.jsx';
import './styles/index.css';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerControl from './pages/ServerControl';
import Logs from './pages/Logs';
import Mods from './pages/Mods';
import Backups from './pages/Backups';
import Config from './pages/Config';
import Console from './pages/Console';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <I18nProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: '#2A2A2A',
            color: '#00FF00',
            border: '2px solid #3A5F3A',
            fontFamily: 'monospace',
          },
          success: {
            iconTheme: {
              primary: '#44FF44',
              secondary: '#2A2A2A',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF4444',
              secondary: '#2A2A2A',
            },
          },
        }}
      />
      
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="server" element={<ServerControl />} />
            <Route path="logs" element={<Logs />} />
            <Route path="mods" element={<Mods />} />
            <Route path="backups" element={<Backups />} />
            <Route path="config" element={<Config />} />
            <Route path="console" element={<Console />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
