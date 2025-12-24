import { motion } from 'framer-motion';
import { useTranslation } from '../i18n';

const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center space-x-2 bg-zombie-gray-dark px-3 py-1.5 rounded border border-zombie-green">
      <span className="text-zombie-green text-xs font-bold hidden sm:inline">🌐</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent text-terminal-text text-xs sm:text-sm font-bold outline-none cursor-pointer uppercase"
      >
        <option value="en" className="bg-zombie-gray">EN</option>
        <option value="es" className="bg-zombie-gray">ES</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
