import en from './en.json';
import kn from './kn.json';
import { useEffect, useState } from 'react';
const dictionaries = { en, kn };
export const t = (key, locale = 'en') => dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
export const copy = (text, locale = 'en') => locale === 'kn' ? (knCopy[text] || text) : text;
export function useLocale() {
  const [locale, setCurrent] = useState(() => localStorage.getItem('krishi_locale') || 'en');
  useEffect(() => { const update = () => setCurrent(localStorage.getItem('krishi_locale') || 'en'); window.addEventListener('krishi:locale-changed', update); return () => window.removeEventListener('krishi:locale-changed', update); }, []);
  const setLocale = (next) => { localStorage.setItem('krishi_locale', next); setCurrent(next); window.dispatchEvent(new window.Event('krishi:locale-changed')); };
  return [locale, setLocale];
}
const knCopy = {
  'Sign in': 'ಲಾಗಿನ್', 'Create account': 'ಖಾತೆ ರಚಿಸಿ', 'Create your farmer account': 'ನಿಮ್ಮ ರೈತ ಖಾತೆ ರಚಿಸಿ', 'Welcome back': 'ಮತ್ತೆ ಸ್ವಾಗತ',
  'Keep your farm, crop, and finance records together.': 'ನಿಮ್ಮ ಹೊಲ, ಬೆಳೆ ಮತ್ತು ಹಣಕಾಸಿನ ದಾಖಲೆಗಳನ್ನು ಒಟ್ಟಿಗೆ ಇಡಿ.', 'Sign in to open your farm workspace.': 'ನಿಮ್ಮ ಕೃಷಿ ಕಾರ್ಯಕ್ಷೇತ್ರವನ್ನು ತೆರೆಯಲು ಲಾಗಿನ್ ಮಾಡಿ.',
  'Administrator sign in': 'ನಿರ್ವಾಹಕರ ಲಾಗಿನ್', 'Back to standard sign in': 'ಸಾಮಾನ್ಯ ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ', 'Authorized administrators only. Admin accounts are created by the platform administrator.': 'ಅಧಿಕೃತ ನಿರ್ವಾಹಕರಿಗೆ ಮಾತ್ರ. ನಿರ್ವಾಹಕ ಖಾತೆಗಳನ್ನು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ನಿರ್ವಾಹಕರು ರಚಿಸುತ್ತಾರೆ.', 'Sign in to manage the Krishi Sahayak platform.': 'ಕೃಷಿ ಸಹಾಯಕ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ನಿರ್ವಹಿಸಲು ಲಾಗಿನ್ ಮಾಡಿ.', 'This account does not have administrator access. Use the standard sign-in page.': 'ಈ ಖಾತೆಗೆ ನಿರ್ವಾಹಕ ಪ್ರವೇಶವಿಲ್ಲ. ಸಾಮಾನ್ಯ ಲಾಗಿನ್ ಪುಟ ಬಳಸಿ.', 'Administrator accounts must use the administrator sign-in page.': 'ನಿರ್ವಾಹಕ ಖಾತೆಗಳು ನಿರ್ವಾಹಕರ ಲಾಗಿನ್ ಪುಟವನ್ನು ಬಳಸಬೇಕು.',
  'Full name': 'ಪೂರ್ಣ ಹೆಸರು', Email: 'ಇಮೇಲ್', Phone: 'ದೂರವಾಣಿ', Password: 'ಗುಪ್ತಪದ', 'New password': 'ಹೊಸ ಗುಪ್ತಪದ', 'Current password': 'ಪ್ರಸ್ತುತ ಗುಪ್ತಪದ',
  'Optional': 'ಐಚ್ಛಿಕ', 'Use at least 8 characters.': 'ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳನ್ನು ಬಳಸಿ.', 'Forgot password?': 'ಗುಪ್ತಪದ ಮರೆತಿರಾ?', 'Send reset link': 'ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಿ',
  'Farm name': 'ಹೊಲದ ಹೆಸರು', Area: 'ವಿಸ್ತೀರ್ಣ', Unit: 'ಘಟಕ', District: 'ಜಿಲ್ಲೆ', 'Add a farm': 'ಹೊಲ ಸೇರಿಸಿ', 'Save farm': 'ಹೊಲ ಉಳಿಸಿ', 'Farm saved.': 'ಹೊಲ ಉಳಿಸಲಾಗಿದೆ.',
  'Crop name': 'ಬೆಳೆಯ ಹೆಸರು', Variety: 'ತಳಿ', Farm: 'ಹೊಲ', 'Sowing date': 'ಬಿತ್ತನೆ ದಿನಾಂಕ', 'Add a crop': 'ಬೆಳೆ ಸೇರಿಸಿ', 'Save crop': 'ಬೆಳೆ ಉಳಿಸಿ', 'Crop saved.': 'ಬೆಳೆ ಉಳಿಸಲಾಗಿದೆ.',
  'Record a transaction': 'ವಹಿವಾಟು ದಾಖಲಿಸಿ', Expense: 'ವೆಚ್ಚ', Income: 'ಆದಾಯ', Category: 'ವರ್ಗ', Source: 'ಮೂಲ', 'Amount (₹)': 'ಮೊತ್ತ (₹)', Date: 'ದಿನಾಂಕ', Note: 'ಟಿಪ್ಪಣಿ', 'Save record': 'ದಾಖಲೆ ಉಳಿಸಿ',
  'Buy supplies': 'ಸಾಮಗ್ರಿ ಖರೀದಿಸಿ', 'Sell crop': 'ಬೆಳೆ ಮಾರಾಟ', 'Create a crop listing': 'ಬೆಳೆ ಪಟ್ಟಿಯನ್ನು ರಚಿಸಿ', Quantity: 'ಪ್ರಮಾಣ', 'Expected price (₹ per unit)': 'ನಿರೀಕ್ಷಿತ ಬೆಲೆ (₹ ಪ್ರತಿ ಘಟಕಕ್ಕೆ)', Location: 'ಸ್ಥಳ', 'Harvest date': 'ಕೊಯ್ಲು ದಿನಾಂಕ', Grade: 'ಗುಣಮಟ್ಟ', Description: 'ವಿವರಣೆ', 'Save listing': 'ಪಟ್ಟಿ ಉಳಿಸಿ',
  'Account settings': 'ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು', Profile: 'ಪ್ರೊಫೈಲ್', 'Save profile': 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ', 'Change password': 'ಗುಪ್ತಪದ ಬದಲಿಸಿ', 'Your data': 'ನಿಮ್ಮ ಮಾಹಿತಿ', 'Export my data': 'ನನ್ನ ಮಾಹಿತಿಯನ್ನು ರಫ್ತು ಮಾಡಿ',
  'Delete account': 'ಖಾತೆ ಅಳಿಸಿ', 'Confirm with your password': 'ಗುಪ್ತಪದದೊಂದಿಗೆ ದೃಢೀಕರಿಸಿ', 'Type DELETE to confirm': 'ದೃಢೀಕರಿಸಲು DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿ', 'Delete account permanently': 'ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ',
  'Contact support': 'ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ', Subject: 'ವಿಷಯ', Message: 'ಸಂದೇಶ', 'Send message': 'ಸಂದೇಶ ಕಳುಹಿಸಿ', 'Bill records': 'ಬಿಲ್ ದಾಖಲೆಗಳು', 'Bill file': 'ಬಿಲ್ ಫೈಲ್', Vendor: 'ಮಾರಾಟಗಾರ', 'Total amount': 'ಒಟ್ಟು ಮೊತ್ತ',
  'Support contact is not configured yet.': 'ಬೆಂಬಲ ಸಂಪರ್ಕವನ್ನು ಇನ್ನೂ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
  'Local weather': 'ಸ್ಥಳೀಯ ಹವಾಮಾನ', 'Town or district': 'ಪಟ್ಟಣ ಅಥವಾ ಜಿಲ್ಲೆ', 'Get forecast': 'ಮುನ್ನೋಟ ಪಡೆಯಿರಿ', 'Scheme application tracker': 'ಯೋಜನೆ ಅರ್ಜಿ ಅನುಸರಣೆ', 'Scheme name': 'ಯೋಜನೆಯ ಹೆಸರು', 'Official source URL': 'ಅಧಿಕೃತ ಮೂಲ URL', Status: 'ಸ್ಥಿತಿ', Deadline: 'ಕೊನೆಯ ದಿನಾಂಕ', 'Save tracker item': 'ಅನುಸರಣೆ ಅಂಶ ಉಳಿಸಿ',
  'Notifications': 'ಅಧಿಸೂಚನೆಗಳು', 'Farm assistant': 'ಕೃಷಿ ಸಹಾಯಕ', 'Your question': 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ', 'Ask assistant': 'ಸಹಾಯಕರನ್ನು ಕೇಳಿ', 'Dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'My Farm': 'ನನ್ನ ಹೊಲ', 'My Crops': 'ನನ್ನ ಬೆಳೆಗಳು', 'Buy Supplies': 'ಪೂರೈಕೆ ಖರೀದಿ', 'Finance': 'ಹಣಕಾಸು',
  'Name': 'ಹೆಸರು', 'Email changes require support verification.': 'ಇಮೇಲ್ ಬದಲಾವಣೆಗೆ ಬೆಂಬಲ ಪರಿಶೀಲನೆ ಅಗತ್ಯ.', 'Download a JSON copy of your account and farm records.': 'ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಹೊಲದ ದಾಖಲೆಗಳ JSON ಪ್ರತಿಯನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.',
  'This permanently removes your account and personal farm records. Some marketplace records may be retained in anonymized form to preserve other users’ orders.': 'ಇದು ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ವೈಯಕ್ತಿಕ ಹೊಲದ ದಾಖಲೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ. ಇತರರ ಆರ್ಡರ್‌ಗಳನ್ನು ಉಳಿಸಲು ಕೆಲವು ಮಾರುಕಟ್ಟೆ ದಾಖಲೆಗಳನ್ನು ಗುರುತಿಲ್ಲದ ರೂಪದಲ್ಲಿ ಉಳಿಸಬಹುದು.',
  'Send a support request. Please do not include passwords, bank details, or identity documents.': 'ಬೆಂಬಲ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಿ. ಗುಪ್ತಪದ, ಬ್ಯಾಂಕ್ ವಿವರ ಅಥವಾ ಗುರುತಿನ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಬೇಡಿ.',
  'Sending…': 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…', 'Privacy policy': 'ಗೌಪ್ಯತಾ ನೀತಿ',
  'Forecast provided by Open-Meteo. Location is sent to its geocoding service to find the forecast.': 'Open-Meteo ಹವಾಮಾನ ಮುನ್ನೋಟ ಒದಗಿಸುತ್ತದೆ. ಮುನ್ನೋಟ ಹುಡುಕಲು ಸ್ಥಳವನ್ನು ಅದರ ಸ್ಥಳ-ಹುಡುಕಾಟ ಸೇವೆಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.',
  'Loading…': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
  'This is your private checklist, not an official scheme directory or eligibility decision. Add a scheme you have verified at an official source.': 'ಇದು ನಿಮ್ಮ ಖಾಸಗಿ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ; ಅಧಿಕೃತ ಯೋಜನೆಗಳ ಪಟ್ಟಿ ಅಥವಾ ಅರ್ಹತಾ ನಿರ್ಧಾರವಲ್ಲ. ಅಧಿಕೃತ ಮೂಲದಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಯೋಜನೆಯನ್ನು ಸೇರಿಸಿ.',
  'This section is a personal tracker. Information is not independently verified by the application. Add a scheme you have verified at an official source.': 'ಈ ವಿಭಾಗವು ವೈಯಕ್ತಿಕ ಅನುಸರಣೆ ಪಟ್ಟಿ. ಮಾಹಿತಿಯನ್ನು ಅಪ್ಲಿಕೇಶನ್ ಸ್ವತಂತ್ರವಾಗಿ ಪರಿಶೀಲಿಸುವುದಿಲ್ಲ. ಅಧಿಕೃತ ಮೂಲದಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಯೋಜನೆಯನ್ನು ಸೇರಿಸಿ.',
  'Track a scheme': 'ಯೋಜನೆಯನ್ನು ಅನುಸರಿಸಿ', 'Researching': 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ', 'Applied': 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ', 'Waiting': 'ಕಾಯುತ್ತಿದೆ', 'Approved': 'ಅನುಮೋದಿಸಲಾಗಿದೆ', 'Not eligible': 'ಅರ್ಹವಲ್ಲ', 'Notes': 'ಟಿಪ್ಪಣಿಗಳು',
  'PDF, PNG, or JPEG up to 5 MB. Files are private to your account. Bill details are entered manually; no OCR or tax verification is performed.': '5 MB ವರೆಗೆ PDF, PNG ಅಥವಾ JPEG. ಫೈಲ್‌ಗಳು ನಿಮ್ಮ ಖಾತೆಗೆ ಮಾತ್ರ ಲಭ್ಯ. ಬಿಲ್ ವಿವರಗಳನ್ನು ಕೈಯಾರೆ ನಮೂದಿಸಿ; OCR ಅಥವಾ ತೆರಿಗೆ ಪರಿಶೀಲನೆ ಇಲ್ಲ.',
  'Add a bill': 'ಬಿಲ್ ಸೇರಿಸಿ', 'Bill date': 'ಬಿಲ್ ದಿನಾಂಕ', 'Save bill': 'ಬಿಲ್ ಉಳಿಸಿ', 'Uploading…': 'ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
  'Mark read': 'ಓದಿದಂತೆ ಗುರುತಿಸಿ', 'No notifications yet. Updates from your farm records will appear here.': 'ಇನ್ನೂ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ. ನಿಮ್ಮ ಹೊಲದ ದಾಖಲೆಗಳ ನವೀಕರಣಗಳು ಇಲ್ಲಿ ಕಾಣುತ್ತವೆ.',
  'General agricultural information only. Do not enter personal data. Responses are not diagnoses; confirm consequential crop decisions with a qualified local agronomist.': 'ಸಾಮಾನ್ಯ ಕೃಷಿ ಮಾಹಿತಿ ಮಾತ್ರ. ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ನಮೂದಿಸಬೇಡಿ. ಉತ್ತರಗಳು ರೋಗನಿರ್ಣಯವಲ್ಲ; ಮುಖ್ಯ ಬೆಳೆ ನಿರ್ಧಾರಗಳನ್ನು ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.',
  'Thinking…': 'ಯೋಚಿಸಲಾಗುತ್ತಿದೆ…', 'Response': 'ಉತ್ತರ', 'General information only. Confirm advice with a qualified local agronomist.': 'ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ. ಸಲಹೆಯನ್ನು ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.',
  'Delete bill': 'ಬಿಲ್ ಅಳಿಸಿ', 'Amount not entered': 'ಮೊತ್ತ ನಮೂದಿಸಿಲ್ಲ', 'Download file': 'ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ', 'No bills saved. Add a bill above to keep its file with your records.': 'ಯಾವುದೇ ಬಿಲ್ ಉಳಿಸಿಲ್ಲ. ದಾಖಲೆಗಳೊಂದಿಗೆ ಫೈಲ್ ಉಳಿಸಲು ಮೇಲಿನಿಂದ ಬಿಲ್ ಸೇರಿಸಿ.',
  'Describe the crop and the issue without personal identifiers': 'ವೈಯಕ್ತಿಕ ಗುರುತುಗಳಿಲ್ಲದೆ ಬೆಳೆ ಮತ್ತು ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ',
  'Offers from marketers': 'ಮಾರುಕಟ್ಟೆದಾರರಿಂದ ಬಂದ ಆಫರ್‌ಗಳು', 'Offer from': 'ಆಫರ್ ಕಳುಹಿಸಿದವರು', 'Accept': 'ಒಪ್ಪಿಕೊಳ್ಳಿ', 'Reject': 'ತಿರಸ್ಕರಿಸಿ',
  'Offer response saved.': 'ಆಫರ್ ಪ್ರತಿಕ್ರಿಯೆ ಉಳಿಸಲಾಗಿದೆ.', 'No one has made an offer on your listings yet.': 'ನಿಮ್ಮ ಪಟ್ಟಿಗಳಿಗೆ ಇನ್ನೂ ಆಫರ್ ಬಂದಿಲ್ಲ.',
  'Confirm this offer response?': 'ಈ ಆಫರ್‌ಗೆ ಪ್ರತಿಕ್ರಿಯಿಸುವುದನ್ನು ಖಚಿತಪಡಿಸಬೇಕೆ?',
  'pending': 'ಬಾಕಿ ಇದೆ', 'accepted': 'ಒಪ್ಪಿಕೊಳ್ಳಲಾಗಿದೆ', 'rejected': 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ', 'negotiating': 'ಮಾತುಕತೆ ನಡೆಯುತ್ತಿದೆ',
  'Account role': 'ಖಾತೆಯ ಪಾತ್ರ', FARMER: 'ರೈತ', MARKETER: 'ಮಾರುಕಟ್ಟೆದಾರ', ADMIN: 'ನಿರ್ವಾಹಕ',
};
