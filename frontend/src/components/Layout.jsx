import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, FaServer, FaFileAlt, FaCog, FaPuzzlePiece, 
  FaDatabase, FaTerminal, FaSignOutAlt, FaBars, FaTimes,
  FaSkull
} from 'react-icons/fa';
import { FloatingParticles, StatusIndicator } from './effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import LanguageSelector from './LanguageSelector';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { path: '/', icon: FaHome, label: t('nav.dashboard') },
    { path: '/server', icon: FaServer, label: t('nav.serverControl') },
    { path: '/logs', icon: FaFileAlt, label: t('nav.logs') },
    { path: '/mods', icon: FaPuzzlePiece, label: t('nav.mods') },
    { path: '/backups', icon: FaDatabase, label: t('nav.backups') },
    { path: '/config', icon: FaCog, label: t('nav.configuration') },
    { path: '/console', icon: FaTerminal, label: t('nav.console') },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-zombie-gray-dark relative overflow-hidden">
      <FloatingParticles count={15} />
      
      {/* Top bar */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-zombie-gray border-b-4 border-zombie-green shadow-terminal relative z-20"
      >
        <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-terminal-text hover:text-zombie-green transition-colors text-xl sm:text-2xl"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FaSkull className="text-zombie-blood text-xl sm:text-3xl" />
              <h1 className="text-lg sm:text-2xl font-bold text-terminal-text text-shadow-terminal font-zombie">
                <span className="hidden sm:inline">PROJECT ZOMBOID</span>
                <span className="sm:hidden">PZ ADMIN</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSelector />
            <div className="flex items-center space-x-1 sm:space-x-2 bg-zombie-gray-dark px-2 sm:px-4 py-1 sm:py-2 rounded border border-zombie-green">
              <StatusIndicator status="online" />
              <span className="text-terminal-text text-xs sm:text-sm font-bold hidden sm:inline">{t('nav.online')}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 bg-zombie-blood hover:bg-zombie-blood-dark text-white rounded border border-red-800 transition-colors"
            >
              <FaSignOutAlt className="text-sm sm:text-base" />
              <span className="font-bold text-xs sm:text-sm hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </motion.header>

      <div className="flex relative">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 256 : 0,
            opacity: sidebarOpen ? 1 : 0,
          }}
          className="bg-zombie-gray border-r-4 border-zombie-green shadow-terminal overflow-hidden relative z-10 hidden md:block"
        >
          <nav className="p-4 space-y-2 min-w-[240px]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ x: 5, scale: 1.02 }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded transition-all ${
                      isActive
                        ? 'bg-zombie-green text-white border-2 border-zombie-green-light shadow-terminal'
                        : 'text-terminal-text hover:bg-zombie-gray-light border-2 border-transparent'
                    }`}
                  >
                    <Icon className={`text-xl ${isActive ? 'text-white' : 'text-zombie-green'}`} />
                    <span className="font-bold uppercase tracking-wide text-sm">
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-zombie-green bg-zombie-gray-dark">
            <div className="text-center">
              <p className="text-terminal-text text-xs opacity-50 font-mono">
                PZWebAdmin v2.0
              </p>
              <p className="text-zombie-green text-xs mt-1">
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
    </div>
  );
};

export default Layout;
