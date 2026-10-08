import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, ClipboardList, LayoutDashboard, Store, UserRound } from 'lucide-react';
import RoleShell from '../components/RoleShell';
import api from '../services/api';
import { t, useLocale } from '../i18n';

const navigation = [
  ['/marketer', 'rbac.dashboard', LayoutDashboard],
  ['/marketer/market', 'rbac.market', Store],
  ['/marketer/responses', 'rbac.responses', ClipboardList],
  ['/marketer/profile', 'rbac.profile', UserRound],
  ['/notifications', 'nav.notifications', Bell],
];
const currency = (value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const offerForm = { quantity: '', price: '', message: '' };

export default function MarketerDashboard({ user, onLogout }) {
  const [locale] = useLocale();
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'dashboard';
  const [summary, setSummary] = useState({ activeListings: 0, offers: 0, pendingOffers: 0 });
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [profile, setProfile] = useState({ organization: '', marketLocation: '', businessType: '', bio: '' });
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const text = (key) => t(key, locale);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all([
        api.get('/marketer/summary'),
        section === 'market' ? api.get('/marketer/listings') : Promise.resolve(null),
        section === 'responses' ? api.get('/marketer/offers') : Promise.resolve(null),
        section === 'profile' ? api.get('/marketer/profile') : Promise.resolve(null),
      ]);
      setSummary(results[0].data.data);
      if (results[1]) setListings(results[1].data.data);
      if (results[2]) setOffers(results[2].data.data);
      if (results[3]) setProfile(results[3].data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || text('rbac.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [section]);

  async function sendOffer(event, listing) {
    event.preventDefault();
    const form = forms[listing.id] || offerForm;
    setBusy(true); setError(''); setNotice('');
    try {
      await api.post(`/marketer/listings/${listing.id}/offers`, {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
      });
      setForms((current) => ({ ...current, [listing.id]: offerForm }));
      setNotice(text('rbac.offerSent'));
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || text('rbac.saveError'));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.patch('/marketer/profile', profile);
      setProfile(data.data);
      setNotice(text('rbac.profileSaved'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || text('rbac.saveError'));
    } finally {
      setBusy(false);
    }
  }

  const title = section === 'market' ? text('rbac.market') : section === 'responses' ? text('rbac.responses') : section === 'profile' ? text('rbac.profile') : text('rbac.marketerDashboard');

  return <RoleShell user={user} onLogout={onLogout} title={text('rbac.marketerDashboard')} subtitle={text('rbac.marketerSubtitle')} navigation={navigation}>
    <section className="role-page-heading"><div><span className="section-kicker">{text('rbac.marketerStats')}</span><h1>{title}</h1></div></section>
    {error && <p className="form-error role-message" role="alert">{error}</p>}
    {notice && <p className="module-success role-message" role="status">{notice}</p>}
    {loading ? <p className="loading-inline" role="status">{text('rbac.loading')}</p> : <>
      {section !== 'profile' && <section className="role-metrics marketer-metrics" aria-label={text('rbac.marketerStats')}>
        {[[text('rbac.availableListings'), summary.activeListings], [text('rbac.offersSent'), summary.offers], [text('rbac.pendingOffers'), summary.pendingOffers]].map(([label, value], index) => {
          const Icon = [Store, ClipboardList, Bell][index];
          return <article className="role-metric" key={label}><span><Icon size={19}/></span><div><small>{label}</small><strong>{Number(value).toLocaleString(locale === 'kn' ? 'kn-IN' : 'en-IN')}</strong></div></article>;
        })}
      </section>}
      {section === 'market' && <section className="market-listings">
        <p className="role-footnote" role="note">{text('rbac.noPrivateFarmerData')}</p>
        {listings.length ? listings.map((listing) => {
          const form = forms[listing.id] || offerForm;
          return <article className="role-panel market-listing" key={listing.id}>
            <div className="card-head"><div><span className="section-kicker">{listing.location}</span><h2>{listing.cropName}{listing.variety ? ` · ${listing.variety}` : ''}</h2></div><span className="role-badge role-farmer">{text('rbac.active')}</span></div>
            <div className="listing-facts"><span>{text('rbac.listedQuantity')}: <b>{Number(listing.quantity).toLocaleString()} {listing.unit}</b></span><span>{text('rbac.expectedPrice')}: <b>{currency(listing.expectedPrice)} / {listing.unit}</b></span>{listing.grade && <span>{text('rbac.grade')}: <b>{listing.grade}</b></span>}{listing.harvestDate && <span>{text('rbac.harvestDate')}: <b>{new Date(listing.harvestDate).toLocaleDateString()}</b></span>}</div>
            {listing.description && <p>{listing.description}</p>}
            <form className="role-offer-form" onSubmit={(event) => sendOffer(event, listing)}>
              <label>{text('rbac.offerQuantity')}<input required type="number" min="0.01" max={Number(listing.quantity)} step="0.01" value={form.quantity} onChange={(event) => setForms((current) => ({ ...current, [listing.id]: { ...form, quantity: event.target.value } }))}/></label>
              <label>{text('rbac.offerPrice')}<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForms((current) => ({ ...current, [listing.id]: { ...form, price: event.target.value } }))}/></label>
              <label>{text('rbac.message')} <span className="optional-label">{locale === 'kn' ? 'ಐಚ್ಛಿಕ' : 'Optional'}</span><input maxLength="1000" value={form.message} onChange={(event) => setForms((current) => ({ ...current, [listing.id]: { ...form, message: event.target.value } }))}/></label>
              <button className="primary-button" disabled={busy}>{text('rbac.sendOffer')}</button>
            </form>
          </article>;
        }) : <div className="empty-state"><p>{text('rbac.noListings')}</p></div>}
      </section>}
      {section === 'responses' && (offers.length ? <div className="role-offer-list">{offers.map((offer) => <article className="role-panel" key={offer.id}>
        <div className="card-head"><div><span className="section-kicker">{offer.listing.location}</span><h2>{offer.listing.cropName}{offer.listing.variety ? ` · ${offer.listing.variety}` : ''}</h2></div><span className={`role-badge role-${offer.status.toLowerCase()}`}>{text(`rbac.${offer.status.toLowerCase()}`)}</span></div>
        <p>{text('rbac.quantity')}: <b>{Number(offer.quantity).toLocaleString()} {offer.listing.unit}</b> · {text('rbac.price')}: <b>{currency(offer.price)} / {offer.listing.unit}</b></p>
        {offer.message && <p>{offer.message}</p>}
        <small>{text('rbac.offerStatus')}: {text(`rbac.${offer.status.toLowerCase()}`)}</small>
      </article>)}</div> : <div className="empty-state"><p>{text('rbac.noOffers')}</p></div>)}
      {section === 'profile' && <form className="role-panel role-profile-form" onSubmit={saveProfile}><p>{text('rbac.marketProfileIntro')}</p><label>{text('rbac.organization')}<input maxLength="120" value={profile.organization || ''} onChange={(event) => setProfile((current) => ({ ...current, organization: event.target.value }))}/></label><label>{text('rbac.marketLocation')}<input maxLength="160" value={profile.marketLocation || ''} onChange={(event) => setProfile((current) => ({ ...current, marketLocation: event.target.value }))}/></label><label>{text('rbac.businessType')}<input maxLength="100" value={profile.businessType || ''} onChange={(event) => setProfile((current) => ({ ...current, businessType: event.target.value }))}/></label><label>{text('rbac.bio')}<textarea rows="4" maxLength="600" value={profile.bio || ''} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}/></label><button className="primary-button" disabled={busy}>{text('rbac.saveProfile')}</button></form>}
      {section === 'dashboard' && <section className="role-panel marketer-home"><Store size={25}/><div><h2>{text('rbac.market')}</h2><p>{text('rbac.marketIntro')}</p><Link className="primary-button compact-button" to="/marketer/market">{text('rbac.market')}</Link></div></section>}
    </>}
  </RoleShell>;
}
