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
  FaHeading,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const SettingSwitch = ({ enabled, onToggle, title }) => (
  <button
    type="button"
    onClick={onToggle}
    title={title}
    aria-pressed={enabled}
    className={`setting-switch ${enabled ? 'setting-switch-on' : ''}`}
  >
    <span className="setting-switch-thumb" />
  </button>
);

const Settings = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, themes, fonts } = useTheme();
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
      theme: 'modern-horror',
      font: 'terminal',
      animations: true,
      customTitle: '',
      refreshRate: 5000,
    };
    setLocalSettings(defaults);
  };

  const previewTitle = localSettings.customTitle?.trim() || 'Project Zomboid Server WebAdmin';
  const previewThemeClass = `settings-preview-theme-${localSettings.theme || 'modern-horror'}`;
  const previewFontClass = `settings-preview-font-${localSettings.font || 'terminal'}`;
  const previewFontFamily = fonts[localSettings.font]?.family || fonts.terminal.family;
  const selectedTheme = themes.find((theme) => theme.id === localSettings.theme) || themes[0];
  const previewStyle = {
    fontFamily: previewFontFamily,
    '--preview-primary': selectedTheme?.primary,
    '--preview-secondary': selectedTheme?.secondary,
    '--preview-danger': selectedTheme?.danger,
    '--preview-surface': selectedTheme?.surface,
    '--preview-background': selectedTheme?.background,
    '--preview-text': selectedTheme?.text,
    '--preview-muted': selectedTheme?.muted
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text text-shadow-terminal font-title mb-2">
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
              <span className="text-text font-bold">
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Current Preview */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-text flex items-center">
              <FaHeading className="mr-2" />
              {t('settings.preview')}
            </h2>
            <span className="text-xs px-3 py-1 rounded-full border border-border text-muted bg-background">Live</span>
          </div>
          <div
            className={`settings-preview-panel ${previewThemeClass} ${previewFontClass} ${localSettings.animations ? 'settings-preview-animations-on' : 'settings-preview-animations-off'}`}
            style={previewStyle}
          >
            <div className="settings-preview-title-wrap">
              <label className="settings-preview-title-label">
                {t('settingsInline.customTitle')}
              </label>
              <Input
                type="text"
                value={localSettings.customTitle}
                onChange={handleCustomTitleChange}
                placeholder={t('settings.customTitlePlaceholder')}
                className="w-full"
              />
            </div>
            <h3 className="settings-preview-title">{previewTitle}</h3>
            <p className="settings-preview-description">
              {t('settings.previewDescription')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="settings-preview-btn settings-preview-btn-primary">{t('settings.primaryAction')}</button>
              <button type="button" className="settings-preview-btn settings-preview-btn-secondary">{t('settings.secondaryAction')}</button>
              <button type="button" className="settings-preview-btn settings-preview-btn-danger">{t('settings.dangerAction')}</button>
              <span className="settings-preview-badge settings-preview-badge-success">{t('settings.runningStatus')}</span>
              <span className="settings-preview-badge settings-preview-badge-warning">{t('settings.warningStatus')}</span>
            </div>
            <div className="settings-preview-animation-row">
              <span className="settings-preview-animation-label">
                {t('settingsInline.animations')}: {localSettings.animations ? t('settingsInline.enabled') : t('settingsInline.disabled')}
              </span>
              <span className="settings-preview-dot" />
            </div>
          </div>
        </Card>

        {/* Quick Toggles */}
        <Card>
          <h2 className="text-xl font-bold text-text mb-4 flex items-center">
            <FaToggleOn className="mr-2" />
            {t('settingsInline.quickSettings')}
          </h2>
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-text font-semibold mb-1">{t('settings.enableAnimations')}</p>
                  <p className="text-gray-400 text-sm">{t('settings.animationsDescription')}</p>
                </div>
                <SettingSwitch
                  enabled={localSettings.animations}
                  onToggle={handleAnimationsToggle}
                  title={t('settings.animationsDescription')}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-text font-semibold mb-1">{t('settings.refreshRate') || 'Refresh rate'}</p>
                  <p className="text-gray-400 text-sm">
                    {t('settingsInline.refreshHelp')}
                  </p>
                </div>
                <span className="font-mono text-text text-sm px-3 py-1 rounded bg-surfaceAlt border border-border">
                  {(localSettings.refreshRate || 5000) / 1000}s
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="60000"
                step="1000"
                value={localSettings.refreshRate || 5000}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, refreshRate: Number(e.target.value) }))}
                className="w-full mt-4 settings-range"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Theme Selection */}
      <Card>
        <h2 className="text-xl font-bold text-text mb-4 flex items-center">
          <FaPalette className="mr-2" />
          {t('settings.colorTheme')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`theme-option settings-theme-card settings-theme-card-${theme.id} ${localSettings.theme === theme.id ? 'theme-option-active' : 'theme-option-inactive'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold settings-theme-card-title">
                  {theme.name}
                </span>
                {localSettings.theme === theme.id && (
                  <span className="settings-theme-card-check">✓</span>
                )}
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 rounded settings-swatch settings-swatch-primary" />
                <div className="w-8 h-8 rounded settings-swatch settings-swatch-secondary" />
                <div className="w-8 h-8 rounded settings-swatch settings-swatch-tertiary" />
                <div className="w-8 h-8 rounded settings-swatch settings-swatch-danger" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Font Selection */}
      <Card>
        <h2 className="text-xl font-bold text-text mb-4 flex items-center">
          <FaFont className="mr-2" />
          {t('settings.typography')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(fonts).map(([key, font]) => (
            <div
              key={key}
              onClick={() => handleFontChange(key)}
              className={`theme-option settings-font-card settings-font-card-${key} ${localSettings.font === key ? 'theme-option-active' : 'theme-option-inactive'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold">
                  {font.name}
                </span>
                {localSettings.font === key && (
                  <span className="settings-font-card-check">✓</span>
                )}
              </div>
              <p className="text-lg settings-font-preview">
                {t('settings.fontPreviewText')}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Reset to Defaults */}
      <Card className="settings-reset-card border-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-text mb-1">
              {t('settings.resetDefaults')}
            </h3>
            <p className="text-muted text-sm">
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
