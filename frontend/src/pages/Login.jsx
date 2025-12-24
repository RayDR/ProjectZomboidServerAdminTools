import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSkull, FaUser, FaLock } from 'react-icons/fa';
import { Button, Input, Alert } from '../components/ui';
import { GlitchText, CRTScreen, BloodDrip, LoadingScreen } from '../components/effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import LanguageSelector from '../components/LanguageSelector';
import api from '../services/api';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { username: 'admin', password });
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message={t('loading').toUpperCase() + '...'} />;
  }

  return (
    <div className="min-h-screen bg-zombie-gray-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <BloodDrip delay={0} />
      <BloodDrip delay={2} />
      <BloodDrip delay={4} />
      
      {/* Zombie decorations */}
      <motion.div
        className="absolute top-10 left-10 text-6xl opacity-20"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🧟
      </motion.div>
      <motion.div
        className="absolute bottom-10 right-10 text-6xl opacity-20"
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
      >
        🧟‍♀️
      </motion.div>

      {/* Login box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Language selector - top right */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        
        <CRTScreen className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block text-7xl mb-4"
            >
              <FaSkull className="text-zombie-blood" />
            </motion.div>
            <h1 className="text-4xl font-bold text-terminal-text font-zombie mb-2">
              <GlitchText>{t('login.title')}</GlitchText>
            </h1>
            <p className="text-zombie-green uppercase tracking-widest text-sm">
              {t('login.subtitle')}
            </p>
            <div className="mt-4 h-px bg-zombie-green"></div>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="error" onClose={() => setError('')} className="mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⚠️</span>
                <span>{error}</span>
              </div>
            </Alert>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-terminal-text mb-2 font-bold uppercase text-sm flex items-center space-x-2">
                <FaUser className="text-zombie-green" />
                <span>{t('login.administrator')}</span>
              </label>
              <div className="bg-zombie-gray-dark text-terminal-text border-2 border-zombie-gray px-4 py-2 rounded font-mono">
                admin
              </div>
            </div>

            <div>
              <label className="block text-terminal-text mb-2 font-bold uppercase text-sm flex items-center space-x-2">
                <FaLock className="text-zombie-green" />
                <span>{t('login.password')}</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
                className="w-full"
                autoComplete="current-password"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full text-lg"
              disabled={!password}
            >
              🔓 {t('login.accessSystem')}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 font-mono">
              ⚠️ {t('login.authorizedOnly')} ⚠️
            </p>
            <p className="text-xs text-zombie-green mt-2">
              PZWebAdmin v2.0 © 2025 DomoForge
            </p>
          </div>
        </CRTScreen>

        {/* Warning labels */}
        <div className="mt-4 flex justify-center space-x-4">
          <div className="bg-zombie-warning text-zombie-gray-dark px-3 py-1 font-bold text-xs uppercase transform -rotate-2">
            ☣️ {t('login.biohazard')} ☣️
          </div>
          <div className="bg-zombie-blood text-white px-3 py-1 font-bold text-xs uppercase transform rotate-2">
            🚫 {t('login.restrictedAccess')} 🚫
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
