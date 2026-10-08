import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, ShoppingCart, Trash2 } from 'lucide-react';
import api from '../services/api';
import SellCrop from './SellCrop';
import { copy, useLocale } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

const labels = { 'my-farm': 'My Farm', 'my-crops': 'My Crops', finance: 'Finance', 'buy-supplies': 'Buy supplies', 'sell-crop': 'Sell crop', bills: 'Bills', schemes: 'Government schemes', weather: 'Weather', 'ask-ai': 'AI assistant', notifications: 'Notifications' };
const localDate = () => { const date = new Date(); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 10); };
const today = localDate();
const Message = ({ children, success = false }) => <p className={success ? 'module-success' : 'module-message'} role={success ? 'status' : 'alert'}>{children}</p>;
const amount = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function FarmPage() {
  const [locale] = useLocale(); const text = (value) => copy(value, locale);
  const [farms, setFarms] = useState([]);
  const [form, setForm] = useState({ name: '', area: '', areaUnit: 'acres', district: '', state: 'Karnataka' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { const response = await api.get('/farms'); setFarms(response.data.data); setError(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load farms. Check your connection and try again.'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function submit(event) { event.preventDefault(); setError(''); setMessage(''); try { await api.post('/farms', { ...form, area: Number(form.area) }); setForm({ name: '', area: '', areaUnit: 'acres', district: '', state: 'Karnataka' }); setMessage('Farm saved.'); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not save this farm. Check the details and try again.'); } }
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return <><div className="module-heading"><h1>{text('My Farm')}</h1><LanguageToggle/></div><form className="data-form" onSubmit={submit}><h2><Plus size={18}/> {text('Add a farm')}</h2><label>{text('Farm name')}<input value={form.name} onChange={update('name')} minLength="2" maxLength="100" required/></label><label>{text('Area')}<input type="number" min="0.1" step="0.1" value={form.area} onChange={update('area')} required/></label><label>{text('Unit')}<select value={form.areaUnit} onChange={update('areaUnit')}><option>acres</option><option>hectares</option></select></label><label>{text('District')} <span className="optional-label">{text('Optional')}</span><input value={form.district} onChange={update('district')} maxLength="200"/></label><button className="primary-button"><Save size={16}/> {text('Save farm')}</button></form>{error && <Message>{error}</Message>}{message && <Message success>{text(message)}</Message>}{loading ? <p className="loading-inline" role="status">{text('Loading farms…')}</p> : farms.length ? <div className="data-list">{farms.map((farm) => <article key={farm.id}><b>{farm.name}</b><span>{farm.area} {farm.areaUnit} · {farm.district || text('Location not set')}</span><small>{farm.crops.length} {text('crop(s)')}</small></article>)}</div> : <div className="empty-state"><p>{text('No farms recorded yet. Add your first farm above.')}</p></div>}</>;
}

function CropPage() {
  const [locale] = useLocale(); const text = (value) => copy(value, locale);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState({ name: '', variety: '', farmId: '', area: '', sowingDate: today, status: 'SOWN' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { const [farmResponse, cropResponse] = await Promise.all([api.get('/farms'), api.get('/crops')]); setFarms(farmResponse.data.data); setCrops(cropResponse.data.data); setError(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load crops. Check your connection and try again.'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function submit(event) { event.preventDefault(); setError(''); setMessage(''); try { await api.post('/crops', { ...form, area: Number(form.area), sowingDate: new Date(`${form.sowingDate}T12:00:00`).toISOString() }); setMessage('Crop saved.'); setForm((current) => ({ ...current, name: '', variety: '', area: '' })); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not save this crop. Add a farm first and check the details.'); } }
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return <><div className="module-heading"><h1>{text('My Crops')}</h1><LanguageToggle/></div>{farms.length === 0 && !loading && <Message>{text('Add a farm before recording crops.')}</Message>}<form className="data-form" onSubmit={submit}><h2><Plus size={18}/> {text('Add a crop')}</h2><label>{text('Crop name')}<input value={form.name} onChange={update('name')} minLength="2" maxLength="100" required/></label><label>{text('Variety')} <span className="optional-label">{text('Optional')}</span><input value={form.variety} onChange={update('variety')} maxLength="200"/></label><label>{text('Farm')}<select value={form.farmId} onChange={update('farmId')} required><option value="">{text('Select farm')}</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label><label>{text('Area')}<input type="number" min="0.1" step="0.1" value={form.area} onChange={update('area')} required/></label><label>{text('Sowing date')}<input type="date" value={form.sowingDate} onChange={update('sowingDate')} required/></label><button className="primary-button" disabled={!farms.length}><Save size={16}/> {text('Save crop')}</button></form>{error && <Message>{error}</Message>}{message && <Message success>{text(message)}</Message>}{loading ? <p className="loading-inline" role="status">{text('Loading crops…')}</p> : crops.length ? <div className="data-list">{crops.map((crop) => <article key={crop.id}><b>{crop.name}{crop.variety ? ` · ${crop.variety}` : ''}</b><span>{crop.farm.name} · {crop.area} {crop.farm.areaUnit}</span><small className="status active-status">{text(crop.status.replaceAll('_', ' '))}</small></article>)}</div> : <div className="empty-state"><p>{text('No crops recorded yet. Add one to start tracking a season.')}</p></div>}</>;
}

function FinancePage() {
  const [locale] = useLocale(); const text = (value) => copy(value, locale);
  const [kind, setKind] = useState('expense');
  const [form, setForm] = useState({ source: 'Crop sale', category: 'Fertilizer', amount: '', date: today, description: '' });
  const [records, setRecords] = useState({ income: [], expenses: [], summary: { totalIncome: 0, totalExpenses: 0, netProfit: 0 } });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { const [income, expenses, summary] = await Promise.all([api.get('/income'), api.get('/expenses'), api.get('/finance/summary')]); setRecords({ income: income.data.data, expenses: expenses.data.data, summary: summary.data.data }); setError(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load finance records. Check your connection and try again.'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function submit(event) { event.preventDefault(); setError(''); setMessage(''); const data = { amount: Number(form.amount), date: new Date(`${form.date}T12:00:00`).toISOString(), description: form.description }; if (kind === 'income') data.source = form.source; else data.category = form.category; try { await api.post(kind === 'income' ? '/income' : '/expenses', data); setForm((current) => ({ ...current, amount: '', description: '' })); setMessage(`${kind === 'income' ? 'Income' : 'Expense'} saved.`); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not save this record. Check the details and try again.'); } }
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const currentRecords = kind === 'income' ? records.income : records.expenses;
  return <><div className="module-heading"><h1>{text('Finance')}</h1><LanguageToggle/></div><section className="finance-summary" aria-label={text('Finance summary')}><div><small>{text('Income')}</small><b>{amount(records.summary.totalIncome)}</b></div><div><small>{text('Expenses')}</small><b>{amount(records.summary.totalExpenses)}</b></div><div><small>{text('Net balance')}</small><b>{amount(records.summary.netProfit)}</b></div></section><form className="data-form" onSubmit={submit}><h2>{text('Record a transaction')}</h2><div className="toggle" role="group" aria-label={text('Transaction type')}><button type="button" aria-pressed={kind === 'expense'} className={kind === 'expense' ? 'selected' : ''} onClick={() => setKind('expense')}>{text('Expense')}</button><button type="button" aria-pressed={kind === 'income'} className={kind === 'income' ? 'selected' : ''} onClick={() => setKind('income')}>{text('Income')}</button></div><label>{text(kind === 'income' ? 'Source' : 'Category')}<input value={kind === 'income' ? form.source : form.category} onChange={update(kind === 'income' ? 'source' : 'category')} minLength="2" maxLength="100" required/></label><label>{text('Amount (₹)')}<input type="number" min="0.01" step="0.01" value={form.amount} onChange={update('amount')} required/></label><label>{text('Date')}<input type="date" value={form.date} onChange={update('date')} required/></label><label>{text('Note')} <span className="optional-label">{text('Optional')}</span><input value={form.description} onChange={update('description')} maxLength="1000"/></label><button className="primary-button"><Save size={16}/> {text('Save record')}</button></form>{error && <Message>{error}</Message>}{message && <Message success>{text(message)}</Message>}<section className="finance-history"><h2>{text(kind === 'income' ? 'Recent income records' : 'Recent expense records')}</h2>{loading ? <p className="loading-inline" role="status">{text('Loading finance records…')}</p> : currentRecords.length ? <div className="data-list">{currentRecords.slice(0, 12).map((record) => <article key={record.id}><b>{kind === 'income' ? record.source : record.category}</b><span>{new Date(record.date).toLocaleDateString(locale === 'kn' ? 'kn-IN' : 'en-IN')} {record.description ? `· ${record.description}` : ''}</span><small>{amount(record.amount)}</small></article>)}</div> : <div className="empty-state"><p>{text(kind === 'income' ? 'No income records yet. Add the first one above.' : 'No expense records yet. Add the first one above.')}</p></div>}</section></>;
}

function BuyPage() {
  const [locale] = useLocale(); const text = (value) => copy(value, locale);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingProductId, setRemovingProductId] = useState('');
  async function load(nextFilters = filters) { setLoading(true); try { const [productResponse, categoryResponse, cartResponse] = await Promise.all([api.get('/products', { params: nextFilters }), api.get('/categories'), api.get('/cart')]); setProducts(productResponse.data.data); setCategories(categoryResponse.data.data); setCart(cartResponse.data.data.items); setError(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load the marketplace. Check your connection and try again.'); } finally { setLoading(false); } }
  useEffect(() => { load({ search: '', category: '' }); }, []);
  async function add(productId) { setError(''); setMessage(''); try { const { data } = await api.post('/cart/items', { productId, quantity: 1 }); setCart(data.data.items); setMessage('Added to cart.'); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not add product.'); } }
  async function remove(productId) { setError(''); setMessage(''); setRemovingProductId(productId); try { const { data } = await api.delete(`/cart/items/${encodeURIComponent(productId)}`); setCart(data.data.items); setMessage('Removed from cart.'); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not remove product.'); } finally { setRemovingProductId(''); } }
  async function checkout() { setError(''); setMessage(''); try { const { data } = await api.post('/orders/checkout'); setCart([]); setMessage(`Order ${data.data.orderNumber} created. Payment is not collected in this demo.`); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not create order.'); } }
  const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  function search(event) { event.preventDefault(); const next = { ...filters, search: searchInput.trim() }; setFilters(next); load(next); }
  function filterCategory(event) { const next = { ...filters, category: event.target.value }; setFilters(next); load(next); }
  return <><div className="module-heading"><h1>{text('Buy supplies')}</h1><LanguageToggle/></div><Message>{text('Products are seeded demo data; stock and pricing are not live offers.')}</Message>{error && <Message>{error}</Message>}{message && <Message success>{text(message)}</Message>}<form className="catalog-filters" onSubmit={search}><label>{text('Search products')}<input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={text('Seeds, fertilizer…')}/></label><label>{text('Category')}<select value={filters.category} onChange={filterCategory}><option value="">{text('All categories')}</option>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label><button className="primary-button">{text('Search')}</button></form><div className="shop-layout"><div className="product-list">{loading ? <p className="loading-inline" role="status">{text('Loading products…')}</p> : products.length ? products.map((product) => <article key={product.id} className="product-card"><small>{text(product.category.name)}</small><b>{text(product.name)}</b><span>{text(product.description || '')}</span><strong>{amount(product.price)} / {text(product.unit)}</strong><small>{product.stock} {text('in demo stock')}</small><button className="primary-button" disabled={product.stock < 1} onClick={() => add(product.id)}>{text('Add one to cart')}</button></article>) : <div className="empty-state"><p>{text('No products match those filters. Try a different search.')}</p></div>}</div><aside className="cart-card"><h2><ShoppingCart size={18}/> {text('Cart')} ({cart.length})</h2>{cart.length === 0 ? <p>{text('Your cart is empty.')}</p> : cart.map((item) => <div className="cart-line" key={item.id}><p>{text(item.product.name)} × {item.quantity}<b>{amount(Number(item.product.price) * item.quantity)}</b></p><button type="button" className="icon-button" aria-label={`${text('Remove')} ${text(item.product.name)} ${text('from cart')}`} title={text('Remove from cart')} disabled={removingProductId === item.productId} onClick={() => remove(item.productId)}><Trash2 size={16}/></button></div>)}<strong>{text('Total')}: {amount(total)}</strong><button className="primary-button" disabled={!cart.length} onClick={checkout}>{text('Create order')}</button></aside></div></>;
}

function ComingSoon({ title }) { return <><h1>{title}</h1><Message>This workflow is not connected yet. No live {title.toLowerCase()} information is shown here.</Message></>; }

export default function ShellPage({ section }) {
  const knownSections = ['my-farm', 'my-crops', 'finance', 'buy-supplies', 'sell-crop', 'bills', 'schemes', 'weather', 'ask-ai', 'notifications'];
  if (!knownSections.includes(section)) return <Navigate to="/not-found" replace/>;
  return <main className="module-page"><Link className="back-link" to="/"><ArrowLeft size={17}/> Dashboard</Link>{section === 'my-farm' ? <FarmPage/> : section === 'my-crops' ? <CropPage/> : section === 'finance' ? <FinancePage/> : section === 'buy-supplies' ? <BuyPage/> : section === 'sell-crop' ? <SellCrop/> : <ComingSoon title={labels[section] || section.replaceAll('-', ' ')}/>}</main>;
}
