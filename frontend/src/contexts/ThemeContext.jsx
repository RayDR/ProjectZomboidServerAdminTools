import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const themes = {
  zombie: {
    name: 'Zombie Green',
    primary: '#00ff41',
    secondary: '#39ff14',
    accent: '#7fff00',
    danger: '#ff0000',
    warning: '#ffa500',
    background: '#0a0e0a',
    cardBg: '#1a1f1a',
    textPrimary: '#00ff41',
    textSecondary: '#39ff14',
    shadow: 'rgba(0, 255, 65, 0.3)',
  },
  blood: {
    name: 'Blood Red',
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#b91c1c',
    danger: '#7f1d1d',
    warning: '#ea580c',
    background: '#0f0a0a',
    cardBg: '#1f1515',
    textPrimary: '#dc2626',
    textSecondary: '#ef4444',
    shadow: 'rgba(220, 38, 38, 0.3)',
  },
  military: {
    name: 'Military Blue',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#2563eb',
    danger: '#dc2626',
    warning: '#f59e0b',
    background: '#0a0f14',
    cardBg: '#151f2a',
    textPrimary: '#3b82f6',
    textSecondary: '#60a5fa',
    shadow: 'rgba(59, 130, 246, 0.3)',
  },
};

const fonts = {
  terminal: {
    name: 'Terminal Classic',
    family: '"Courier New", "Consolas", "Liberation Mono", monospace',
    className: 'font-mono',
  },
  horror: {
    name: 'Horror/Zombie',
    family: '"Creepster", "Nosifer", cursive',
    className: 'font-zombie',
  },
  military: {
    name: 'Military Stencil',
    family: '"Special Elite", "Courier New", monospace',
    className: 'font-stencil',
  },
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const defaults = {
      theme: 'zombie',
      font: 'terminal',
      animations: true,
      customTitle: '',
      useServerName: true,
    };
    
    const saved = localStorage.getItem('pzwebadmin-theme-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that theme and font exist
        if (!themes[parsed.theme]) {
          parsed.theme = defaults.theme;
        }
        if (!fonts[parsed.font]) {
          parsed.font = defaults.font;
        }
        return { ...defaults, ...parsed };
      } catch (e) {
        console.error('Failed to parse theme settings:', e);
      }
    }
    return defaults;
  });

  const [serverName, setServerName] = useState(() => {
    const saved = sessionStorage.getItem('pzwebadmin-server-name');
    return saved || 'Project Zomboid';
  });

  // Fetch server name from backend on mount
  useEffect(() => {
    const fetchServerName = async () => {
      try {
        const response = await api.get('/server/config');
        if (response.data.success && response.data.data.serverName) {
          const name = response.data.data.serverName;
          setServerName(name);
          sessionStorage.setItem('pzwebadmin-server-name', name);
        }
      } catch (error) {
        console.error('Failed to fetch server name:', error);
      }
    };

    fetchServerName();
  }, []);

  useEffect(() => {
    localStorage.setItem('pzwebadmin-theme-settings', JSON.stringify(settings));
    applyTheme();
  }, [settings]);

  const applyTheme = () => {
    const theme = themes[settings.theme] || themes.zombie;
    const font = fonts[settings.font] || fonts.terminal;

    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-danger', theme.danger);
    root.style.setProperty('--color-warning', theme.warning);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-card-bg', theme.cardBg);
    root.style.setProperty('--color-text-primary', theme.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--color-shadow', theme.shadow);
    root.style.setProperty('--font-family', font.family);

    // Apply body classes
    document.body.className = font.className;
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const getTitle = () => {
    if (!settings.useServerName && settings.customTitle) {
      return settings.customTitle;
    }
    return `${serverName} WebAdmin`;
  };

  const value = {
    settings,
    updateSettings,
    themes,
    fonts,
    currentTheme: themes[settings.theme],
    currentFont: fonts[settings.font],
    serverName,
    setServerName,
    getTitle,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
