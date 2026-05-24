import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import React from 'react';

// We mock storage for tests
const mockStorage = (() => {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

describe('ThemeContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('should initialize with default theme and normalize custom ones', () => {
    // If the localstorage had an old incomplete theme, normalizeTheme should fix it
    window.sessionStorage.setItem('pzwebadmin-custom-colors', JSON.stringify({ primary: '#fff' }));
    
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.settings.theme).toBe('modern-horror');
    expect(result.current.customColors).toEqual({ primary: '#fff' });
    
    // We expect applyTheme to be called implicitly via useEffect
    // Since we're in jsdom, we can check document variables
    expect(document.documentElement.getAttribute('data-theme')).toBe('modern-horror');
  });

  it('should not crash with empty or broken localstorage', () => {
    window.sessionStorage.setItem('pzwebadmin-theme-settings', '{broken json');
    
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.settings.theme).toBe('modern-horror');
  });
});
