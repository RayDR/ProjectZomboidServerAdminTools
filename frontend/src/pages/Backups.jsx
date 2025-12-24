import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaTrash, FaDownload, FaUndo, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import { Card, Button, Badge, Modal } from '../components/ui';
import { GlitchText, LoadingScreen } from '../components/effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/server/backups');
      if (response.data.success) {
        setBackups(response.data.data);
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      const response = await api.post('/server/backup');
      if (response.data.success) {
        toast.success(t('backups.backupCreated'));
        fetchBackups();
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (filename) => {
    if (!window.confirm(`${t('delete')} ${filename}?`)) return;
    
    try {
      const response = await api.delete(`/server/backups/${filename}`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchBackups();
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  const downloadBackup = (filename) => {
    // Open download link (would need to add download endpoint to backend)
    window.open(`/api/server/backups/download/${filename}`, '_blank');
  };

  const openRestoreModal = (backup) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const restoreBackup = async () => {
    // TODO: Implement restore functionality in backend
    toast.error('Restore functionality coming soon');
    setShowRestoreModal(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('backups.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('backups.subtitle')}
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={createBackup}
          disabled={creating}
        >
          {creating ? '⏳ ' + t('loading') : `💾 ${t('backups.createBackup')}`}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-zombie-green to-zombie-green-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white opacity-80 uppercase tracking-wide">{t('backups.available')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">{backups.length}</h3>
            </div>
            <div className="text-4xl sm:text-5xl text-white opacity-20">
              <FaHistory />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-terminal-text opacity-70 uppercase tracking-wide">{t('backups.size')}</p>
              <h3 className="text-xl sm:text-2xl font-bold text-terminal-text mt-1">
                {backups.reduce((acc, b) => acc + b.size, 0) > 0 
                  ? (backups.reduce((acc, b) => acc + b.size, 0) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
                  : '0 MB'}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-zombie-green opacity-30">
              <FaSave />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-terminal-text opacity-70 uppercase tracking-wide">{t('dashboard.started')}</p>
              <h3 className="text-sm font-bold text-terminal-text mt-1">
                {backups.length > 0 
                  ? new Date(backups[0].created).toLocaleDateString()
                  : 'N/A'}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-zombie-green opacity-30">
              <FaHistory />
            </div>
          </div>
        </Card>
      </div>

      {/* Backups List */}
      <Card>
        <h2 className="text-2xl font-bold text-terminal-text mb-4 flex items-center">
          <FaHistory className="mr-2" /> {t('backups.available')}
        </h2>
        
        {backups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-20">📦</div>
            <p className="text-gray-400 text-lg">{t('none')}</p>
            <p className="text-gray-500 text-sm mt-2">
              {t('backups.createBackup')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zombie-green">
                  <th className="text-left p-3 text-zombie-green font-mono">📦 {t('backups.date')}</th>
                  <th className="text-left p-3 text-zombie-green font-mono hidden sm:table-cell">{t('backups.size')}</th>
                  <th className="text-right p-3 text-zombie-green font-mono">{t('dashboard.quickActions')}</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, index) => (
                  <motion.tr
                    key={backup.filename}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-700 hover:bg-zombie-gray-dark transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-mono text-terminal-text text-sm">
                        {new Date(backup.created).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 sm:hidden mt-1">
                        {backup.sizeFormatted}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-gray-400 text-sm hidden sm:table-cell">
                      {backup.sizeFormatted}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => openRestoreModal(backup)}
                          className="text-xs sm:text-sm"
                        >
                          <FaUndo className="sm:mr-1" />
                          <span className="hidden sm:inline">{t('backups.restore')}</span>
                        </Button>
                        <Button
                          variant="error"
                          onClick={() => deleteBackup(backup.filename)}
                          className="text-xs sm:text-sm"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Restore Modal */}
      {showRestoreModal && (
        <Modal
          title={`⚠️ ${t('backups.confirmRestore')}`}
          onClose={() => setShowRestoreModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-zombie-blood bg-opacity-10 border border-zombie-blood rounded p-4">
              <div className="flex items-start space-x-3">
                <FaExclamationTriangle className="text-zombie-blood text-2xl mt-1" />
                <div>
                  <p className="text-zombie-blood font-bold mb-2">
                    {t('backups.confirmRestore')}
                  </p>
                  <p className="text-gray-300 text-sm">
                    This will stop the server and restore the backup:<br/>
                    <span className="font-mono text-terminal-text">
                      {selectedBackup?.filename}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
                {t('cancel')}
              </Button>
              <Button variant="error" onClick={restoreBackup}>
                {t('backups.restore')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Backups;
