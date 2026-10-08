import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BarChart3, Bell, CircleUserRound, ClipboardList, LayoutDashboard, Leaf, Search, Shield, Users } from 'lucide-react';
import RoleShell from '../components/RoleShell';
import api from '../services/api';
import { t, useLocale } from '../i18n';

const navigation = [
  ['/admin', 'rbac.dashboard', LayoutDashboard],
  ['/admin/users', 'rbac.users', Users],
  ['/admin/farmers', 'rbac.farmers', Leaf],
  ['/admin/marketers', 'rbac.marketers', CircleUserRound],
  ['/admin/reports', 'rbac.reports', BarChart3],
  ['/notifications', 'nav.notifications', Bell],
];
const initialSummary = { totalUsers: 0, activeUsers: 0, farmers: 0, marketers: 0, admins: 0, farms: 0, crops: 0, activeListings: 0, pendingOffers: 0, openSupport: 0 };

export default function AdminDashboard({ user, onLogout }) {
  const [locale] = useLocale();
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'dashboard';
  const fixedRole = section === 'farmers' ? 'FARMER' : section === 'marketers' ? 'MARKETER' : undefined;
  const [summary, setSummary] = useState(initialSummary);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterRole, setFilterRole] = useState(fixedRole || '');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [roleEdits, setRoleEdits] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [marketerForm, setMarketerForm] = useState({ name: '', email: '', phone: '', organization: '', marketLocation: '' });

  const title = t(section === 'users' || fixedRole ? 'rbac.users' : section === 'reports' ? 'rbac.reports' : 'rbac.adminDashboard', locale);
  const effectiveRole = fixedRole ?? filterRole;
  const userListSection = section === 'users' || section === 'farmers' || section === 'marketers';

  async function loadSummary() {
    try { setSummary((await api.get('/admin/overview')).data.data); setOverviewError(''); }
    catch (requestError) { setOverviewError(requestError.response?.data?.message || t('rbac.loadError', locale)); }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const params = { page, ...(effectiveRole && { role: effectiveRole }), ...(query && { search: query }) };
      const result = (await api.get('/admin/users', { params })).data.data;
      setUsers(result.users);
      setTotal(result.total);
      setError('');
    } catch (requestError) { setError(requestError.response?.data?.message || t('rbac.loadError', locale)); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { setPage(1); }, [effectiveRole, query]);
  useEffect(() => { if (userListSection) loadUsers(); }, [page, effectiveRole, query, userListSection]);

  const metrics = useMemo(() => [
    ['rbac.totalUsers', summary.totalUsers, Users],
    ['rbac.farmers', summary.farmers, Leaf],
    ['rbac.marketers', summary.marketers, CircleUserRound],
    ['rbac.activeListings', summary.activeListings, ClipboardList],
    ['rbac.pendingOffers', summary.pendingOffers, Activity],
    ['rbac.activeUsers', summary.activeUsers, Shield],
  ], [summary]);

  async function submitMarketer(event) {
    event.preventDefault();
    setBusyId('create'); setError(''); setNotice('');
    try {
      const response = await api.post('/admin/marketers', marketerForm);
      setNotice(response.data.data.invitationSent ? t('rbac.marketerInvited', locale) : t('rbac.marketerCreatedNoEmail', locale));
      setMarketerForm({ name: '', email: '', phone: '', organization: '', marketLocation: '' });
      setCreateOpen(false);
      await Promise.all([loadUsers(), loadSummary()]);
    } catch (requestError) { setError(requestError.response?.data?.message || t('rbac.saveError', locale)); }
    finally { setBusyId(''); }
  }

  async function changeUser(id, changes) {
    setBusyId(id); setError(''); setNotice('');
    try {
      await api.patch(`/admin/users/${id}`, changes);
      setNotice(t('rbac.userUpdated', locale));
      if (selectedUser?.id === id) setSelectedUser(null);
      await Promise.all([loadUsers(), loadSummary()]);
    } catch (requestError) { setError(requestError.response?.data?.message || t('rbac.saveError', locale)); }
    finally { setBusyId(''); }
  }

  async function showDetails(id) {
    setSelectedUser(null); setBusyId(id); setError('');
    try { setSelectedUser((await api.get(`/admin/users/${id}`)).data.data); }
    catch (requestError) { setError(requestError.response?.data?.message || t('rbac.loadError', locale)); }
    finally { setBusyId(''); }
  }

  return <RoleShell user={user} onLogout={onLogout} title={t('rbac.adminDashboard', locale)} subtitle={t('rbac.adminSubtitle', locale)} navigation={navigation}>
    <section className="role-page-heading"><div><span className="section-kicker">{t('rbac.platformOverview', locale)}</span><h1>{title}</h1></div>{section === 'marketers' && <button className="primary-button compact-button" onClick={() => setCreateOpen((open) => !open)}>{createOpen ? t('rbac.cancel', locale) : t('rbac.createMarketer', locale)}</button>}</section>
    {(error || overviewError) && <p className="form-error role-message" role="alert">{error || overviewError}</p>}
    {notice && <p className="module-success role-message" role="status">{notice}</p>}
    <section className="role-metrics" aria-label={t('rbac.platformStatistics', locale)}>{metrics.map(([label, value, Icon]) => <article className="role-metric" key={label}><span><Icon size={19}/></span><div><small>{t(label, locale)}</small><strong>{Number(value).toLocaleString(locale === 'kn' ? 'kn-IN' : 'en-IN')}</strong></div></article>)}</section>
    {(section === 'dashboard' || section === 'reports') && <section className="role-panel admin-summary-panel"><div className="card-head"><div><span className="section-kicker">{t('rbac.activitySummary', locale)}</span><h2>{t('rbac.platformActivity', locale)}</h2></div><Link to="/admin/users">{t('rbac.manageUsers', locale)}</Link></div><div className="activity-summary-grid"><p><b>{summary.farms}</b><span>{t('rbac.farmsTracked', locale)}</span></p><p><b>{summary.crops}</b><span>{t('rbac.cropsTracked', locale)}</span></p><p><b>{summary.openSupport}</b><span>{t('rbac.openSupport', locale)}</span></p></div><p className="role-footnote">{t('rbac.adminPrivateDataNote', locale)}</p></section>}
    {section !== 'dashboard' && section !== 'reports' && <section className="role-panel admin-users-panel">
      <div className="role-toolbar"><form className="role-search" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()); setPage(1); }}><label className="sr-only" htmlFor="admin-user-search">{t('rbac.searchUsers', locale)}</label><Search size={17}/><input id="admin-user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('rbac.searchUsers', locale)}/><button type="submit">{t('rbac.search', locale)}</button></form>{!fixedRole && <label className="role-filter">{t('rbac.filterByRole', locale)}<select value={filterRole} onChange={(event) => setFilterRole(event.target.value)}><option value="">{t('rbac.allRoles', locale)}</option><option value="FARMER">{t('rbac.farmers', locale)}</option><option value="MARKETER">{t('rbac.marketers', locale)}</option><option value="ADMIN">{t('rbac.administrators', locale)}</option></select></label>}</div>
      {createOpen && <form className="role-create-form" onSubmit={submitMarketer}><h2>{t('rbac.createMarketer', locale)}</h2><p>{t('rbac.marketerInviteHelp', locale)}</p><div className="role-form-grid"><label>{t('rbac.fullName', locale)}<input required minLength="2" maxLength="100" value={marketerForm.name} onChange={(event) => setMarketerForm((current) => ({ ...current, name: event.target.value }))}/></label><label>{t('rbac.email', locale)}<input required type="email" maxLength="254" value={marketerForm.email} onChange={(event) => setMarketerForm((current) => ({ ...current, email: event.target.value }))}/></label><label>{t('rbac.phone', locale)}<input type="tel" minLength="8" maxLength="20" value={marketerForm.phone} onChange={(event) => setMarketerForm((current) => ({ ...current, phone: event.target.value }))}/></label><label>{t('rbac.organization', locale)}<input maxLength="120" value={marketerForm.organization} onChange={(event) => setMarketerForm((current) => ({ ...current, organization: event.target.value }))}/></label><label>{t('rbac.marketLocation', locale)}<input maxLength="160" value={marketerForm.marketLocation} onChange={(event) => setMarketerForm((current) => ({ ...current, marketLocation: event.target.value }))}/></label></div><button className="primary-button" disabled={busyId === 'create'}>{busyId === 'create' ? t('rbac.creating', locale) : t('rbac.createAndInvite', locale)}</button></form>}
      {loading ? <p className="loading-inline" role="status">{t('rbac.loadingUsers', locale)}</p> : users.length ? <div className="role-user-list">{users.map((item) => <article className="role-user-row" key={item.id}>
        <div className="role-user-identity"><b>{item.name}</b><span>{item.email}</span><small>{item.phone || t('rbac.noPhone', locale)}</small></div>
        <span className={`role-badge role-${item.role.toLowerCase()}`}>{t(`rbac.role.${item.role}`, locale)}</span>
        <span className={item.isActive ? 'role-state active' : 'role-state inactive'}>{item.isActive ? t('rbac.active', locale) : t('rbac.inactive', locale)}</span>
        <div className="role-row-actions"><button className="text-action" onClick={() => showDetails(item.id)} disabled={busyId === item.id}>{t('rbac.details', locale)}</button>{item.role !== 'ADMIN' && <><select aria-label={`${t('rbac.changeRole', locale)} ${item.name}`} value={roleEdits[item.id] ?? item.role} onChange={(event) => setRoleEdits((current) => ({ ...current, [item.id]: event.target.value }))}><option value="FARMER">{t('rbac.role.FARMER', locale)}</option><option value="MARKETER">{t('rbac.role.MARKETER', locale)}</option></select><button className="text-action" disabled={busyId === item.id || (roleEdits[item.id] ?? item.role) === item.role} onClick={() => changeUser(item.id, { role: roleEdits[item.id] })}>{t('rbac.saveRole', locale)}</button></> }<button className="text-action" disabled={busyId === item.id} onClick={() => { if (window.confirm(t(item.isActive ? 'rbac.confirmDeactivate' : 'rbac.confirmActivate', locale))) changeUser(item.id, { isActive: !item.isActive }); }}>{item.isActive ? t('rbac.deactivate', locale) : t('rbac.activate', locale)}</button></div>
      </article>)}</div> : <div className="empty-state"><p>{t('rbac.noUsers', locale)}</p></div>}
      <div className="role-pagination"><span>{t('rbac.usersCount', locale)}: {total}</span><div><button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>{t('rbac.previous', locale)}</button><span>{page}</span><button disabled={page * 50 >= total || loading} onClick={() => setPage((current) => current + 1)}>{t('rbac.next', locale)}</button></div></div>
    </section>}
    {selectedUser && <section className="role-panel role-user-detail"><div className="card-head"><div><span className="section-kicker">{t('rbac.userDetails', locale)}</span><h2>{selectedUser.name}</h2></div><button className="icon-button" onClick={() => setSelectedUser(null)} aria-label={t('rbac.closeDetails', locale)}>×</button></div><p>{selectedUser.email} · {t(`rbac.role.${selectedUser.role}`, locale)}</p><div className="detail-counts"><span>{t('rbac.farmsTracked', locale)} <b>{selectedUser._count.farms}</b></span><span>{t('rbac.cropsTracked', locale)} <b>{selectedUser._count.crops}</b></span><span>{t('rbac.privateBills', locale)} <b>{selectedUser._count.bills}</b></span><span>{t('rbac.cropListings', locale)} <b>{selectedUser._count.cropListings}</b></span><span>{t('rbac.marketOffers', locale)} <b>{selectedUser._count.buyerOffers}</b></span></div></section>}
  </RoleShell>;
}
