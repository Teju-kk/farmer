import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Leaf, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { copy, useLocale } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

export default function Login({ onLogin, adminOnly = false }) {
  const [params] = useSearchParams();
  const [locale] = useLocale();
  const text = (value) => copy(value, locale);
  const [mode, setMode] = useState(!adminOnly && params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { email: form.email.trim().toLowerCase(), password: form.password };
      if (register) {
        payload.name = form.name.trim();
        if (form.phone.trim()) payload.phone = form.phone.trim();
      }
      const { data } = await api.post(register ? '/auth/register' : '/auth/login', payload);
      const authenticatedUser = data.data.user;
      if (adminOnly && authenticatedUser.role !== 'ADMIN') {
        setError(text('This account does not have administrator access. Use the standard sign-in page.'));
        return;
      }
      if (!adminOnly && authenticatedUser.role === 'ADMIN') {
        setError(text('Administrator accounts must use the administrator sign-in page.'));
        return;
      }
      localStorage.setItem('krishi_token', data.data.token);
      onLogin(authenticatedUser);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reach the service. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  return <main className="login-page"><form className={`login-card${adminOnly ? ' admin-login-card' : ''}`} onSubmit={submit}>
    <div className="public-form-tools"><Link to="/" className="login-brand"><span className="brand-mark"><Leaf/></span><span>Krishi Sahayak</span></Link><LanguageToggle/></div>
    <h1>{text(adminOnly ? 'Administrator sign in' : register ? 'Create your farmer account' : 'Welcome back')}</h1>
    <p>{text(adminOnly ? 'Sign in to manage the Krishi Sahayak platform.' : register ? 'Keep your farm, crop, and finance records together.' : 'Sign in to open your farm workspace.')}</p>
    {adminOnly ? <div className="admin-access-note" role="note"><ShieldCheck size={18}/><span>{text('Authorized administrators only. Admin accounts are created by the platform administrator.')}</span></div> : <div className="auth-toggle" role="group" aria-label={text('Account access')}><button type="button" className={!register ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>{text('Sign in')}</button><button type="button" className={register ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>{text('Create account')}</button></div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    {register && <label>{text('Full name')}<input autoComplete="name" value={form.name} onChange={update('name')} minLength="2" maxLength="100" required/></label>}
    <label>{text('Email')}<input autoComplete="email" value={form.email} type="email" onChange={update('email')} maxLength="254" required/></label>
    {register && <label>{text('Phone')} <span className="optional-label">{text('Optional')}</span><input autoComplete="tel" value={form.phone} type="tel" onChange={update('phone')} minLength="8" maxLength="20"/></label>}
    <label>{text('Password')}<input autoComplete={register ? 'new-password' : 'current-password'} value={form.password} type="password" onChange={update('password')} minLength={register ? 8 : 1} maxLength="128" required/>{register && <small className="field-hint">{text('Use at least 8 characters.')}</small>}</label>
    <button className="primary-button" disabled={busy}>{busy ? (register ? 'Creating account…' : 'Signing in…') : text(register ? 'Create account' : 'Sign in')}</button>
    {!register && <Link className="forgot-link" to="/password/forgot">{text('Forgot password?')}</Link>}
    {!adminOnly && !register && <Link className="admin-login-link" to="/admin/login">{text('Administrator sign in')}</Link>}
    {adminOnly && <Link className="admin-login-link" to="/login">{text('Back to standard sign in')}</Link>}
    {!adminOnly && <small className="auth-footnote">{text('By continuing, you agree to use farm records responsibly.')} <Link to="/privacy">{text('Privacy details')}</Link>.</small>}
  </form></main>;
}
