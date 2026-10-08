import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import api from './services/api';
import Dashboard from './pages/Dashboard';
import ShellPage from './pages/ShellPage';
import Login from './pages/Login';
import Landing from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';
import MarketerDashboard from './pages/MarketerDashboard';
import { AboutPage, AccountPage, AssistantPage, BillsPage, ContactPage, ForgotPasswordPage, NotificationsPage, PrivacyPage, ResetPasswordPage, SchemesPage, TermsPage, WeatherPage } from './pages/ConnectedPages';
import { copy, t, useLocale } from './i18n';

function NotFound() {
  return <main className="not-found"><Leaf size={32}/><h1>Page not found</h1><p>The page may have moved or the address may be incorrect.</p><Link className="primary-button" to="/">Go to Krishi Sahayak</Link></main>;
}

function AccessDenied({ user }) {
  const [locale] = useLocale();
  const home = user?.role === 'ADMIN' ? '/admin' : user?.role === 'MARKETER' ? '/marketer' : '/farmer';
  return <main className="not-found access-denied"><Leaf size={32}/><h1>{t('rbac.accessDenied', locale)}</h1><p>{t('rbac.accessDeniedMessage', locale)}</p><Link className="primary-button" to={home}>{t('rbac.returnToWorkspace', locale)}</Link>{user?.role !== 'ADMIN' && <Link className="admin-login-link" to="/admin/login">{copy('Administrator sign in', locale)}</Link>}</main>;
}

function RoleRoute({ user, roles, children }) {
  const location = useLocation();
  if (!user) return <Navigate to={roles.includes('ADMIN') ? '/admin/login' : '/login'} replace state={{ from: location.pathname }}/>;
  if (!roles.includes(user.role)) return <AccessDenied user={user}/>;
  return children;
}

function Home({ user }) {
  if (!user) return <Landing/>;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace/>;
  if (user.role === 'MARKETER') return <Navigate to="/marketer" replace/>;
  return <Navigate to="/farmer" replace/>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('krishi_token')));

  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem('krishi_token');
      setUser(null);
    };
    window.addEventListener('krishi:unauthorized', onUnauthorized);
    return () => window.removeEventListener('krishi:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    if (!checking) return;
    api.get('/auth/me').then(({ data }) => setUser(data.data.user)).catch(() => {
      localStorage.removeItem('krishi_token');
      setUser(null);
    }).finally(() => setChecking(false));
  }, []);

  if (checking) return <main className="app-loading" role="status">Loading your workspace…</main>;
  const logout = () => { localStorage.removeItem('krishi_token'); setUser(null); };
  const farmerOnly = (element) => <RoleRoute user={user} roles={['FARMER']}>{element}</RoleRoute>;
  const adminOnly = (element) => <RoleRoute user={user} roles={['ADMIN']}>{element}</RoleRoute>;
  const marketerOnly = (element) => <RoleRoute user={user} roles={['MARKETER']}>{element}</RoleRoute>;
  const authenticated = (element) => user ? element : <Navigate to="/login" replace/>;

  return <Routes>
    <Route path="/" element={<Home user={user}/>}/>
    <Route path="/login" element={user ? <Home user={user}/> : <Login onLogin={setUser}/>}/>
    <Route path="/admin/login" element={user?.role === 'ADMIN' ? <Navigate to="/admin" replace/> : <Login adminOnly onLogin={setUser}/>}/>
    <Route path="/privacy" element={<PrivacyPage/>}/>
    <Route path="/terms" element={<TermsPage/>}/>
    <Route path="/about" element={<AboutPage/>}/>
    <Route path="/contact" element={<ContactPage/>}/>
    <Route path="/password/forgot" element={<ForgotPasswordPage/>}/>
    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
    <Route path="/account" element={authenticated(<AccountPage user={user} onLogout={logout} onUserUpdate={setUser}/>)}/>
    <Route path="/notifications" element={authenticated(<NotificationsPage/>)}/>
    <Route path="/farmer" element={farmerOnly(<Dashboard user={user} onLogout={logout}/>)}/>
    <Route path="/my-farm" element={farmerOnly(<ShellPage section="my-farm"/>)}/>
    <Route path="/my-crops" element={farmerOnly(<ShellPage section="my-crops"/>)}/>
    <Route path="/finance" element={farmerOnly(<ShellPage section="finance"/>)}/>
    <Route path="/buy-supplies" element={farmerOnly(<ShellPage section="buy-supplies"/>)}/>
    <Route path="/sell-crop" element={farmerOnly(<ShellPage section="sell-crop"/>)}/>
    <Route path="/bills" element={farmerOnly(<BillsPage/>)}/>
    <Route path="/schemes" element={farmerOnly(<SchemesPage/>)}/>
    <Route path="/weather" element={farmerOnly(<WeatherPage/>)}/>
    <Route path="/ask-ai" element={farmerOnly(<AssistantPage/>)}/>
    <Route path="/admin" element={adminOnly(<AdminDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/admin/users" element={adminOnly(<AdminDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/admin/farmers" element={adminOnly(<AdminDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/admin/marketers" element={adminOnly(<AdminDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/admin/reports" element={adminOnly(<AdminDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/marketer" element={marketerOnly(<MarketerDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/marketer/market" element={marketerOnly(<MarketerDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/marketer/responses" element={marketerOnly(<MarketerDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/marketer/profile" element={marketerOnly(<MarketerDashboard user={user} onLogout={logout}/>)}/>
    <Route path="/403" element={user ? <AccessDenied user={user}/> : <Navigate to="/login" replace/>}/>
    <Route path="/not-found" element={<NotFound/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes>;
}
