import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaServer, FaChevronDown, FaChevronUp, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import { useTranslation } from '../i18n/index.jsx';

const statusClass = {
  pending: 'text-yellow-400',
  running: 'text-blue-400',
  success: 'text-green-400',
  failed: 'text-red-400'
};

const getLogTone = (log) => {
  const text = String(log || '').toLowerCase();
  if (text.includes('[error]') || text.includes(' error:') || text.includes('install_failed') || text.includes('failed')) {
    return 'text-red-400';
  }
  if (text.includes('[warn]') || text.includes('warn:')) {
    return 'text-yellow-300';
  }
  if (text.includes('[queue]')) {
    return 'text-cyan-300';
  }
  if (text.includes('[instances.create]')) {
    return 'text-zombie-green';
  }
  return 'text-text';
};

const InstallTaskModal = ({ isOpen, onClose, taskId }) => {
  const [task, setTask] = React.useState(null);
  const [showLogs, setShowLogs] = React.useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);
  const logsContainerRef = React.useRef(null);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (!isOpen || !taskId) return;

    let timer = null;
    const load = async () => {
      try {
        const res = await api.get(`/instances/tasks/${taskId}`);
        if (res.data?.success) {
          const nextTask = res.data.data;
          setTask(nextTask);
          if ((nextTask.status === 'failed' || nextTask.status === 'success') && timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (error) {
        console.error('Failed to fetch task details', error);
      }
    };

    void load();
    timer = setInterval(() => {
      void load();
    }, 2000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, taskId]);

  React.useEffect(() => {
    if (task?.status === 'failed') {
      setShowLogs(false);
    }
    if (task?.status === 'running' || task?.status === 'pending') {
      setShowLogs(true);
    }
  }, [task?.status]);

  React.useEffect(() => {
    if (!isOpen) {
      setAutoScrollEnabled(true);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!showLogs) return;
    if (!logsContainerRef.current) return;
    if (!autoScrollEnabled) return;
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }, [showLogs, autoScrollEnabled, task?.logs?.length, task?.updatedAt]);

  const handleLogsScroll = React.useCallback(() => {
    const el = logsContainerRef.current;
    if (!el) return;
    const threshold = 24;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    if (atBottom && !autoScrollEnabled) {
      setAutoScrollEnabled(true);
    } else if (!atBottom && autoScrollEnabled) {
      setAutoScrollEnabled(false);
    }
  }, [autoScrollEnabled]);

  if (!isOpen || !task) return null;

  const name = task.metadata?.instanceName || task.name || 'Instancia';
  const queuePosition = task.metadata?.queuePosition;
  const finalError = task.error || (task.status === 'failed' ? t('installTaskModal.failedDefault') : '');
  const canToggleLogs = Array.isArray(task.logs) && task.logs.length > 0;
  const getStatusLabel = (status) => {
    const normalized = String(status || '').toLowerCase();
    const lookup = {
      pending: 'statusPending',
      running: 'statusRunning',
      success: 'statusSuccess',
      failed: 'statusFailed'
    };
    const key = lookup[normalized];
    return key ? t(`installTaskModal.${key}`) : status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-border w-full max-w-2xl p-6 rounded-lg shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
          <h2 className="text-xl font-bold text-text flex items-center">
            <FaServer className="mr-2 text-primary" /> {t('installTaskModal.title')}: {name}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div className="w-full bg-surfaceAlt rounded-full h-4 overflow-hidden border border-border">
            <div
              className="bg-primary h-4 transition-all duration-500 ease-in-out"
              style={{ width: `${Math.max(0, Math.min(100, task.progress || 0))}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs">
            <span className={`${statusClass[task.status] || 'text-muted'}`}>
              {t('installTaskModal.status')}: {getStatusLabel(task.status)}
            </span>
            <span className="text-muted">{task.progress || 0}%</span>
          </div>

          {task.status === 'pending' && typeof queuePosition === 'number' && queuePosition > 1 && (
            <p className="text-xs text-warning">
              {t('installTaskModal.queued')}. {t('installTaskModal.queuedMessage', { count: String(queuePosition - 1) })}
            </p>
          )}

          {finalError && (
            <div className="rounded-lg border border-danger bg-danger/10 p-4 text-sm text-danger space-y-3">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">{t('installTaskModal.finalErrorTitle')}</p>
                  <p className="break-words opacity-90">{finalError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {t('installTaskModal.logsHidden')}
            </p>
            {canToggleLogs && (
              <button
                type="button"
                onClick={() => setShowLogs((prev) => !prev)}
                className="text-xs inline-flex items-center gap-2 px-3 py-2 rounded border border-border bg-background hover:border-primary transition-colors"
              >
                {showLogs ? <FaChevronUp /> : <FaChevronDown />}
                {showLogs ? t('installTaskModal.hideLogs') : t('installTaskModal.showLogs')}
              </button>
            )}
          </div>

          {showLogs && (
            <div
              ref={logsContainerRef}
              onScroll={handleLogsScroll}
              className="bg-background border border-border rounded p-3 h-72 overflow-y-auto font-mono text-xs text-text flex flex-col space-y-1"
            >
              {Array.isArray(task.logs) && task.logs.length > 0 ? (
                task.logs.map((log, i) => (
                  <span key={i} className={getLogTone(log)}>{log}</span>
                ))
              ) : (
                <span className="text-muted">{t('installTaskModal.noLogs')}</span>
              )}
            </div>
          )}

          {task.status === 'failed' && canToggleLogs && !showLogs && (
            <button
              type="button"
              onClick={() => setShowLogs(true)}
              className="text-xs text-primary hover:underline inline-flex items-center gap-2"
            >
              {t('installTaskModal.openFullLogs')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InstallTaskModal;
