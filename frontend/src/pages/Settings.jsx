import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/index.jsx';
import { useTheme } from '../contexts/ThemeContext';
import { Card, Button, Input } from '../components/ui';
import { GlitchText } from '../components/effects/ZombieEffects';
import { 
  FaCog, 
  FaPalette, 
  FaFont, 
  FaToggleOn, 
  FaToggleOff,
  FaHeading,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, themes, fonts, getTitle, serverName, currentTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [localSettings, settings]);

  const handleThemeChange = (themeKey) => {
    setLocalSettings(prev => ({ ...prev, theme: themeKey }));
  };

  const handleFontChange = (fontKey) => {
    setLocalSettings(prev => ({ ...prev, font: fontKey }));
  };

  const handleAnimationsToggle = () => {
    setLocalSettings(prev => ({ ...prev, animations: !prev.animations }));
  };

  const handleTitleModeToggle = () => {
    setLocalSettings(prev => ({ ...prev, useServerName: !prev.useServerName }));
  };

  const handleCustomTitleChange = (e) => {
    setLocalSettings(prev => ({ ...prev, customTitle: e.target.value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success(t('settings.saved'));
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const handleResetDefaults = () => {
    const defaults = {
      theme: 'zombie',
      font: 'mono',
      animations: true,
      customTitle: '',
      useServerName: true,
    };
    setLocalSettings(defaults);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('settings.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Save Bar */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zombie-warning bg-opacity-20 border-2 border-zombie-warning rounded-lg p-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <FaCog className="text-zombie-warning text-xl animate-spin-slow" />
              <span className="text-terminal-text font-bold">
                {t('settings.unsavedChanges')}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handleReset}>
                <FaUndo className="mr-2" />
                {t('cancel')}
              </Button>
              <Button variant="primary" onClick={handleSave}>
                <FaSave className="mr-2" />
                {t('save')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Preview */}
      <Card>
        <h2 className="text-xl font-bold text-terminal-text mb-4 flex items-center">
          <FaHeading className="mr-2" />
          {t('settings.preview')}
        </h2>
        <div className="bg-zombie-gray-dark rounded-lg p-6 border-2 border-zombie-green">
          <h3 className="text-3xl font-bold mb-2" style={{ color: currentTheme.primary }}>
            {localSettings.useServerName ? `${serverName} WebAdmin` : (localSettings.customTitle || 'WebAdmin')}
          </h3>
          <p className="text-gray-400 text-sm">
            {t('settings.previewDescription')}
          </p>
        </div>
      </Card>

      {/* Animations */}
      <Card>
        <h2 className="text-xl font-bold text-terminal-text mb-4 flex items-center">
          <FaToggleOn className="mr-2" />
          {t('settings.animations')}
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-terminal-text font-semibold mb-1">
              {t('settings.enableAnimations')}
            </p>
            <p className="text-gray-400 text-sm">
              {t('settings.animationsDescription')}
            </p>
          </div>
          <button
            onClick={handleAnimationsToggle}
            className="text-4xl transition-colors"
            style={{ color: localSettings.animations ? currentTheme.primary : '#6b7280' }}
          >
            {localSettings.animations ? <FaToggleOn /> : <FaToggleOff />}
          </button>
        </div>
      </Card>

      {/* Theme Selection */}
      <Card>
        <h2 className="text-xl font-bold text-terminal-text mb-4 flex items-center">
          <FaPalette className="mr-2" />
          {t('settings.colorTheme')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(themes).map(([key, theme]) => (
            <div
              key={key}
              onClick={() => handleThemeChange(key)}
              className={`
                cursor-pointer rounded-lg p-4 border-2 transition-all
                ${localSettings.theme === key 
                  ? 'border-opacity-100 shadow-lg' 
                  : 'border-gray-600 hover:border-gray-400'}
              `}
              style={{
                borderColor: localSettings.theme === key ? theme.primary : undefined,
                boxShadow: localSettings.theme === key ? `0 0 20px ${theme.shadow}` : undefined,
                backgroundColor: theme.cardBg,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold" style={{ color: theme.primary }}>
                  {theme.name}
                </span>
                {localSettings.theme === key && (
                  <span style={{ color: theme.primary }}>✓</span>
                )}
              </div>
              <div className="flex space-x-2">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.primary }}
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.secondary }}
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.accent }}
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.danger }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Font Selection */}
      <Card>
        <h2 className="text-xl font-bold text-terminal-text mb-4 flex items-center">
          <FaFont className="mr-2" />
          {t('settings.typography')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(fonts).map(([key, font]) => (
            <div
              key={key}
              onClick={() => handleFontChange(key)}
              className={`
                cursor-pointer rounded-lg p-4 border-2 transition-all
                ${localSettings.font === key 
                  ? 'border-zombie-green shadow-lg shadow-zombie-green/20' 
                  : 'border-gray-600 hover:border-gray-400'}
              `}
              style={{ backgroundColor: 'var(--color-card-bg)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-terminal-text">
                  {font.name}
                </span>
                {localSettings.font === key && (
                  <span className="text-zombie-green">✓</span>
                )}
              </div>
              <p 
                className="text-lg"
                style={{ fontFamily: font.family, color: currentTheme.textPrimary }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Title Settings */}
      <Card>
        <h2 className="text-xl font-bold text-terminal-text mb-4 flex items-center">
          <FaHeading className="mr-2" />
          {t('settings.webTitle')}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terminal-text font-semibold mb-1">
                {t('settings.useServerName')}
              </p>
              <p className="text-gray-400 text-sm">
                {t('settings.serverNameDescription', { name: serverName })}
              </p>
            </div>
            <button
              onClick={handleTitleModeToggle}
              className="text-4xl transition-colors"
              style={{ color: localSettings.useServerName ? currentTheme.primary : '#6b7280' }}
            >
              {localSettings.useServerName ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </div>

          {!localSettings.useServerName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Input
                type="text"
                value={localSettings.customTitle}
                onChange={handleCustomTitleChange}
                placeholder={t('settings.customTitlePlaceholder')}
                className="w-full"
              />
            </motion.div>
          )}
        </div>
      </Card>

      {/* Reset to Defaults */}
      <Card className="bg-zombie-gray-dark border-2 border-gray-600">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-terminal-text mb-1">
              {t('settings.resetDefaults')}
            </h3>
            <p className="text-gray-400 text-sm">
              {t('settings.resetDescription')}
            </p>
          </div>
          <Button variant="error" onClick={handleResetDefaults}>
            <FaUndo className="mr-2" />
            {t('settings.reset')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
