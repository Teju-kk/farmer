import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, X } from 'lucide-react';
import { t, useLocale } from '../i18n';

export default function RoleShell({ user, onLogout, title, subtitle, navigation, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useLocale();
  const location = useLocation();
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'KS';

  return <div className="app-shell role-app-shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark"><Leaf size={22}/></span><span><strong>{t('app.name', locale)}</strong><small>{title}</small></span><button className="icon-button close" onClick={() => setMenuOpen(false)} aria-label={t('rbac.closeMenu', locale)}><X/></button></div>
      <nav aria-label={t('rbac.primaryNavigation', locale)}>{navigation.map(([to, label, Icon]) => {
        const active = location.pathname === to || (to !== '/admin' && to !== '/farmer' && to !== '/marketer' && location.pathname.startsWith(`${to}/`));
        return <Link to={to} key={to} onClick={() => setMenuOpen(false)} className={active ? 'active' : ''}><Icon size={19}/>{t(label, locale)}</Link>;
      })}</nav>
      <div className="sidebar-foot">
        <Link className="account-link" to="/account" onClick={() => setMenuOpen(false)}>{t('nav.account', locale)}</Link>
        <button className="language" onClick={() => setLocale(locale === 'en' ? 'kn' : 'en')} aria-label={t('rbac.changeLanguage', locale)}>{locale === 'en' ? 'ಕನ್ನಡ' : 'English'}</button>
        <div className="farmer-mini"><span>{initials}</span><div><b>{user?.name}</b><small>{user?.email}</small></div></div>
      </div>
    </aside>
    <main className="main-content role-main">
      <header className="topbar"><button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label={t('rbac.openMenu', locale)}><Menu/></button><div className="welcome"><p>{title}</p><small>{subtitle}</small></div><div className="top-actions"><button className="sign-out-button" onClick={onLogout}>{t('rbac.logout', locale)}</button><span className="avatar" aria-hidden="true">{initials}</span></div></header>
      <div className="role-content">{children}</div>
    </main>
    <nav className="bottom-nav" aria-label={t('rbac.quickNavigation', locale)}>{navigation.slice(0, 4).map(([to, label, Icon]) => <Link to={to} className={location.pathname === to ? 'active' : ''} key={to}><Icon size={20}/><span>{t(label, locale)}</span></Link>)}</nav>
  </div>;
}
