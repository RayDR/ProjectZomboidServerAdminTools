import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaServer, FaUsers, FaMemory, FaClock, FaHdd, FaPlus,
  FaExclamationTriangle, FaCheckCircle, FaSkull,
  FaPlay, FaStop, FaRedo, FaSave, FaTerminal, FaCog, FaMicrochip
} from 'react-icons/fa';
import { Card, Badge, Button } from '../components/ui';
import { GlitchText, WarningFlash } from '../components/effects/ZombieEffects';
import AddInstanceModal from '../components/AddInstanceModal';
import InstanceDetailsModal from '../components/InstanceDetailsModal';
import InstallTaskModal from '../components/InstallTaskModal';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const Dashboard = () => {
  const { settings } = useTheme();
  const [instances, setInstances] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInstallTaskId, setSelectedInstallTaskId] = useState(null);
  const [systemLoad, setSystemLoad] = useState(0);
  const [showStats, setShowStats] = useState({ cpu: false, memory: false });
  const fetchInFlightRef = useRef(false);
  const { t } = useTranslation();

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`;
  };

  const toggleStat = (type) => setShowStats(prev => ({ ...prev, [type]: !prev[type] }));

  const fetchData = async () => {
    if (fetchInFlightRef.current) {
      return;
    }
    fetchInFlightRef.current = true;
    try {
      const [instancesRes, healthRes] = await Promise.all([
        api.get('/instances'),
        api.get('/health') // Assuming this returns system stats
      ]);

      setInstances(instancesRes.data.data);
      setHealth(healthRes.data);

      // Calculate generic system load if available
      if (healthRes.data?.load) setSystemLoad(healthRes.data.load);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load system data');
    } finally {
      fetchInFlightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, settings.refreshRate || 5000);
    return () => clearInterval(interval);
  }, [settings.refreshRate]);

  const handleInstanceAction = async (e, id, action) => {
    e.stopPropagation(); // Prevent opening modal
    try {
      if (action === 'refresh') {
        await fetchData();
        return;
      }

      let endpoint = '';
      switch (action) {
        case 'start': endpoint = `/instances/${id}/start`; break;
        case 'stop': endpoint = `/instances/${id}/stop`; break;
        case 'restart': endpoint = `/instances/${id}/restart`; break;
        case 'kill': endpoint = `/instances/${id}/kill`; break;
        case 'retry-install': endpoint = `/instances/${id}/retry-install`; break;
      }

      if (!endpoint) {
        toast.error(t('dashboardInline.unsupportedAction'), { id: 'action-toast' });
        return;
      }

      toast.loading(`${t('dashboardInline.executingAction')} ${action}...`, { id: 'action-toast' });
      const res = await api.post(endpoint);

      if (res.data.success) {
        toast.success(res.data.message, { id: 'action-toast' });
        if (action === 'retry-install' && res.data?.taskId) {
          setSelectedInstallTaskId(res.data.taskId);
        }
        await fetchData();
      } else {
        toast.error(t('dashboardInline.actionFailed'), { id: 'action-toast' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboardInline.actionFailed'), { id: 'action-toast' });
    }
  };
  const canRetryInstall = (instance) => !instance.running && (instance.broken || instance.installationStatus === 'failed' || instance.shutdownReason === 'installation_failed');


  const handleOpenInstance = (instance) => {
    if (
      !instance.running &&
      instance.installationTaskId
      && (
        instance.installationLocked
        || instance.installationStatus === 'failed'
        || instance.installationStatus === 'running'
        || instance.installationStatus === 'pending'
      )
    ) {
      setSelectedInstallTaskId(instance.installationTaskId);
      return;
    }
    setSelectedInstance(instance);
  };

  if (loading && instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl mb-4 text-zombie-green"
        >
          <FaCog />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text font-title">
            <GlitchText>{t('dashboard.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green opacity-80">{t('dashboard.subtitle')}</p>
        </div>
        <Button variant="secondary" onClick={fetchData}><FaRedo className="mr-2" /> {t('refresh')}</Button>
      </div>

      {/* System Health Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* CPU */}
        <Card
          className="bg-zombie-black border-zombie-green bg-opacity-50 cursor-pointer hover:bg-opacity-70 transition-all"
          onClick={() => toggleStat('cpu')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">{t('dashboard.cpuLoad')}</p>
              <h3 className="text-xl font-bold text-zombie-green">
                {showStats.cpu ? `${health?.process?.cpu?.toFixed(1) || 0}% Process` : `${health?.cpu || 0}%`}
              </h3>
            </div>
            <FaMicrochip className="text-2xl text-zombie-green opacity-50" />
          </div>
          <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-zombie-green h-full transition-all duration-500" style={{ width: `${health?.cpu || 0}%` }}></div>
          </div>
          {showStats.cpu && <p className="text-xs text-gray-500 mt-1">Load: {systemLoad ? systemLoad.join(', ') : 'N/A'}</p>}
        </Card>

        {/* Memory */}
        <Card
          className="bg-zombie-black border-zombie-green bg-opacity-50 cursor-pointer hover:bg-opacity-70 transition-all"
          onClick={() => toggleStat('memory')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">{t('dashboard.memoryUsage')}</p>
              <h3 className="text-xl font-bold text-blue-400">
                {showStats.memory
                  ? `${((health?.memory?.total - health?.memory?.free) / 1024 / 1024 / 1024).toFixed(1)}GB / ${(health?.memory?.total / 1024 / 1024 / 1024).toFixed(1)}GB`
                  : `${health?.memory?.percent || 0}%`}
              </h3>
            </div>
            <FaMemory className="text-2xl text-blue-400 opacity-50" />
          </div>
          <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: `${health?.memory?.percent || 0}%` }}></div>
          </div>
          {showStats.memory && <p className="text-xs text-gray-500 mt-1">{t('dashboardInline.usedTotal')}</p>}
        </Card>

        {/* Disk */}
        <Card className="bg-zombie-black border-zombie-green bg-opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">{t('dashboard.diskUsage')}</p>
              <h3 className="text-xl font-bold text-purple-400">{health?.disk?.percent || 0}%</h3>
            </div>
            <FaHdd className="text-2xl text-purple-400 opacity-50" />
          </div>
          <p className="text-xs text-gray-400 mt-1">{health?.disk?.free || '0 GB'} free</p>
        </Card>

        {/* Instances */}
        <Card className="bg-zombie-black border-zombie-green bg-opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">{t('dashboard.activeInstances')}</p>
              <h3 className="text-xl font-bold text-white">{instances.filter(i => i.running).length} / {instances.length}</h3>
            </div>
            <FaServer className="text-2xl text-white opacity-50" />
          </div>
          <div className="flex -space-x-2 mt-2">
            {instances.filter(i => i.running).map(i => (
              <div key={i.id} className="w-6 h-6 rounded-full bg-zombie-green border-2 border-black" title={i.name}></div>
            ))}
          </div>
        </Card>

      </div>

      {/* Instances Grid */}
      <h2 className="text-2xl font-bold text-text mt-8 flex items-center">
        <FaServer className="mr-2" /> {t('dashboard.instances')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {instances.map((instance) => (
          <motion.div
            key={instance.id}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => handleOpenInstance(instance)}
          >
            {/* Crash Alert Border */}
            <Card className={`h-full relative overflow-hidden group border-l-4 
                ${!instance.running && instance.shutdownReason !== 'manual' && instance.shutdownReason !== 'acknowledged' ? 'border-red-600 animate-pulse ring-2 ring-red-500' :
                instance.running ? 'border-l-zombie-success' : 'border-l-zombie-error'}
            `}>
              {/* Background pattern or effect */}
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl pointer-events-none">
                {instance.running ? <FaCheckCircle /> : <FaSkull />}
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-zombie-green transition-colors">{instance.name}</h3>
                  <p className="text-sm text-gray-400">{instance.version || instance.description}</p>
                  <div className="mt-2 text-xs font-mono text-gray-500">
                    ID: {instance.id} | Port: {instance.gamePort}
                  </div>
                </div>
              </div>

              {/* Status Badge moved to bottom to not overlap background icon */}
              <div className="mb-4 flex flex-wrap gap-2">
                {!instance.running && instance.installationStatus ? (
                  <Badge variant="warning">
                    {instance.installationStatus === 'installing' ? t('dashboardInline.installing') : t('dashboardInline.queued')}
                  </Badge>
                ) : (
                  <Badge variant={instance.running ? 'success' : 'error'}>
                    {instance.running ? t('nav.online') : t('nav.offline')}
                  </Badge>
                )}
                {instance.broken && (
                  <Badge variant="warning">
                    {`⚠️ ${t('dashboardInline.broken')}`}
                  </Badge>
                )}
              </div>

              {/* Stats (if running) */}
              <div className="grid grid-cols-2 gap-2 mb-4 relative z-10 bg-black bg-opacity-20 p-2 rounded">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('instances.gamePort')}</p>
                  <p className="font-mono text-sm">{instance.gamePort}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{!instance.running && instance.installationStatus ? t('dashboardInline.queue') : t('dashboardInline.rcon')}</p>
                  <p className="font-mono text-sm">{!instance.running && instance.installationStatus ? (instance.installationQueuePosition || '-') : (instance.rconPort || '-')}</p>
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-xs text-gray-500">{t('instanceDetails.processUsageLabel')}</p>
                  <p className="font-mono text-xs">
                    {instance.running
                      ? `${t('instanceDetails.cpuLabel')} ${Number.isFinite(instance.processCpuPercent) ? instance.processCpuPercent.toFixed(1) + '%' : '-'} | ${t('instanceDetails.memoryLabel')} ${formatBytes(instance.processMemoryBytes)}`
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex space-x-2 relative z-10 mt-auto">
                {(() => {
                  if (!instance.running && instance.installationLocked) {
                    return (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (instance.installationTaskId) {
                            setSelectedInstallTaskId(instance.installationTaskId);
                          }
                        }}
                      >
                        {instance.installationStatus === 'installing' ? t('dashboardInline.viewProgress') : t('dashboardInline.waiting')}
                      </Button>
                    );
                  }

                  if (!instance.running && instance.shutdownReason !== 'manual' && instance.shutdownReason !== 'acknowledged') {
                    return (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1 bg-red-900 hover:bg-red-800 text-white animate-pulse"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await api.patch(`/instances/${instance.id}`, { shutdownReason: 'acknowledged' });
                              await fetchData();
                            } catch (err) { toast.error(t('dashboardInline.failedToAcknowledge')); }
                          }}
                        >
                          <FaExclamationTriangle className="mr-1" /> {t('dashboardInline.acknowledgeCrash')}
                        </Button>
                        {canRetryInstall(instance) && (
                          <Button
                            size="sm"
                            variant="warning"
                            className="flex-1"
                            onClick={(e) => handleInstanceAction(e, instance.id, 'retry-install')}
                          >
                            <FaRedo className="mr-1" /> {t('dashboardInline.retry')}
                          </Button>
                        )}
                      </>
                    );
                  }

                  if (!instance.running) {
                    return (
                      <Button
                        size="sm"
                        variant="primary"
                        className="flex-1"
                        onClick={(e) => handleInstanceAction(e, instance.id, 'start')}
                      >
                        <FaPlay className="mr-1" /> {t('instances.play')}
                      </Button>
                    );
                  }

                  return (
                    <>
                      <Button
                        size="sm"
                        variant="warning"
                        className="flex-1"
                        onClick={(e) => handleInstanceAction(e, instance.id, 'restart')}
                      >
                        <FaRedo className="mr-1" /> {t('instances.reboot')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        onClick={(e) => handleInstanceAction(e, instance.id, 'stop')}
                      >
                        <FaStop className="mr-1" /> {t('instances.stop')}
                      </Button>
                    </>
                  );
                })()}
              </div>

              {/* Status message or reason */}
              {instance.shutdownReason && !instance.running && instance.shutdownReason !== 'manual' && instance.shutdownReason !== 'acknowledged' && (
                <div className="mt-2 text-xs text-red-400 font-bold">
                  {t('instances.lastStop')}: {instance.shutdownReason || t('dashboardInline.crashed')}
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {/* Add New Instance Card */}
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer min-h-[200px] flex" onClick={() => setShowAddModal(true)}>
          <Card className="border-dashed border-2 border-gray-700 flex flex-col items-center justify-center w-full hover:border-zombie-green transition-colors group">
            <FaPlus className="text-4xl text-gray-600 group-hover:text-zombie-green mb-2" />
            <span className="text-gray-500 group-hover:text-white">{t('dashboard.addInstance')}</span>
          </Card>
        </motion.div>
      </div>

      {selectedInstance && (
        <InstanceDetailsModal
          isOpen={!!selectedInstance}
          onClose={() => setSelectedInstance(null)}
          instance={selectedInstance}
          onAction={handleInstanceAction}
        />
      )}

      <AddInstanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onInstanceAdded={fetchData}
        onInstallQueued={(task) => {
          void fetchData();
          if (task?.id) {
            setSelectedInstallTaskId(task.id);
          }
        }}
        onInstallFailed={(task) => {
          void fetchData();
          if (task?.id) {
            setSelectedInstallTaskId(task.id);
          }
        }}
      />

      <InstallTaskModal
        isOpen={!!selectedInstallTaskId}
        onClose={() => setSelectedInstallTaskId(null)}
        taskId={selectedInstallTaskId}
      />
    </div>
  );
};

export default Dashboard;
