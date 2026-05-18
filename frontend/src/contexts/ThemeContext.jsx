import React, { createContext, useContext, useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import api from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const DEFAULT_THEME = {
  primary: '#00ff41',
  primaryAlt: '#00cc33',
  secondary: '#39ff14',
  secondaryAlt: '#2ecc11',
  tertiary: '#7fff00',
  tertiaryAlt: '#66cc00',
  background: '#0a0e0a',
  surface: '#1a1f1a',
  surfaceAlt: '#2a2a2a',
  text: '#00ff41',
  muted: '#1e822a',
  border: '#00ff41',
  success: '#00ff41',
  warning: '#ffa500',
  danger: '#ff0000',
  info: '#00aaff',
  onPrimary: '#000000',
  onSecondary: '#000000',
  onSuccess: '#000000',
  onWarning: '#000000',
  onDanger: '#ffffff',
  onSurface: '#00ff41',
  sidebarBackground: '#181d18',
  sidebarText: '#00ff41',
  sidebarItem: '#232823',
  sidebarItemText: '#00ff41',
  sidebarItemActive: '#00ff41',
  sidebarItemActiveText: '#000000',
  cardBg: '#1a1f1a',
  shadow: '#00ff41'
};

const normalizeTheme = (themeObj) => {
  if (!themeObj) return DEFAULT_THEME;
  return {
    ...DEFAULT_THEME,
    ...themeObj
  };
};

const themes = [
  { id: 'zomboid-classic', name: 'Project Zomboid Classic (Retro)', ...DEFAULT_THEME },
  { 
    id: 'modern-horror', 
    name: 'Modern Horror Professional', 
    primary: '#00ff66', 
    primaryAlt: '#00cc52', 
    secondary: '#1aff75', 
    secondaryAlt: '#14cc5d', 
    tertiary: '#33ff85', 
    tertiaryAlt: '#29cc6a', 
    background: '#090a09', 
    surface: '#111311', 
    surfaceAlt: '#1a1d1a', 
    text: '#e6ffe6', 
    muted: '#4d804d', 
    border: '#1a331a', 
    success: '#00ff66', 
    warning: '#ffcc00', 
    danger: '#ff1a1a', 
    info: '#00ccff', 
    onPrimary: '#000000', 
    onSecondary: '#000000', 
    onSuccess: '#000000', 
    onWarning: '#000000', 
    onDanger: '#ffffff', 
    onSurface: '#e6ffe6', 
    sidebarBackground: '#0b0d0b', 
    sidebarText: '#00ff66', 
    sidebarItem: '#111311', 
    sidebarItemText: '#b3ffb3', 
    sidebarItemActive: '#00ff66', 
    sidebarItemActiveText: '#000000', 
    cardBg: '#111311', 
    shadow: '#00ff66' 
  },
  { 
    id: 'minimal-black', 
    name: 'Minimal Black', 
    primary: '#ffffff', 
    primaryAlt: '#cccccc', 
    secondary: '#888888', 
    secondaryAlt: '#666666', 
    tertiary: '#444444', 
    tertiaryAlt: '#333333', 
    background: '#050505', 
    surface: '#0f0f0f', 
    surfaceAlt: '#1a1a1a', 
    text: '#ffffff', 
    muted: '#888888', 
    border: '#222222', 
    success: '#888888', 
    warning: '#aaaaaa', 
    danger: '#444444', 
    info: '#666666', 
    onPrimary: '#000000', 
    onSecondary: '#ffffff', 
    onSuccess: '#ffffff', 
    onWarning: '#000000', 
    onDanger: '#ffffff', 
    onSurface: '#ffffff', 
    sidebarBackground: '#050505', 
    sidebarText: '#ffffff', 
    sidebarItem: '#0f0f0f', 
    sidebarItemText: '#cccccc', 
    sidebarItemActive: '#ffffff', 
    sidebarItemActiveText: '#000000', 
    cardBg: '#0f0f0f', 
    shadow: '#ffffff' 
  }
].map(t => normalizeTheme(t));


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
      theme: 'modern-horror',
      font: 'terminal',
      animations: true,
      customTitle: '',
      useServerName: true,
      refreshRate: 5000,
    };

    const saved = sessionStorage.getItem('pzwebadmin-theme-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!themes.find(t => t.id === parsed.theme)) parsed.theme = defaults.theme;
        if (!fonts[parsed.font]) parsed.font = defaults.font;
        return { ...defaults, ...parsed };
      } catch (e) {
        console.error('Failed to parse theme settings:', e);
      }
    }
    return defaults;
  });

  const [customColors, setCustomColors] = useState(() => {
    const saved = sessionStorage.getItem('pzwebadmin-custom-colors');
    let parsed = {};
    if (saved) {
      try {
        parsed = JSON.parse(saved) || {};
      } catch (e) {
        console.error('Failed to parse custom colors:', e);
      }
    }
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  });

  const [serverName, setServerName] = useState(() => {
    const saved = sessionStorage.getItem('pzwebadmin-server-name');
    return saved || 'Project Zomboid';
  });

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
    sessionStorage.setItem('pzwebadmin-theme-settings', JSON.stringify(settings));
    sessionStorage.setItem('pzwebadmin-custom-colors', JSON.stringify(customColors));
    applyTheme();
  }, [settings, customColors]);

  const applyTheme = () => {
    const font = fonts[settings.font] || fonts.terminal;
    const root = document.documentElement;

    // Apply font
    root.style.setProperty('--font-family', font.family);
    
    // Apply animation class
    if (settings.animations) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }

    document.body.className = `${font.className} ${!settings.animations ? 'no-animations' : ''}`.trim();

    // Apply theme
    root.setAttribute('data-theme', settings.theme);

      // Clear inline style overrides so the stylesheet values take over
      const keys = [
        'primary',
        'primary-alt',
        'secondary',
        'secondary-alt',
        'tertiary',
        'tertiary-alt',
        'background',
        'surface',
        'surface-alt',
        'text',
        'text-muted',
        'border',
        'success',
        'warning',
        'danger',
        'info',
        'on-primary',
        'on-secondary',
        'on-success',
        'on-warning',
        'on-danger',
        'on-surface',
        'sidebar-background',
        'sidebar-text',
        'sidebar-item',
        'sidebar-item-text',
        'sidebar-item-active',
        'sidebar-item-active-text'
      ];
      keys.forEach(key => root.style.removeProperty(`--color-${key}`));
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateCustomColor = (key, value) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
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
    currentTheme: themes.find(t => t.id === settings.theme),
    currentFont: fonts[settings.font],
    customColors,
    updateCustomColor,
    serverName,
    setServerName,
    getTitle,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MotionConfig reducedMotion={settings.animations ? "user" : "always"}>
        {children}
      </MotionConfig>
    </ThemeContext.Provider>
  );
};
