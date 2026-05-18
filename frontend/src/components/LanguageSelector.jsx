import { motion } from 'framer-motion';
import { useTranslation } from '../i18n';

const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center space-x-2 bg-zombie-gray-dark px-2 py-1 rounded border border-zombie-green">
      <button
        onClick={() => setLanguage('en')}
        className={`p-1 hover:bg-white/10 rounded transition ${language === 'en' ? 'opacity-100 ring-1 ring-zombie-green' : 'opacity-40 grayscale hover:grayscale-0'}`}
        title="English"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="24" height="12">
          <clipPath id="s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
          <clipPath id="t"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`p-1 hover:bg-white/10 rounded transition ${language === 'es' ? 'opacity-100 ring-1 ring-zombie-green' : 'opacity-40 grayscale hover:grayscale-0'}`}
        title="Español"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 36" width="24" height="13">
          <path fill="#006847" d="M0 0h21v36H0z" />
          <path fill="#fff" d="M21 0h21v36H21z" />
          <path fill="#ce1126" d="M42 0h21v36H42z" />
          <circle cx="31.5" cy="18" r="4.5" fill="#8d5b2d" />
          <circle cx="31.5" cy="18" r="2" fill="#006847" />
        </svg>
      </button>
    </div>
  );
};

export default LanguageSelector;
