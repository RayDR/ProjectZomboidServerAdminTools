import React, { createContext, useContext, useState, useEffect } from 'react';

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
  mono: {
    name: 'Monospace',
    family: '"Courier New", Courier, monospace',
    className: 'font-mono',
  },
  zombie: {
    name: 'Creepster',
    family: '"Creepster", cursive',
    className: 'font-zombie',
  },
  system: {
    name: 'System',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    className: 'font-sans',
  },
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pzwebadmin-theme-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse theme settings:', e);
      }
    }
    return {
      theme: 'zombie',
      font: 'mono',
      animations: true,
      customTitle: '',
      useServerName: true,
    };
  });

  const [serverName, setServerName] = useState('Project Zomboid');

  useEffect(() => {
    localStorage.setItem('pzwebadmin-theme-settings', JSON.stringify(settings));
    applyTheme();
  }, [settings]);

  const applyTheme = () => {
    const theme = themes[settings.theme];
    const font = fonts[settings.font];

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
