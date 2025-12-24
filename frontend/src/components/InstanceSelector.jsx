import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaServer, FaCheckCircle, FaExchangeAlt, FaSpinner } from 'react-icons/fa';
import { Card, Button, Badge } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import ButtonConfirm from './ButtonConfirm';

const InstanceSelector = ({ onInstanceChange }) => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const fetchInstances = async () => {
    try {
      const response = await api.get('/instances');
      if (response.data.success) {
        setInstances(response.data.data);
      }
    } catch (error) {
      toast.error('Error al cargar instancias: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchInstance = async (instanceId) => {
    setSwitching(true);
    try {
      const response = await api.post('/instances/switch', { instanceId });
      if (response.data.success) {
        toast.success(response.data.message);
        // Wait for services to stabilize before fetching status
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchInstances();
        // Fetch again after another delay to ensure status is updated
        setTimeout(fetchInstances, 3000);
        if (onInstanceChange) {
          onInstanceChange();
        }
      }
    } catch (error) {
      toast.error('Error al cambiar instancia: ' + (error.response?.data?.error || error.message));
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-zombie-green">
        <div className="flex items-center justify-center p-4">
          <FaSpinner className="animate-spin text-zombie-green text-2xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-zombie-green">
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-zombie-green/30 pb-3">
          <FaServer className="text-zombie-green text-xl" />
          <h3 className="text-xl font-bold text-terminal-text font-zombie">
            INSTANCIAS DE SERVIDOR
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {instances.map((instance) => (
              <motion.div
                key={instance.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`relative p-4 rounded border-2 transition-all ${
                  instance.isActive
                    ? 'border-zombie-green bg-zombie-green/10'
                    : 'border-gray-600 bg-gray-800/50'
                }`}
              >
                {/* Active badge */}
                {instance.isActive && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="success">
                      <FaCheckCircle className="mr-1" />
                      ACTIVA
                    </Badge>
                  </div>
                )}

                {/* Running indicator */}
                {instance.running && !instance.isActive && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="warning">
                      EJECUTANDO
                    </Badge>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Instance name and version */}
                  <div>
                    <h4 className="text-lg font-bold text-terminal-text font-zombie">
                      {instance.name}
                    </h4>
                    <p className="text-sm text-gray-400">{instance.description}</p>
                  </div>

                  {/* Instance details */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Versión:</span>
                      <span className="text-zombie-green">{instance.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Puerto:</span>
                      <span className="text-zombie-green">{instance.gamePort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RCON:</span>
                      <span className="text-zombie-green">{instance.rconPort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estado:</span>
                      <span className={instance.running ? 'text-green-400' : 'text-red-400'}>
                        {instance.running ? '● En línea' : '○ Detenido'}
                      </span>
                    </div>
                  </div>

                  {/* Switch button */}
                  {!instance.isActive && (
                    <ButtonConfirm
                      onConfirm={() => handleSwitchInstance(instance.id)}
                      disabled={switching}
                      className="w-full"
                      confirmText={`¿Cambiar a ${instance.name}? Esto detendrá la instancia actual.`}
                    >
                      <FaExchangeAlt className="mr-2" />
                      {switching ? 'Cambiando...' : 'Activar Instancia'}
                    </ButtonConfirm>
                  )}

                  {instance.isActive && (
                    <div className="text-center py-2 text-zombie-green font-bold text-sm">
                      ✓ INSTANCIA ACTIVA
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Info note */}
        <div className="mt-4 p-3 bg-zombie-green/10 border border-zombie-green/30 rounded text-sm text-gray-300">
          <strong className="text-zombie-green">Nota:</strong> Solo una instancia puede estar activa a la vez. 
          Al cambiar de instancia, la actual se detendrá automáticamente.
        </div>
      </div>
    </Card>
  );
};

export default InstanceSelector;
