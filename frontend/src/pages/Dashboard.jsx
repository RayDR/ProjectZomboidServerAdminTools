import { useEffect, useState } from 'react';
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
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [instances, setInstances] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [systemLoad, setSystemLoad] = useState(0);
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      const [instancesRes, healthRes] = await Promise.all([
        api.get('/instances'),
        api.get('/health') // Assuming this returns system stats
      ]);

      setInstances(instancesRes.data.data);
      setHealth(healthRes.data);

      // Calculate generic system load if available, or mockup
      if (healthRes.data?.load) setSystemLoad(healthRes.data.load);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleInstanceAction = async (e, id, action) => {
    e.stopPropagation(); // Prevent opening modal
    try {
      let endpoint = '';
      switch (action) {
        case 'start': endpoint = `/instances/${id}/start`; break;
        case 'stop': endpoint = `/instances/${id}/stop`; break;
        case 'restart': endpoint = `/instances/${id}/restart`; break;
        case 'kill': endpoint = `/instances/${id}/kill`; break;
      }

      toast.loading(`Executing ${action}...`, { id: 'action-toast' });
      const res = await api.post(endpoint);

      if (res.data.success) {
        toast.success(res.data.message, { id: 'action-toast' });
        fetchData();
      } else {
        toast.error('Action failed', { id: 'action-toast' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed', { id: 'action-toast' });
    }
  };

  const handleOpenInstance = (instance) => {
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
          ☣️
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-terminal-text font-zombie">
            <GlitchText>{t('dashboard.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green opacity-80">System Management Console</p>
        </div>
        <Button variant="secondary" onClick={fetchData}>Refresh</Button>
      </div>

      {/* System Health Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zombie-black border-zombie-green bg-opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">System Status</p>
              <h3 className="text-xl font-bold text-zombie-green">OPERATIONAL</h3>
            </div>
            <FaMicrochip className="text-2xl text-zombie-green opacity-50" />
          </div>
        </Card>
        <Card className="bg-zombie-black border-zombie-green bg-opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Active Instances</p>
              <h3 className="text-xl font-bold text-white">{instances.filter(i => i.running).length} / {instances.length}</h3>
            </div>
            <FaServer className="text-2xl text-blue-400 opacity-50" />
          </div>
        </Card>
        <Card className="bg-zombie-black border-zombie-green bg-opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Total Players</p>
              <h3 className="text-xl font-bold text-yellow-400">--</h3>
            </div>
            <FaUsers className="text-2xl text-yellow-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Instances Grid */}
      <h2 className="text-2xl font-bold text-terminal-text mt-8 flex items-center">
        <FaServer className="mr-2" /> Server Instances
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {instances.map((instance) => (
          <motion.div
            key={instance.id}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => handleOpenInstance(instance)}
          >
            <Card className={`h-full border-l-4 ${instance.running ? 'border-l-zombie-success' : 'border-l-zombie-error'} relative overflow-hidden group`}>
              {/* Background pattern or effect */}
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">
                {instance.running ? <FaCheckCircle /> : <FaSkull />}
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-zombie-green transition-colors">{instance.name}</h3>
                  <p className="text-sm text-gray-400">{instance.description}</p>
                  <div className="mt-2 text-xs font-mono text-gray-500">
                    ID: {instance.id} | Port: {instance.gamePort}
                  </div>
                </div>
                <Badge variant={instance.running ? 'success' : 'error'}>
                  {instance.running ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>

              {/* Stats (if running) */}
              <div className="grid grid-cols-2 gap-2 mb-4 relative z-10 bg-black bg-opacity-20 p-2 rounded">
                <div className="text-center">
                  <p className="text-xs text-gray-500">RCON</p>
                  <p className="font-mono text-sm">{instance.rconPort}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">PID</p>
                  <p className="font-mono text-sm">{instance.pid || '-'}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex space-x-2 relative z-10 mt-auto">
                {!instance.running ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={(e) => handleInstanceAction(e, instance.id, 'start')}
                  >
                    <FaPlay className="mr-1" /> Play
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="warning"
                      className="flex-1"
                      onClick={(e) => handleInstanceAction(e, instance.id, 'restart')}
                    >
                      <FaRedo className="mr-1" /> Reboot
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="flex-1"
                      onClick={(e) => handleInstanceAction(e, instance.id, 'stop')}
                    >
                      <FaStop className="mr-1" /> Stop
                    </Button>
                  </>
                )}
              </div>

              {/* Status message or reason */}
              {instance.shutdownReason && !instance.running && (
                <div className="mt-2 text-xs text-red-400">
                  Last Stop: {instance.shutdownReason}
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {/* Add New Instance Card */}
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer min-h-[200px] flex" onClick={() => setShowAddModal(true)}>
          <Card className="border-dashed border-2 border-gray-700 flex flex-col items-center justify-center w-full hover:border-zombie-green transition-colors group">
            <FaPlus className="text-4xl text-gray-600 group-hover:text-zombie-green mb-2" />
            <span className="text-gray-500 group-hover:text-white">Add Instance</span>
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
      />
    </div>
  );
};

export default Dashboard;
