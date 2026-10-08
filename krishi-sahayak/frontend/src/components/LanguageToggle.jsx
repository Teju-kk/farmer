import { useLocale } from '../i18n';

export default function LanguageToggle() {
  const [locale, setLocale] = useLocale();
  return <button type="button" className="language-toggle" onClick={() => setLocale(locale === 'en' ? 'kn' : 'en')} aria-label={locale === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ' : 'Switch to English'}>{locale === 'en' ? 'ಕನ್ನಡ' : 'English'}</button>;
}
