import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaSave, FaUndo, FaExclamationTriangle, FaSearch, FaDownload } from 'react-icons/fa';
import { Card, Button, Input, Badge, Modal } from '../components/ui';
import { GlitchText, LoadingScreen } from '../components/effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const Config = () => {
  const [config, setConfig] = useState({});
  const [originalConfig, setOriginalConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeInstance, setActiveInstance] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchConfig();
    fetchActiveInstance();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasUnsavedChanges(changed);
  }, [config, originalConfig]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/ini');
      if (response.data.success) {
        const configData = parseIniToObject(response.data.data.content);
        setConfig(configData);
        setOriginalConfig(JSON.parse(JSON.stringify(configData)));
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

  const parseIniToObject = (iniContent) => {
    if (!iniContent || typeof iniContent !== 'string') {
      return {};
    }
    
    const lines = iniContent.split('\n');
    const result = {};
    let currentCategory = 'General';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
      
      // Category header
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentCategory = trimmed.slice(1, -1);
        if (!result[currentCategory]) {
          result[currentCategory] = {};
        }
        continue;
      }
      
      // Key=Value pair
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        
        if (!result[currentCategory]) {
          result[currentCategory] = {};
        }
        
        result[currentCategory][key] = value;
      }
    }

    return result;
  };

  const objectToIni = (obj) => {
    if (!obj || typeof obj !== 'object') {
      return '';
    }
    
    let ini = '';
    
    for (const [category, settings] of Object.entries(obj || {})) {
      if (!settings || typeof settings !== 'object') continue;
      
      ini += `[${category}]\n`;
      for (const [key, value] of Object.entries(settings || {})) {
        ini += `${key}=${value ?? ''}\n`;
      }
      ini += '\n';
    }
    
    return ini;
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const iniContent = objectToIni(config);
      
      const response = await api.post('/config/ini', {
        content: iniContent
      });
      
      if (response.data.success) {
        toast.success(t('config.saveChanges') + ' ✓');
        setOriginalConfig(JSON.parse(JSON.stringify(config)));
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setConfig(JSON.parse(JSON.stringify(originalConfig)));
    setShowUnsavedModal(false);
    toast.success(t('config.discardChanges') + ' ✓');
  };

  const downloadConfig = () => {
    try {
      const iniContent = objectToIni(config);
      const blob = new Blob([iniContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'servertest.ini';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('INI downloaded ✓');
    } catch (error) {
      toast.error('Download failed: ' + error.message);
    }
  };

  const updateSetting = (category, key, value) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const filteredConfig = () => {
    if (!searchTerm) return config;
    
    const filtered = {};
    for (const [category, settings] of Object.entries(config)) {
      const filteredSettings = {};
      for (const [key, value] of Object.entries(settings)) {
        if (
          key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          filteredSettings[key] = value;
        }
      }
      if (Object.keys(filteredSettings).length > 0) {
        filtered[category] = filteredSettings;
      }
    }
    return filtered;
  };

  const getSettingDescription = (key) => {
    const descriptions = {
      'PublicName': 'The name of your server as it appears in the server browser',
      'PublicDescription': 'Description shown in the server browser',
      'MaxPlayers': 'Maximum number of players allowed on the server',
      'PVP': 'Enable Player vs Player combat',
      'PauseEmpty': 'Pause the server when no players are online',
      'Open': 'Server is open to public',
      'Password': 'Password required to join the server',
      'ServerPassword': 'Admin password for the server',
      'RCONPassword': 'RCON password for remote administration',
      'RCONPort': 'Port for RCON connections',
      'SaveWorldEveryMinutes': 'How often to auto-save the world (in minutes)',
      'Mods': 'List of mod IDs separated by semicolons',
      'WorkshopItems': 'List of Workshop item IDs separated by semicolons',
    };
    return descriptions[key] || '';
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const displayConfig = filteredConfig();
  
  // Debug: ver estructura del config
  console.log('Config structure:', Object.keys(config));
  console.log('Full config:', config);
  
  // Obtener información útil del servidor - buscar en todas las categorías posibles
  let serverSettings = config[''] || config['General'] || config['Server'] || {};
  
  const serverName = serverSettings.PublicName || serverSettings.ServerName || 'N/A';
  const isPublic = serverSettings.Open === 'true' || serverSettings.Open === '1';
  const isPVP = serverSettings.PVP === 'true' || serverSettings.PVP === '1';
  const serverType = isPVP ? 'PVP' : 'PVE';
  
  // Contar mods instalados
  const modsString = serverSettings.Mods || '';
  const workshopString = serverSettings.WorkshopItems || '';
  const modsCount = modsString ? modsString.split(';').filter(m => m.trim()).length : 0;
  const workshopCount = workshopString ? workshopString.split(';').filter(m => m.trim()).length : 0;
  const totalMods = modsCount + workshopCount;
  
  // Puertos
  const defaultPort = serverSettings.DefaultPort || 'N/A';
  const rconPort = serverSettings.RCONPort || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('config.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('config.subtitle')}
          </p>
          {activeInstance && (
            <Badge variant="info" className="mt-2">
              📋 {activeInstance.name}
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            onClick={downloadConfig}
          >
            <FaDownload className="mr-2" />
            Download INI
          </Button>
          {hasUnsavedChanges && (
            <Button 
              variant="secondary" 
              onClick={() => setShowUnsavedModal(true)}
            >
              <FaUndo className="mr-2" />
              {t('config.discardChanges')}
            </Button>
          )}
          <Button 
            variant="primary" 
            onClick={saveConfig}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? '⏳' : '💾'} {t('config.saveChanges')}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Card className="bg-zombie-warning bg-opacity-10 border-zombie-warning">
          <div className="flex items-center space-x-3">
            <FaExclamationTriangle className="text-zombie-warning text-2xl" />
            <div>
              <h3 className="font-bold text-zombie-warning">{t('config.unsavedChanges')}</h3>
              <p className="text-sm text-gray-300">
                Remember to save your changes before leaving this page
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Server Info Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-zombie-green to-zombie-green-dark">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-white truncate px-2" title={serverName}>
              {serverName}
            </div>
            <div className="text-xs text-white opacity-80 uppercase tracking-wide mt-1">
              Server Name
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-terminal-text">
              {isPublic ? '🌍' : '🔒'} {serverType}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
              {isPublic ? 'Public' : 'Private'}
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-terminal-text">
              {totalMods} 📦
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
              Mods Installed
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-sm sm:text-base font-bold text-terminal-text">
              Game: {defaultPort}
            </div>
            <div className="text-sm sm:text-base font-bold text-terminal-text mt-1">
              RCON: {rconPort}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Ports</div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center space-x-3">
          <FaSearch className="text-zombie-green text-xl" />
          <Input
            type="text"
            placeholder={t('search') + ' settings...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Config Categories */}
      <div className="space-y-4">
        {Object.entries(displayConfig).map(([category, settings], catIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-zombie-green mb-4 flex items-center">
                <FaCog className="mr-2" />
                {category}
                <Badge variant="secondary" className="ml-3 text-xs">
                  {Object.keys(settings).length} settings
                </Badge>
              </h2>
              
              <div className="space-y-3">
                {Object.entries(settings).map(([key, value]) => {
                  const description = getSettingDescription(key);
                  
                  return (
                    <div key={key} className="border-b border-gray-700 pb-3 last:border-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="block font-mono text-sm font-bold text-terminal-text mb-1">
                            {key}
                          </label>
                          {description && (
                            <p className="text-xs text-gray-500">{description}</p>
                          )}
                        </div>
                        <div className="sm:w-1/2">
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateSetting(category, key, e.target.value)}
                            className="w-full font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <Modal
          title={`⚠️ ${t('config.unsavedChanges')}`}
          onClose={() => setShowUnsavedModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to discard all unsaved changes?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowUnsavedModal(false)}>
                {t('cancel')}
              </Button>
              <Button variant="error" onClick={discardChanges}>
                {t('config.discardChanges')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Config;
