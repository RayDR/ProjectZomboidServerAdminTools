import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlay, FaStop, FaSync, FaDownload, FaServer, 
  FaCheckCircle, FaTimesCircle, FaClock, FaMemory 
} from 'react-icons/fa';
import { Card, Button, Badge } from '../components/ui';
import { GlitchText, LoadingScreen, WarningFlash } from '../components/effects/ZombieEffects';
import ServerLogsModal from '../components/effects/ServerLogsModal';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const ServerControl = () => {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsModal, setLogsModal] = useState({ isOpen: false, operation: '', endpoint: '' });
  const { t } = useTranslation();

  const fetchServerStatus = async () => {
    try {
      const response = await api.get('/server/status');
      if (response.data.success) {
        setServerStatus(response.data.data);
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleServerAction = (action, actionName, endpoint) => {
    setLogsModal({
      isOpen: true,
      operation: actionName,
      endpoint: endpoint
    });
  };

  const handleCloseLogsModal = () => {
    setLogsModal({ isOpen: false, operation: '', endpoint: '' });
    setTimeout(fetchServerStatus, 1000);
  };

  const handleStart = () => handleServerAction('start', 'Iniciar Servidor', '/server/logs/stream/start');
  const handleStop = () => handleServerAction('stop', 'Detener Servidor', '/server/logs/stream/stop');
  const handleRestart = () => handleServerAction('restart', 'Reiniciar Servidor', '/server/logs/stream/restart');
  const handleUpdate = () => handleServerAction('update', 'Actualizar Servidor', '/server/logs/stream-update');

  if (loading) {
    return <LoadingScreen />;
  }

  const isRunning = serverStatus?.running;

  return (
    <div className="space-y-6">
      <WarningFlash active={!isRunning} />
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('serverControl.title') || 'SERVER CONTROL'}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('serverControl.subtitle') || 'Manage your Project Zomboid server'}
          </p>
        </div>
        <Button variant="secondary" onClick={fetchServerStatus}>
          🔄 {t('refresh')}
        </Button>
      </div>

      {/* Server Status Card */}
      <Card className={`border-2 ${isRunning ? 'border-zombie-green' : 'border-zombie-blood'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className={`text-5xl ${isRunning ? 'text-zombie-green' : 'text-zombie-blood'}`}>
              {isRunning ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-terminal-text">
                {isRunning ? t('nav.online') || 'ONLINE' : t('nav.offline') || 'OFFLINE'}
              </h2>
              <p className="text-gray-400">
                {t('serverControl.status') || 'Server Status'}: {serverStatus?.status || 'Unknown'}
              </p>
            </div>
          </div>
          <Badge variant={isRunning ? 'success' : 'error'} className="text-lg px-4 py-2">
            {isRunning ? '✓ OPERATIONAL' : '✗ STOPPED'}
          </Badge>
        </div>

        {/* Server Details */}
        {isRunning && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zombie-green">
            <div className="flex items-center space-x-3">
              <FaClock className="text-zombie-green text-2xl" />
              <div>
                <p className="text-gray-400 text-sm">{t('dashboard.uptime') || 'Uptime'}</p>
                <p className="text-terminal-text font-bold">{serverStatus?.uptime || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaMemory className="text-zombie-green text-2xl" />
              <div>
                <p className="text-gray-400 text-sm">{t('dashboard.memoryUsage') || 'Memory'}</p>
                <p className="text-terminal-text font-bold">{serverStatus?.memory || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaServer className="text-zombie-green text-2xl" />
              <div>
                <p className="text-gray-400 text-sm">PID</p>
                <p className="text-terminal-text font-bold">{serverStatus?.pid || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Control Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Controls */}
        <Card>
          <h3 className="text-xl font-bold text-terminal-text mb-4 flex items-center space-x-2">
            <FaServer />
            <span>{t('serverControl.primaryControls') || 'PRIMARY CONTROLS'}</span>
          </h3>
          <div className="space-y-3">
            <Button
              variant="success"
              onClick={handleStart}
              disabled={isRunning}
              className="w-full text-lg py-3"
            >
              <FaPlay className="mr-2" />
              {t('serverControl.start') || 'START SERVER'}
            </Button>
            
            <Button
              variant="warning"
              onClick={handleRestart}
              disabled={!isRunning}
              className="w-full text-lg py-3"
            >
              <FaSync className="mr-2" />
              {t('serverControl.restart') || 'RESTART SERVER'}
            </Button>
            
            <Button
              variant="danger"
              onClick={handleStop}
              disabled={!isRunning}
              className="w-full text-lg py-3"
            >
              <FaStop className="mr-2" />
              {t('serverControl.stop') || 'STOP SERVER'}
            </Button>
          </div>
        </Card>

        {/* Maintenance */}
        <Card>
          <h3 className="text-xl font-bold text-terminal-text mb-4 flex items-center space-x-2">
            <FaDownload />
            <span>{t('serverControl.maintenance') || 'MAINTENANCE'}</span>
          </h3>
          <div className="space-y-3">
            <Button
              variant="secondary"
              onClick={handleUpdate}
              disabled={isRunning}
              className="w-full text-lg py-3"
            >
              <FaDownload className="mr-2" />
              {t('serverControl.update') || 'UPDATE SERVER'}
            </Button>
            
            <div className="p-4 bg-zombie-gray-dark rounded border border-zombie-green">
              <p className="text-yellow-400 text-sm mb-2">⚠ {t('serverControl.updateWarning') || 'Important:'}</p>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>{t('serverControl.updateWarning1') || 'Server must be stopped before updating'}</li>
                <li>{t('serverControl.updateWarning2') || 'Updates may take several minutes'}</li>
                <li>{t('serverControl.updateWarning3') || 'Always create a backup before updating'}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Information Panel */}
      <Card className="bg-black bg-opacity-50">
        <h3 className="text-lg font-bold text-zombie-green mb-3 uppercase tracking-wide">
          ℹ {t('serverControl.controlInfo') || 'Control Information'}
        </h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>• {t('serverControl.info1') || 'All server operations are executed with proper permissions'}</p>
          <p>• {t('serverControl.info2') || 'Start/Stop/Restart commands use systemctl service management'}</p>
          <p>• {t('serverControl.info3') || 'Server status is updated automatically every 5 seconds'}</p>
          <p>• {t('serverControl.info4') || 'Use the console for advanced RCON commands'}</p>
        </div>
      </Card>

      {/* Server Logs Modal */}
      <ServerLogsModal
        isOpen={logsModal.isOpen}
        onClose={handleCloseLogsModal}
        operation={logsModal.operation}
        endpoint={logsModal.endpoint}
      />
    </div>
  );
};

export default ServerControl;
