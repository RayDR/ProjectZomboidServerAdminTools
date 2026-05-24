import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaPalette, FaTimes, FaUndo } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';

const ThemeSelector = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { settings, updateSettings, themes, customColors, updateCustomColor } = useTheme();

  const colorKeys = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'tertiary', label: 'Tertiary' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'surface-alt', label: 'Surface Alt' },
    { key: 'text', label: 'Text' },
    { key: 'text-muted', label: 'Text Muted' },
    { key: 'border', label: 'Border' },
    { key: 'success', label: 'Success' },
    { key: 'warning', label: 'Warning' },
    { key: 'danger', label: 'Danger' },
    { key: 'on-primary', label: 'On Primary' },
    { key: 'on-secondary', label: 'On Secondary' },
    { key: 'on-success', label: 'On Success' },
    { key: 'on-warning', label: 'On Warning' },
    { key: 'on-danger', label: 'On Danger' },
    { key: 'on-surface', label: 'On Surface' },
    { key: 'sidebar-background', label: 'Sidebar Background' },
    { key: 'sidebar-text', label: 'Sidebar Text' },
    { key: 'sidebar-item', label: 'Sidebar Item' },
    { key: 'sidebar-item-text', label: 'Sidebar Item Text' },
    { key: 'sidebar-item-active', label: 'Sidebar Item Active' },
    { key: 'sidebar-item-active-text', label: 'Sidebar Item Active Text' }
  ];

  const getColorLabel = (key, fallback) => {
    const translationKey = `themeSelector.colors.${key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`;
    const translated = t(translationKey);
    return translated === translationKey ? fallback : translated;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-surface border border-border w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg shadow-2xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-border bg-surfaceAlt rounded-t-lg">
          <h2 className="text-xl font-bold text-text flex items-center">
            <FaPalette className="mr-2 text-primary" /> {t('settings.themeConfig')}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-text font-bold mb-2">{t('settings.selectTemplate')}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {themes.map(themeOption => (
                <button
                  key={themeOption.id}
                  onClick={() => updateSettings({ theme: themeOption.id })}
                  className={`theme-option settings-theme-selector-option ${settings.theme === themeOption.id ? 'theme-option-active' : 'theme-option-inactive'}`}
                >
                  <div className="font-bold settings-theme-selector-title">
                    {themeOption.name}
                  </div>
                  <div className="text-xs mt-1 settings-theme-selector-subtitle">
                    {themeOption.id === 'custom' ? t('themeSelector.createColors') : t('themeSelector.predefinedPalette')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {settings.theme === 'custom' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-text">{t('settings.customColors')}</h3>
                    <button
                      className="text-xs flex items-center text-muted hover:text-warning"
                      onClick={() => {
                        // Reset to defaults
                        const empty = {};
                        colorKeys.forEach(c => empty[c.key] = '');
                        // A more robust implementation would clear local storage for custom colors
                        // but setting to empty string reverts to CSS defaults
                        colorKeys.forEach(c => updateCustomColor(c.key, ''));
                      }}
                    >
                      <FaUndo className="mr-1" /> {t('settings.reset')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {colorKeys.map(({ key, label }) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-xs text-muted mb-1">{getColorLabel(key, label)}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors[key] || '#000000'}
                            onChange={(e) => updateCustomColor(key, e.target.value)}
                            className="h-8 w-8 rounded border border-border cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={customColors[key] || ''}
                            onChange={(e) => updateCustomColor(key, e.target.value)}
                            placeholder="default"
                            className="flex-1 bg-surfaceAlt border border-border text-text text-sm rounded px-2 py-1 outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-md font-bold text-text mb-3">{t('settings.preview')}</h3>
            <div className="p-4 bg-background border border-border rounded flex flex-wrap gap-4">
              <button className="btn btn-primary">{t('settings.primaryAction')}</button>
              <button className="btn btn-secondary">{t('settings.secondaryAction')}</button>
              <button className="btn btn-danger">{t('settings.dangerAction')}</button>
              <span className="badge badge-success">{t('settings.runningStatus')}</span>
              <span className="badge badge-warning">{t('settings.warningStatus')}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-surfaceAlt flex justify-end">
          <button onClick={onClose} className="btn btn-primary">{t('settings.done')}</button>
        </div>
      </motion.div>
    </div>
  );
};

export default ThemeSelector;
