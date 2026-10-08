import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Banknote, Bell, CloudSun, Home, IndianRupee, Leaf, Menu, ShoppingBasket, Sprout, Tractor, TrendingUp, X } from 'lucide-react';
import { t, useLocale } from '../i18n';
import api from '../services/api';

const nav = [['/farmer', 'nav.dashboard', Home], ['/my-farm', 'nav.myFarm', Tractor], ['/my-crops', 'nav.myCrops', Sprout], ['/buy-supplies', 'nav.buy', ShoppingBasket], ['/sell-crop', 'nav.sell', TrendingUp], ['/finance', 'nav.finance', IndianRupee], ['/bills', 'nav.bills', Banknote], ['/schemes', 'nav.schemes', Leaf], ['/weather', 'nav.weather', CloudSun], ['/ask-ai', 'nav.ai', Sprout], ['/notifications', 'nav.notifications', Bell]];
const emptyStats = { totalIncome: 0, totalExpenses: 0, netProfit: 0 };
const currency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function EmptyState({ children, to, action }) {
  return <div className="empty-state"><p>{children}</p>{to && <Link to={to}>{action}</Link>}</div>;
}

export default function Dashboard({ user, onLogout }) {
  const [menu, setMenu] = useState(false);
  const [locale, setLocale] = useLocale();
  const [data, setData] = useState({ farms: [], crops: [], listings: [], finance: emptyStats });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const activeCrops = data.crops.filter((crop) => !['HARVESTED', 'SOLD'].includes(crop.status));
  const activities = useMemo(() => data.crops.flatMap((crop) => (crop.activities || []).map((activity) => ({ ...activity, cropName: crop.name })))
    .filter((activity) => activity.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3), [data.crops]);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get('/farms'), api.get('/crops'), api.get('/finance/summary'), api.get('/listings/mine')])
      .then(([farms, crops, finance, listings]) => {
        if (mounted) setData({ farms: farms.data.data, crops: crops.data.data, finance: finance.data.data, listings: listings.data.data });
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.response?.data?.message || 'We could not load your farm details. Check your connection and try again.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const changeLocale = () => setLocale(locale === 'en' ? 'kn' : 'en');
  const firstName = user?.name?.trim().split(/\s+/)[0] || t('app.name', locale);
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'KS';

  return <div className="app-shell">
    <aside className={menu ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark"><Leaf size={22}/></span><span><strong>{t('app.name', locale)}</strong><small>{t('app.tagline', locale)}</small></span><button className="icon-button close" onClick={() => setMenu(false)} aria-label="Close menu"><X/></button></div>
      <nav aria-label="Main navigation">{nav.map(([to, key, Icon]) => <Link to={to} key={key} onClick={() => setMenu(false)} className={location.pathname === to ? 'active' : ''}><Icon size={19}/>{t(key, locale)}</Link>)}</nav>
      <div className="sidebar-foot"><Link className="account-link" to="/account">{t('nav.account', locale)}</Link><button className="language" onClick={changeLocale} aria-label="Change language">ಅ / A&nbsp; {locale === 'en' ? 'ಕನ್ನಡ' : 'English'}</button><div className="farmer-mini"><span>{initials}</span><div><b>{user?.name}</b><small>{user?.email}</small></div></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-only" onClick={() => setMenu(true)} aria-label="Open menu"><Menu/></button><div className="welcome"><p>{t('dashboard.greeting', locale)}, {firstName}</p><small>{t('dashboard.subtitle', locale)}</small></div><div className="top-actions"><button className="sign-out-button" onClick={onLogout}>Sign out</button><span className="avatar" aria-hidden="true">{initials}</span></div></header>
      {error && <div className="form-error dashboard-error" role="alert">{error}<button onClick={() => window.location.reload()}>Retry</button></div>}
      {loading ? <div className="dashboard-loading" role="status">Loading your farm workspace…</div> : <>
        <section className="overview" aria-label="Farm overview">
          <article className="weather-panel weather-unavailable"><div className="weather-copy"><span className="eyebrow"><CloudSun size={16}/> Weather</span><strong>Local forecast</strong><p>Search current conditions and a five-day forecast.</p><Link to="/weather">Check forecast</Link></div><div className="sun-orbit" aria-hidden="true"><span className="sun">☀</span><i/></div></article>
          <article className="crop-health"><div><span className="eyebrow"><Leaf size={16}/> Your farm</span><strong>{data.farms.length} {data.farms.length === 1 ? 'farm' : 'farms'}</strong><p>{activeCrops.length} active {activeCrops.length === 1 ? 'crop' : 'crops'}</p></div><div className="health-ring farm-count"><b>{data.crops.length}</b><small>crops</small></div><Link to="/my-farm">Manage farms →</Link></article>
        </section>
        <section className="quick-section"><div className="section-heading"><div><span className="section-kicker">YOUR NEXT STEP</span><h2>{t('dashboard.quickActions', locale)}</h2></div></div><div className="quick-actions">{[['my-farm','Add a farm',Tractor],['my-crops','Add a crop',Sprout],['finance','Record money',Banknote],['sell-crop','List a harvest',TrendingUp],['buy-supplies','Shop supplies',ShoppingBasket]].map(([to,label,Icon])=><Link to={`/${to}`} key={to}><span><Icon size={20}/></span>{label}</Link>)}</div></section>
        <section className="dashboard-grid">
          <article className="card timeline-card"><div className="card-head"><div><span className="section-kicker">CROP RECORDS</span><h2>{t('dashboard.activities', locale)}</h2></div><Link to="/my-crops">View crops</Link></div>{activities.length ? <div className="timeline">{activities.map((activity) => { const due = new Date(activity.dueDate); return <div className="activity" key={activity.id}><time><b>{due.toLocaleDateString(locale === 'kn' ? 'kn-IN' : 'en-IN', { day: '2-digit' })}</b><span>{due.toLocaleDateString(locale === 'kn' ? 'kn-IN' : 'en-IN', { month: 'short' })}</span></time><div className="path-dot"/><div className="activity-copy"><strong>{activity.title}</strong><span>{activity.cropName}</span></div><em className={due < new Date() ? 'urgent' : 'normal'}>{due < new Date() ? 'Overdue' : 'Planned'}</em></div>; })}</div> : <EmptyState to="/my-crops" action="Add a crop">Your crop activities will appear here when you add them.</EmptyState>}</article>
          <article className="card finance-card"><div className="card-head"><div><span className="section-kicker">FROM YOUR RECORDS</span><h2>{t('dashboard.finance', locale)}</h2></div><Link to="/finance">Details</Link></div><div className="money-list">{[['Income', data.finance.totalIncome, TrendingUp, 'income'], ['Expenses', data.finance.totalExpenses, IndianRupee, 'expense'], ['Net balance', data.finance.netProfit, Leaf, 'profit']].map(([label, amount, Icon, kind]) => <div className="money-row" key={label}><span className={`money-icon ${kind}`}><Icon size={18}/></span><div><small>{label}</small><strong>{currency(amount)}</strong><em>All recorded entries</em></div></div>)}</div></article>
          <article className="card listing-card"><div className="card-head"><div><span className="section-kicker">MARKETPLACE</span><h2>{t('dashboard.listings', locale)}</h2></div><Link to="/sell-crop">Manage</Link></div>{data.listings.length ? data.listings.slice(0, 3).map((listing) => <div className="listing" key={listing.id}><span className="crop-thumb tomato"><Leaf size={17}/></span><div><strong>{listing.cropName}{listing.variety ? ` · ${listing.variety}` : ''}</strong><small>{Number(listing.quantity).toLocaleString()} {listing.unit} · {listing.location}</small></div><b>{currency(listing.expectedPrice)}/{listing.unit}</b><span className="status active-status">{listing.status.toLowerCase()}</span></div>) : <EmptyState to="/sell-crop" action="Create a listing">You have no crop listings yet.</EmptyState>}</article>
          <article className="card getting-started"><div className="card-head"><div><span className="section-kicker">SET UP YOUR WORKSPACE</span><h2>Start with the basics</h2></div></div><p>Add a farm and crop to make your records useful.</p><div className="setup-links"><Link to="/my-farm">{data.farms.length ? 'Farm added' : 'Add your first farm'} <span>{data.farms.length ? '✓' : '→'}</span></Link><Link to="/my-crops">{data.crops.length ? 'Crop added' : 'Add your first crop'} <span>{data.crops.length ? '✓' : '→'}</span></Link></div></article>
        </section>
      </>}
    </main>
    <nav className="bottom-nav" aria-label="Quick navigation">{nav.slice(0, 5).map(([to, key, Icon]) => <Link to={to} className={location.pathname === to ? 'active' : ''} key={key}><Icon size={20}/><span>{t(key, locale).replace(' Supplies', '')}</span></Link>)}</nav>
  </div>;
}
