import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPuzzlePiece, FaDownload, FaTrash, FaSync, FaCheckCircle, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import { Card, Button, Badge, Input, Modal } from '../components/ui';
import { GlitchText, LoadingScreen } from '../components/effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const Mods = () => {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [newModWorkshopId, setNewModWorkshopId] = useState('');
  const [newModId, setNewModId] = useState('');
  const [installing, setInstalling] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchMods();
  }, []);

  const fetchMods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mods');
      if (response.data.success) {
        setMods(response.data.data);
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const installMod = async () => {
    if (!newModWorkshopId || !newModId) {
      toast.error('Workshop ID and Mod ID are required');
      return;
    }

    try {
      setInstalling(true);
      const response = await api.post('/mods/install', {
        workshopId: newModWorkshopId,
        modId: newModId
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowInstallModal(false);
        setNewModWorkshopId('');
        setNewModId('');
        fetchMods();
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setInstalling(false);
    }
  };

  const uninstallMod = async (modId) => {
    if (!window.confirm(`${t('mods.uninstall')} ${modId}?`)) return;

    try {
      const response = await api.delete(`/mods/${modId}`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchMods();
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  const updateAllMods = async () => {
    try {
      setUpdating(true);
      const response = await api.post('/mods/update-all');
      if (response.data.success) {
        toast.success(response.data.message);
        fetchMods();
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const validateMods = async () => {
    try {
      setValidating(true);
      const response = await api.get('/mods/validate');
      if (response.data.success) {
        setValidation(response.data.data);
        toast.success(`Validated: ${response.data.data.valid} valid, ${response.data.data.invalid.length} invalid`);
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setValidating(false);
    }
  };

  const filteredMods = mods.filter(mod => 
    mod.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('mods.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('mods.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2 flex-wrap gap-2">
          <Button 
            variant="secondary" 
            onClick={validateMods}
            disabled={validating}
          >
            {validating ? '⏳' : '✓'} {t('mods.validate')}
          </Button>
          <Button 
            variant="warning" 
            onClick={updateAllMods}
            disabled={updating}
          >
            {updating ? '⏳' : '🔄'} {t('mods.updateAll')}
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowInstallModal(true)}
          >
            📥 {t('mods.install')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-zombie-green to-zombie-green-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white opacity-80 uppercase tracking-wide">{t('mods.installed')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">{mods.length}</h3>
            </div>
            <div className="text-4xl sm:text-5xl text-white opacity-20">
              <FaPuzzlePiece />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-terminal-text opacity-70 uppercase tracking-wide">{t('mods.workshop')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-terminal-text mt-1">
                {mods.filter(m => m.workshopId).length}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-zombie-green opacity-30">
              <FaDownload />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-terminal-text opacity-70 uppercase tracking-wide">{t('mods.status')}</p>
              <h3 className="text-lg font-bold text-terminal-text mt-1">
                {validation ? (
                  <span className={validation.invalid.length > 0 ? 'text-zombie-blood' : 'text-zombie-green'}>
                    {validation.valid} / {validation.valid + validation.invalid.length}
                  </span>
                ) : (
                  'N/A'
                )}
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl text-zombie-green opacity-30">
              <FaCheckCircle />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center space-x-3">
          <FaSearch className="text-zombie-green text-xl" />
          <Input
            type="text"
            placeholder={t('search') + ' mods...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Mods List */}
      <Card>
        <h2 className="text-2xl font-bold text-terminal-text mb-4 flex items-center">
          <FaPuzzlePiece className="mr-2" /> {t('mods.installed')} ({filteredMods.length})
        </h2>
        
        {filteredMods.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-20">🧩</div>
            <p className="text-gray-400 text-lg">
              {searchTerm ? t('none') : t('mods.installed')}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {t('mods.install')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zombie-green">
                  <th className="text-left p-3 text-zombie-green font-mono">🧩 {t('mods.modId')}</th>
                  <th className="text-left p-3 text-zombie-green font-mono hidden md:table-cell">{t('mods.workshop')}</th>
                  <th className="text-left p-3 text-zombie-green font-mono hidden sm:table-cell">{t('mods.status')}</th>
                  <th className="text-right p-3 text-zombie-green font-mono">{t('mods.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMods.map((mod, index) => {
                  const isValid = !validation || !validation.invalid.includes(mod.id);
                  
                  return (
                    <motion.tr
                      key={mod.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-700 hover:bg-zombie-gray-dark transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-mono text-terminal-text font-bold text-sm">
                          {mod.id}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden mt-1">
                          {mod.workshopId ? `Workshop: ${mod.workshopId}` : 'Local mod'}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-gray-400 text-sm hidden md:table-cell">
                        {mod.workshopId || 'N/A'}
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        {validation ? (
                          <Badge variant={isValid ? 'success' : 'error'}>
                            {isValid ? '✓ Valid' : '✗ Invalid'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unknown</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="error"
                            onClick={() => uninstallMod(mod.id)}
                            className="text-xs sm:text-sm"
                          >
                            <FaTrash className="sm:mr-1" />
                            <span className="hidden sm:inline">{t('mods.uninstall')}</span>
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Install Modal */}
      {showInstallModal && (
        <Modal
          title={`📥 ${t('mods.install')}`}
          onClose={() => setShowInstallModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-zombie-green mb-2">
                Workshop ID
              </label>
              <Input
                type="text"
                placeholder="Enter Workshop ID (e.g., 2169435993)"
                value={newModWorkshopId}
                onChange={(e) => setNewModWorkshopId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in the Steam Workshop URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-zombie-green mb-2">
                Mod ID
              </label>
              <Input
                type="text"
                placeholder="Enter Mod ID (e.g., BetterSorting)"
                value={newModId}
                onChange={(e) => setNewModId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Usually found in the mod description or mods.info file
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setShowInstallModal(false)}>
                {t('cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={installMod}
                disabled={installing || !newModWorkshopId || !newModId}
              >
                {installing ? '⏳ ' + t('loading') : `📥 ${t('mods.install')}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Mods;
