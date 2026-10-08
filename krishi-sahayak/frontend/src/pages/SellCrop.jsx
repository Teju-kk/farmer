import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../services/api';
import { copy, useLocale } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

const initialForm = { cropId: '', cropName: '', variety: '', quantity: '', unit: 'kg', expectedPrice: '', harvestDate: '', location: '', grade: '', description: '' };
const currency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function SellCrop() {
  const [locale] = useLocale(); const text = (value) => copy(value, locale);
  const [crops, setCrops] = useState([]);
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [cropResponse, listingResponse, offerResponse] = await Promise.all([api.get('/crops'), api.get('/listings/mine'), api.get('/farmer/offers')]);
      setCrops(cropResponse.data.data);
      setListings(listingResponse.data.data);
      setOffers(offerResponse.data.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load crop listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function selectCrop(event) {
    const crop = crops.find((item) => item.id === event.target.value);
    setForm((current) => ({ ...current, cropId: crop?.id || '', cropName: crop?.name || current.cropName, variety: crop?.variety || current.variety }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const payload = { ...form, quantity: Number(form.quantity), expectedPrice: Number(form.expectedPrice) };
    if (!payload.cropId) delete payload.cropId;
    if (!payload.harvestDate) delete payload.harvestDate;
    try {
      await api.post('/listings', payload);
      setForm(initialForm);
      setMessage('Your crop listing is saved.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this listing. Check the details and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove this crop listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings((current) => current.filter((item) => item.id !== id));
      setMessage('Listing removed.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove this listing.');
    }
  }

  async function respondToOffer(id, status) {
    if (!window.confirm(text('Confirm this offer response?'))) return;
    setError(''); setMessage('');
    try {
      await api.patch(`/farmer/offers/${id}`, { status });
      setMessage(text('Offer response saved.'));
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your offer response.');
    }
  }

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  return <>
    <div className="module-heading"><h1>{text('Sell crop')}</h1><LanguageToggle/></div>
    <p className="page-intro">{text('Prepare a harvest listing with its quantity, expected price, and location. Listings are visible to your account in this workspace.')}</p>
    {error && <p className="module-message" role="alert">{error}</p>}
    {message && <p className="module-success" role="status">{message}</p>}
    <form className="data-form listing-form" onSubmit={submit}>
      <h2>{text('Create a crop listing')}</h2>
      {crops.length > 0 && <label>{text('Use a crop record')} <span className="optional-label">{text('Optional')}</span><select value={form.cropId} onChange={selectCrop}><option value="">{text('Enter crop details manually')}</option>{crops.map((crop) => <option value={crop.id} key={crop.id}>{crop.name}{crop.variety ? ` · ${crop.variety}` : ''}</option>)}</select></label>}
      <label>{text('Crop name')}<input value={form.cropName} onChange={update('cropName')} minLength="2" maxLength="100" required/></label>
      <label>{text('Variety')} <span className="optional-label">{text('Optional')}</span><input value={form.variety} onChange={update('variety')} maxLength="100"/></label>
      <label>{text('Quantity')}<input type="number" min="0.01" step="0.01" value={form.quantity} onChange={update('quantity')} required/></label>
      <label>{text('Unit')}<select value={form.unit} onChange={update('unit')}><option value="kg">{text('Kilograms')}</option><option value="quintal">{text('Quintals')}</option><option value="tonne">{text('Tonnes')}</option><option value="box">{text('Boxes')}</option></select></label>
      <label>{text('Expected price (₹ per unit)')}<input type="number" min="0.01" step="0.01" value={form.expectedPrice} onChange={update('expectedPrice')} required/></label>
      <label>{text('Location')}<input value={form.location} onChange={update('location')} minLength="2" maxLength="160" autoComplete="address-level2" required/></label>
      <label>{text('Harvest date')} <span className="optional-label">{text('Optional')}</span><input type="date" value={form.harvestDate} onChange={update('harvestDate')}/></label>
      <label>{text('Grade')} <span className="optional-label">{text('Optional')}</span><input value={form.grade} onChange={update('grade')} maxLength="30"/></label>
      <label className="wide-field">{text('Description')} <span className="optional-label">{text('Optional')}</span><textarea value={form.description} onChange={update('description')} maxLength="1000" rows="3"/></label>
      <button className="primary-button" disabled={busy}>{busy ? text('Saving…') : text('Save listing')}</button>
    </form>
    <section className="listing-results"><h2>{text('Your listings')}</h2>{loading ? <p className="loading-inline" role="status">{text('Loading listings…')}</p> : listings.length ? <div className="data-list">{listings.map((listing) => <article key={listing.id}><b>{listing.cropName}{listing.variety ? ` · ${listing.variety}` : ''}</b><button className="icon-button remove-listing" aria-label={`${text('Remove')} ${listing.cropName} ${text('listing')}`} title={text('Remove listing')} onClick={() => remove(listing.id)}><Trash2 size={17}/></button><span>{Number(listing.quantity).toLocaleString(locale === 'kn' ? 'kn-IN' : 'en-IN')} {text(listing.unit)} · {listing.location}</span><small>{currency(listing.expectedPrice)} {text('per')} {text(listing.unit)} · {text(listing.status.toLowerCase())}</small></article>)}</div> : <div className="empty-state"><p>{text('No listings yet. Add a harvest above when you’re ready.')}</p></div>}</section>
    <section className="listing-results farmer-offers"><h2>{text('Offers from marketers')}</h2>{loading ? <p className="loading-inline" role="status">{text('Loading…')}</p> : offers.length ? <div className="data-list">{offers.map((offer) => <article key={offer.id}><b>{offer.listing.cropName}{offer.listing.variety ? ` · ${offer.listing.variety}` : ''}</b><span>{text('Offer from')} {offer.buyer.name}{offer.buyer.marketerProfile?.organization ? ` · ${offer.buyer.marketerProfile.organization}` : ''}</span><span>{Number(offer.quantity).toLocaleString(locale === 'kn' ? 'kn-IN' : 'en-IN')} {text(offer.listing.unit)} · {currency(offer.price)} {text('per')} {text(offer.listing.unit)}</span>{offer.message && <small>{offer.message}</small>}<small>{text(offer.status.toLowerCase())}</small>{offer.status === 'PENDING' && <div className="offer-response-actions"><button className="primary-button compact-button" onClick={() => respondToOffer(offer.id, 'ACCEPTED')}>{text('Accept')}</button><button className="text-action" onClick={() => respondToOffer(offer.id, 'REJECTED')}>{text('Reject')}</button></div>}</article>)}</div> : <div className="empty-state"><p>{text('No one has made an offer on your listings yet.')}</p></div>}</section>
  </>;
}
