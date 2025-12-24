import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPuzzlePiece, FaDownload, FaTrash, FaSync, FaCheckCircle, FaExclamationTriangle, FaSearch, FaUpload, FaClock, FaRedo } from 'react-icons/fa';
import { Card, Button, Badge, Input, Modal } from '../components/ui';
import { GlitchText, LoadingScreen } from '../components/effects/ZombieEffects';
import ServerLogsModal from '../components/effects/ServerLogsModal';
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
  const [modFiles, setModFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [recentlyInstalled, setRecentlyInstalled] = useState([]);
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showUpdateLogs, setShowUpdateLogs] = useState(false);
  const [activeInstance, setActiveInstance] = useState(null);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchMods();
    fetchActiveInstance();
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

  const fetchActiveInstance = async () => {
    try {
      const response = await api.get('/instances/active');
      if (response.data.success) {
        setActiveInstance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching active instance:', error);
    }
  };

  const installMod = async () => {
    if (!newModId) {
      toast.error('Mod ID is required');
      return;
    }

    try {
      setInstalling(true);
      const formData = new FormData();
      
      if (newModWorkshopId) formData.append('workshopId', newModWorkshopId);
      formData.append('modId', newModId);
      
      // Add files if any
      modFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/mods/install', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        const installedMod = {
          id: newModId,
          workshopId: newModWorkshopId || null,
          installedAt: new Date().toISOString(),
        };
        
        // Add to recently installed (session storage)
        const updated = [installedMod, ...recentlyInstalled];
        setRecentlyInstalled(updated);
        sessionStorage.setItem('recentlyInstalledMods', JSON.stringify(updated));
        
        toast.success(response.data.message);
        setShowInstallModal(false);
        setNewModWorkshopId('');
        setNewModId('');
        setModFiles([]);
        setShowRestartPrompt(true);
        fetchMods();
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setInstalling(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setModFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setModFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index) => {
    setModFiles(prev => prev.filter((_, i) => i !== index));
  };

  const restartServer = async () => {
    try {
      await api.post('/server/restart');
      toast.success('Server restart initiated');
      setShowRestartPrompt(false);
    } catch (error) {
      toast.error('Restart failed: ' + error.message);
    }
  };

  // Load recently installed mods from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('recentlyInstalledMods');
    if (stored) {
      setRecentlyInstalled(JSON.parse(stored));
    }
  }, []);

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
    setShowUpdateConfirm(false);
    setShowUpdateLogs(true);
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
          {activeInstance && (
            <Badge variant="info" className="mt-2">
              📦 {activeInstance.name}
            </Badge>
          )}
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
            onClick={() => setShowUpdateConfirm(true)}
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

      {/* Recently Installed Mods */}
      {recentlyInstalled.length > 0 && (
        <Card className="bg-zombie-warning bg-opacity-5 border-zombie-warning">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-zombie-warning flex items-center">
              <FaClock className="mr-2" />
              🆕 Mods Recién Instalados (Esta Sesión)
            </h2>
            <Badge variant="warning">{recentlyInstalled.length}</Badge>
          </div>
          <div className="space-y-2">
            {recentlyInstalled.map((mod, index) => (
              <div 
                key={index}
                className="flex items-center justify-between bg-zombie-gray-dark p-3 rounded-lg border border-zombie-warning border-opacity-30"
              >
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="text-zombie-green text-xl" />
                  <div>
                    <p className="font-bold text-terminal-text">{mod.id}</p>
                    {mod.workshopId && (
                      <p className="text-xs text-gray-400">Workshop ID: {mod.workshopId}</p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(mod.installedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-zombie-gray-dark rounded border border-zombie-green">
            <p className="text-xs text-gray-400">
              💡 <strong>Tip:</strong> Estos mods fueron instalados recientemente. Se recomienda reiniciar el servidor para que los cambios surtan efecto.
            </p>
          </div>
        </Card>
      )}

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
                    <tr
                      key={mod.id}
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
                    </tr>
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
          onClose={() => {
            setShowInstallModal(false);
            setModFiles([]);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-zombie-green mb-2">
                Workshop ID <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., 2169435993"
                value={newModWorkshopId}
                onChange={(e) => setNewModWorkshopId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                🔗 Find this in the Steam Workshop URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-zombie-green mb-2">
                Mod ID <span className="text-gray-500 font-normal">(requerido)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., BetterSorting"
                value={newModId}
                onChange={(e) => setNewModId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                📝 Usually found in mod description or mods.info file
              </p>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-bold text-zombie-green mb-2">
                Mod Files <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              
              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-zombie-green bg-zombie-green bg-opacity-10' 
                    : 'border-gray-600 hover:border-zombie-green hover:bg-zombie-gray-dark'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <FaUpload className="text-4xl text-zombie-green mx-auto mb-3" />
                <p className="text-terminal-text font-bold mb-1">
                  {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic'}
                </p>
                <p className="text-xs text-gray-400">
                  Archivos .lua, .txt, textures, etc.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Files List */}
              {modFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-bold text-zombie-green">
                    {modFiles.length} archivo(s) seleccionado(s):
                  </p>
                  {modFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between bg-zombie-gray-dark p-2 rounded"
                    >
                      <span className="text-sm text-terminal-text truncate flex-1">
                        📄 {file.name}
                      </span>
                      <Button
                        variant="error"
                        className="text-xs ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                💡 Los archivos se subirán a la ruta común de mods del servidor
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <Button variant="secondary" onClick={() => {
                setShowInstallModal(false);
                setModFiles([]);
              }}>
                {t('cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={installMod}
                disabled={installing || !newModId}
              >
                {installing ? '⏳ Instalando...' : `📥 ${t('mods.install')}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Restart Prompt Modal */}
      {showRestartPrompt && (
        <Modal
          title="🔄 Mod Instalado"
          onClose={() => setShowRestartPrompt(false)}
        >
          <div className="space-y-4">
            <div className="bg-zombie-warning bg-opacity-10 border border-zombie-warning rounded-lg p-4">
              <p className="text-terminal-text mb-3">
                ✅ El mod se instaló correctamente. Para que los cambios surtan efecto, se recomienda reiniciar el servidor.
              </p>
              <p className="text-sm text-gray-400">
                ¿Deseas reiniciar el servidor ahora o esperar para más tarde?
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setShowRestartPrompt(false)}>
                <FaClock className="mr-2" />
                Esperar
              </Button>
              <Button variant="primary" onClick={restartServer}>
                <FaRedo className="mr-2" />
                Reiniciar Ahora
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Update All Confirmation Modal */}
      {showUpdateConfirm && (
        <Modal
          title="⚠️ Confirmar Actualización"
          onClose={() => setShowUpdateConfirm(false)}
        >
          <div className="space-y-4">
            <div className="bg-zombie-blood bg-opacity-10 border border-zombie-blood rounded-lg p-4">
              <p className="text-terminal-text mb-3">
                ⚠️ Esta acción actualizará TODOS los mods del servidor desde Steam Workshop.
              </p>
              <p className="text-sm text-gray-400 mb-2">
                El proceso puede tardar varios minutos dependiendo del número de mods y su tamaño.
              </p>
              <p className="text-sm text-zombie-warning font-bold">
                🔄 El servidor se reiniciará automáticamente al finalizar.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setShowUpdateConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="warning" onClick={updateAllMods}>
                <FaSync className="mr-2" />
                Proceder con Actualización
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Update All Logs Modal */}
      <ServerLogsModal
        isOpen={showUpdateLogs}
        onClose={() => {
          setShowUpdateLogs(false);
          fetchMods();
        }}
        operation="Actualización de Mods"
        endpoint="/mods/update-all-stream"
      />
    </div>
  );
};

export default Mods;
