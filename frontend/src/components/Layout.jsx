import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaCog, FaSignOutAlt, FaBars, FaTimes, FaSkull, FaPalette } from 'react-icons/fa';
import { FloatingParticles, StatusIndicator } from './effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { getTitle, settings } = useTheme();

  const menuItems = [
    { path: '/', icon: FaHome, label: t('nav.dashboard') },
    // Only essential items since most are in the modal now
    { path: '/settings', icon: FaCog, label: t('nav.settings') },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingParticles count={15} />

      {/* Top bar */}
      {settings.animations ? (
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-surface border-b border-border shadow-md relative z-20"
        >
          <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-text hover:text-primary transition-colors text-xl sm:text-2xl"
              >
                {sidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FaSkull className="text-danger text-xl sm:text-3xl" />
                <h1 className="text-lg sm:text-2xl font-bold text-primary font-mono">
                  <span className="hidden sm:inline">{getTitle()}</span>
                  <span className="sm:hidden">PZ ADMIN</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setThemeSelectorOpen(true)}
                className="text-onSurface hover:text-primary transition-colors text-lg"
                title="Theme Settings"
              >
                <FaPalette />
              </button>
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="btn btn-danger px-2 sm:px-4 py-1 sm:py-2 flex items-center space-x-1 sm:space-x-2"
              >
                <FaSignOutAlt className="text-sm sm:text-base" />
                <span className="font-bold text-xs sm:text-sm hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </motion.header>
      ) : (
        <header className="bg-surface border-b border-border shadow-md relative z-20">
          <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-text hover:text-primary transition-colors text-xl sm:text-2xl"
              >
                {sidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FaSkull className="text-danger text-xl sm:text-3xl" />
                <h1 className="text-lg sm:text-2xl font-bold text-primary font-mono">
                  <span className="hidden sm:inline">{getTitle()}</span>
                  <span className="sm:hidden">PZ ADMIN</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setThemeSelectorOpen(true)}
                className="text-onSurface hover:text-primary transition-colors text-lg"
                title="Theme Settings"
              >
                <FaPalette />
              </button>
              <LanguageSelector />
              <div className="flex items-center space-x-1 sm:space-x-2 bg-background px-2 sm:px-4 py-1 sm:py-2 rounded border border-border">
                <StatusIndicator status="online" />
                <span className="text-text text-xs sm:text-sm font-bold hidden sm:inline">{t('nav.online')}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-danger px-2 sm:px-4 py-1 sm:py-2 flex items-center space-x-1 sm:space-x-2"
              >
                <FaSignOutAlt className="text-sm sm:text-base" />
                <span className="font-bold text-xs sm:text-sm hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="flex relative">
        {/* Sidebar */}

        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 256 : 0,
            opacity: sidebarOpen ? 1 : 0,
          }}
          className="sidebar bg-sidebarBackground text-sidebarText border-r border-border shadow-md overflow-hidden relative z-10 hidden md:block"
        >
          <nav className="p-4 space-y-2 min-w-[240px]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ x: 5, scale: 1.02 }}
                    className={`sidebar-item flex items-center space-x-3 px-4 py-3 rounded transition-all ${
                      isActive
                        ? 'sidebar-item-active bg-sidebarItemActive text-sidebarItemActiveText'
                        : 'bg-sidebarItem text-sidebarItemText'
                    }`}
                  >
                    <Icon className="text-xl" />
                    <span className="font-bold uppercase tracking-wide text-sm">
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
            <div className="text-center">
              <p className="text-muted text-xs font-mono">
                PZWebAdmin v2.0
              </p>
              <p className="text-primary opacity-70 text-xs mt-1">
                © 2025 DomoForge
              </p>
            </div>
          </div>
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 relative z-0 min-h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <ThemeSelector isOpen={themeSelectorOpen} onClose={() => setThemeSelectorOpen(false)} />
    </div>
  );
};

export default Layout;
