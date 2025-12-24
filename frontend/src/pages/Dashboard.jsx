import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaServer, FaUsers, FaMemory, FaClock, FaHdd,
  FaExclamationTriangle, FaCheckCircle, FaSkull,
  FaPlay, FaStop, FaRedo, FaSave, FaBullhorn, FaUserSlash, FaDownload
} from 'react-icons/fa';
import { Card, Badge, Button } from '../components/ui';
import { GlitchText, CRTScreen, WarningFlash } from '../components/effects/ZombieEffects';
import ServerLogsModal from '../components/effects/ServerLogsModal';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [serverStatus, setServerStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logsModal, setLogsModal] = useState({ isOpen: false, operation: '', endpoint: '' });
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      const [statusRes, healthRes, serverRes] = await Promise.all([
        api.get('/status'),
        api.get('/health'),
        api.get('/server/status')
      ]);
      setServerStatus({
        ...statusRes.data,
        serverDetails: serverRes.data.data // PZ server details
      });
      setHealth(healthRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServerAction = async (action, actionName) => {
    // Map action to endpoint
    const endpointMap = {
      'start': '/server/logs/stream/start',
      'stop': '/server/logs/stream/stop',
      'restart': '/server/logs/stream/restart',
      'backup': '/server/logs/stream-backup',
      'update': '/server/logs/stream-update'
    };

    const endpoint = endpointMap[action];
    if (endpoint) {
      setLogsModal({
        isOpen: true,
        operation: actionName,
        endpoint: endpoint
      });
    } else {
      toast.error('Acción no soportada');
    }
  };

  const handleCloseLogsModal = () => {
    setLogsModal({ isOpen: false, operation: '', endpoint: '' });
    // Refresh data after modal closes
    setTimeout(fetchData, 1000);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptimeStr) => {
    if (!uptimeStr) return 'N/A';
    
    // uptimeStr format examples from ps etime:
    // "DD-HH:MM:SS" (more than 1 day)
    // "HH:MM:SS" (less than 1 day)
    // "MM:SS" (less than 1 hour)
    
    const parts = uptimeStr.trim().split('-');
    let days = 0;
    let timePart = uptimeStr;
    
    // Check if there are days (format: DD-HH:MM:SS)
    if (parts.length === 2) {
      days = parseInt(parts[0]);
      timePart = parts[1];
    }
    
    // Split time part (HH:MM:SS or MM:SS)
    const timeComponents = timePart.split(':').map(s => parseInt(s) || 0);
    
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    if (timeComponents.length === 3) {
      // HH:MM:SS
      [hours, minutes, seconds] = timeComponents;
    } else if (timeComponents.length === 2) {
      // MM:SS
      [minutes, seconds] = timeComponents;
    }
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            ☣️
          </motion.div>
          <p className="text-terminal-text text-xl">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const memoryPercent = health?.memory?.usagePercent || 0;
  const isHighMemory = memoryPercent > 80;
  
  // Use server-specific memory and uptime
  const pzMemory = serverStatus?.serverDetails?.memory || 'N/A';
  const pzUptime = serverStatus?.serverDetails?.uptime || null;

  return (
    <div className="space-y-6">
      <WarningFlash active={isHighMemory} />
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('dashboard.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={fetchData}>
            🔄 {t('refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-zombie-blood bg-zombie-blood bg-opacity-10">
          <div className="flex items-center space-x-3">
            <FaExclamationTriangle className="text-zombie-blood text-2xl" />
            <div>
              <h3 className="font-bold text-zombie-error">Error Loading Data</h3>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Server Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-zombie-green to-zombie-green-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white opacity-80 uppercase tracking-wide">{t('dashboard.serverStatus')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {serverStatus?.zomboidRunning ? t('nav.online') : t('nav.offline')}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-white opacity-20">
              {serverStatus?.zomboidRunning ? <FaCheckCircle /> : <FaSkull />}
            </div>
          </div>
          <div className="mt-4">
            <Badge variant={serverStatus?.zomboidRunning ? 'success' : 'error'}>
              {serverStatus?.zomboidRunning ? `✓ ${t('dashboard.operational')}` : `✗ ${t('dashboard.down')}`}
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-terminal-text opacity-70 uppercase tracking-wide">{t('dashboard.playersOnline')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-terminal-text mt-1">
                {serverStatus?.players?.online || 0} / {serverStatus?.players?.max || 15}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-zombie-green opacity-30">
              <FaUsers />
            </div>
          </div>
          <div className="mt-4 bg-zombie-gray-dark rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${((serverStatus?.players?.online || 0) / (serverStatus?.players?.max || 15)) * 100}%` 
              }}
              className="h-full bg-zombie-green"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-terminal-text opacity-70 uppercase tracking-wide">{t('dashboard.memoryUsage')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-terminal-text mt-1">
                {pzMemory}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-zombie-green opacity-30">
              <FaMemory />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Project Zomboid Server
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-terminal-text opacity-70 uppercase tracking-wide">{t('dashboard.uptime')}</p>
              <h3 className="text-xl sm:text-2xl font-bold text-terminal-text mt-1">
                {formatUptime(pzUptime)}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-zombie-green opacity-30">
              <FaClock />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            PID: {serverStatus?.serverDetails?.pid || 'N/A'}
          </div>
        </Card>
      </div>

      {/* Server Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CRTScreen className="p-6">
          <h2 className="text-2xl font-bold text-terminal-text mb-4 flex items-center space-x-2">
            <FaServer />
            <span>{t('dashboard.serverInfo').toUpperCase()}</span>
          </h2>
          <div className="space-y-3 font-mono">
            <div className="flex justify-between border-b border-zombie-green pb-2">
              <span className="text-gray-400">{t('dashboard.serverName')}:</span>
              <span className="text-terminal-text font-bold">{serverStatus?.serverName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-zombie-green pb-2">
              <span className="text-gray-400">{t('dashboard.version')}:</span>
              <span className="text-terminal-text">{serverStatus?.version || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-zombie-green pb-2">
              <span className="text-gray-400">{t('dashboard.database')}:</span>
              <span className={health?.database?.ok ? 'text-zombie-success' : 'text-zombie-error'}>
                {health?.database?.ok ? `✓ ${t('connected')}` : `✗ ${t('error')}`}
              </span>
            </div>
            <div className="flex justify-between border-b border-zombie-green pb-2">
              <span className="text-gray-400">RCON:</span>
              <span className="text-zombie-success">✓ {t('available')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('environment')}:</span>
              <span className="text-terminal-text">{health?.environment || 'production'}</span>
            </div>
          </div>
        </CRTScreen>

        <Card>
          <h2 className="text-2xl font-bold text-terminal-text mb-4 flex items-center space-x-2">
            <FaHdd className="text-zombie-green" />
            <span>{t('dashboard.quickActions').toUpperCase()}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Start Server */}
            {!serverStatus?.zomboidRunning && (
              <Button 
                variant="primary" 
                className="w-full col-span-full"
                onClick={() => handleServerAction('start', 'Start Server')}
              >
                <FaPlay className="mr-2" />
                {t('dashboard.start').toUpperCase()}
              </Button>
            )}

            {/* Restart Server */}
            {serverStatus?.zomboidRunning && (
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => handleServerAction('restart', 'Restart Server')}
              >
                <FaRedo className="mr-2" />
                {t('dashboard.restart').toUpperCase()}
              </Button>
            )}

            {/* Stop Server */}
            {serverStatus?.zomboidRunning && (
              <Button 
                variant="danger" 
                className="w-full"
                onClick={() => handleServerAction('stop', 'Stop Server')}
              >
                <FaStop className="mr-2" />
                {t('dashboard.stop').toUpperCase()}
              </Button>
            )}

            {/* Backup */}
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => handleServerAction('backup', 'Create Backup')}
            >
              <FaSave className="mr-2" />
              {t('dashboard.backup').toUpperCase()}
            </Button>

            {/* Broadcast - Navigate to console */}
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => window.location.href = '/console'}
            >
              <FaBullhorn className="mr-2" />
              {t('dashboard.broadcast').toUpperCase()}
            </Button>

            {/* Update Server */}
            <Button 
              variant="secondary" 
              className="w-full col-span-full"
              onClick={() => handleServerAction('update', 'Update Server')}
            >
              <FaDownload className="mr-2" />
              {t('dashboard.updateServer').toUpperCase()}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-zombie-gray-dark rounded border border-zombie-green">
            <h3 className="font-bold text-zombie-warning mb-2 flex items-center space-x-2">
              <FaExclamationTriangle />
              <span>{t('dashboard.systemAlerts').toUpperCase()}</span>
            </h3>
            <div className="space-y-2 text-sm">
              {isHighMemory && (
                <div className="text-zombie-error">
                  ⚠ {t('dashboard.highMemoryDetected', { percent: memoryPercent.toFixed(1) })}
                </div>
              )}
              {!serverStatus?.zomboidRunning && (
                <div className="text-zombie-error">
                  ⚠ {t('dashboard.serverIsOffline')}
                </div>
              )}
              {serverStatus?.zomboidRunning && !isHighMemory && (
                <div className="text-zombie-success">
                  ✓ {t('dashboard.allSystemsOperational')}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-2xl font-bold text-terminal-text mb-4">{t('dashboard.recentActivity').toUpperCase()}</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex items-start space-x-3 text-zombie-success">
            <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
            <span>{t('dashboard.statusCheckCompleted')}</span>
          </div>
          <div className="flex items-start space-x-3 text-terminal-text">
            <span className="text-gray-500">[{new Date(Date.now() - 60000).toLocaleTimeString()}]</span>
            <span>{t('dashboard.autoSaveCompleted')}</span>
          </div>
          <div className="flex items-start space-x-3 text-terminal-text">
            <span className="text-gray-500">[{new Date(Date.now() - 300000).toLocaleTimeString()}]</span>
            <span>{t('dashboard.playerConnected')}: {serverStatus?.players?.online > 0 ? t('active') : t('none')}</span>
          </div>
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

export default Dashboard;
