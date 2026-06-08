import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.scss';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLng = i18n.language.startsWith('ru') ? 'en' : 'ru';
    i18n.changeLanguage(nextLng);
  };

  const currentLang = i18n.language.startsWith('ru') ? 'RU' : 'EN';

  return (
    <button 
      className={styles.switcher} 
      onClick={toggleLanguage}
      title={currentLang === 'RU' ? 'Switch to English' : 'Переключить на русский'}
    >
      {currentLang}
    </button>
  );
};

export default LanguageSwitcher;
