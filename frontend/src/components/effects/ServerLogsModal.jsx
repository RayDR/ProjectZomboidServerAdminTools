import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { CRTScreen } from './ZombieEffects';

const ServerLogsModal = ({ isOpen, onClose, operation, endpoint }) => {
  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const logsEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (isOpen && endpoint) {
      setLogs([]);
      setIsComplete(false);
      setIsSuccess(false);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Create EventSource for SSE
      const url = `/api${endpoint}`;
      const es = new EventSource(`${url}?token=${token}`, {
        withCredentials: true
      });

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.complete) {
            setIsComplete(true);
            setIsSuccess(data.success);
            setLogs(prev => [...prev, {
              text: data.message,
              timestamp: data.timestamp,
              type: data.success ? 'success' : 'error'
            }]);
            es.close();
          } else if (data.error) {
            setLogs(prev => [...prev, {
              text: data.error,
              timestamp: data.timestamp,
              type: 'error'
            }]);
          } else if (data.log) {
            setLogs(prev => [...prev, {
              text: data.log,
              timestamp: data.timestamp,
              type: 'log'
            }]);
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      es.onerror = (error) => {
        console.error('SSE Error:', error);
        setLogs(prev => [...prev, {
          text: 'Connection error. Please check server logs.',
          timestamp: new Date().toISOString(),
          type: 'error'
        }]);
        setIsComplete(true);
        setIsSuccess(false);
        es.close();
      };

      eventSourceRef.current = es;

      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    }
  }, [isOpen, endpoint]);

  useEffect(() => {
    // Auto-scroll to bottom
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <CRTScreen className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-zombie-green">
              <div className="flex items-center space-x-3">
                {!isComplete && (
                  <FaSpinner className="text-zombie-green animate-spin text-xl" />
                )}
                {isComplete && isSuccess && (
                  <FaCheckCircle className="text-green-500 text-xl" />
                )}
                {isComplete && !isSuccess && (
                  <FaExclamationTriangle className="text-zombie-blood text-xl" />
                )}
                <h2 className="text-xl font-bold text-terminal-text uppercase tracking-wide">
                  {operation} - {isComplete ? (isSuccess ? 'Completado' : 'Fallido') : 'En Progreso'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-terminal-text hover:text-zombie-blood transition-colors"
                disabled={!isComplete}
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* Logs Container */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 bg-black bg-opacity-50">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`whitespace-pre-wrap ${
                    log.type === 'error'
                      ? 'text-zombie-blood'
                      : log.type === 'success'
                      ? 'text-green-500'
                      : 'text-zombie-green'
                  }`}
                >
                  <span className="opacity-50 text-xs">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  {log.text}
                </div>
              ))}
              <div ref={logsEndRef} />
              
              {!isComplete && logs.length === 0 && (
                <div className="text-terminal-text opacity-50 text-center py-8">
                  Esperando respuesta del servidor...
                </div>
              )}
            </div>

            {/* Footer */}
            {isComplete && (
              <div className="p-4 border-t-2 border-zombie-green flex justify-end">
                <button
                  onClick={handleClose}
                  className="btn btn-primary px-6"
                >
                  Cerrar
                </button>
              </div>
            )}
          </CRTScreen>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServerLogsModal;
