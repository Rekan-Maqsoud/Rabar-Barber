import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from '../locales/en.json';
import ckb from '../locales/ckb.json';
import ar from '../locales/ar.json';

const STORE_LANGUAGE_KEY = 'settings.lang';
const normalizeLang = (lng?: string | null) => {
  if (!lng) return 'ckb';
  if (lng === 'ku') return 'ckb';
  if (lng === 'en' || lng === 'ckb' || lng === 'ar') return lng;
  return 'ckb';
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedDataJSON = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
      const selectLanguage = normalizeLang(savedDataJSON);
      callback(selectLanguage);
    } catch (error) {
      console.log('Error reading language', error);
      callback('ckb');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, normalizeLang(lng));
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      ckb,
      ar,
    },
    fallbackLng: 'ckb',
    interpolation: {
      escapeValue: false,
    },
  });

// Handle RTL layout changes dynamically
i18n.on('languageChanged', (lng) => {
  const isRTL = lng === 'ar' || lng === 'ckb';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
});

export default i18n;
