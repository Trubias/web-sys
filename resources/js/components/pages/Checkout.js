import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import UserLayout from '../user/UserLayout';

// ─── LocationPicker ──────────────────────────────────────────────────────────
// Receives `address` and `city` as explicit props — always reads live
// Delivery Details values. Runs geocoding INTERNALLY on button click.
// Parent receives final lat/lng via onLocationFound(lat, lng).
// NO GPS. NO browser geolocation. NO stale-closure risk.
const LocationPicker = ({ lat, lng, address, city, onDrag, onLocationFound }) => {
    const mapRef    = React.useRef(null);
    const markerRef = React.useRef(null);
    const [findState,    setFindState]    = React.useState('idle');
    const [foundName,    setFoundName]    = React.useState('');
    const [lastQuery,    setLastQuery]    = React.useState('');
    const [notFoundAddr, setNotFoundAddr] = React.useState('');

    // ── Bootstrap Leaflet once ──
    React.useEffect(() => {
        let isMounted = true;

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css'; link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true; document.head.appendChild(script);
        }

        const checkL = setInterval(() => {
            if (window.L && document.getElementById('checkout-map')) {
                clearInterval(checkL);
                if (!isMounted || mapRef.current) return;

                const initLat = lat || 12.8797;
                const initLng = lng || 121.7740;
                const map = window.L.map('checkout-map').setView([initLat, initLng], lat ? 15 : 6);

                const satLayer    = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles © Esri', maxZoom: 19 });
                const streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' });
                satLayer.addTo(map);
                let isSat = true;

                const toggleCtrl = window.L.control({ position: 'topright' });
                toggleCtrl.onAdd = function() {
                    const btn = window.L.DomUtil.create('button', '');
                    btn.type = 'button'; btn.innerHTML = '🗺️ Street View';
                    btn.style.cssText = 'background:#fff;border:2px solid rgba(0,0,0,0.2);border-radius:4px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700;box-shadow:0 1px 5px rgba(0,0,0,0.3);';
                    window.L.DomEvent.on(btn, 'click', function(e) {
                        window.L.DomEvent.stopPropagation(e);
                        if (isSat) { map.removeLayer(satLayer); streetLayer.addTo(map); btn.innerHTML = '🛰️ Satellite View'; isSat = false; }
                        else       { map.removeLayer(streetLayer); satLayer.addTo(map); btn.innerHTML = '🗺️ Street View'; isSat = true; }
                    });
                    return btn;
                };
                toggleCtrl.addTo(map);

                const marker = window.L.marker([initLat, initLng], { draggable: true }).addTo(map);
                marker.on('dragend', function() {
                    const pos = marker.getLatLng();
                    onDrag(pos.lat, pos.lng);
                });

                mapRef.current    = map;
                markerRef.current = marker;
                setTimeout(() => { map.invalidateSize(); }, 200);
            }
        }, 100);

        return () => { isMounted = false; clearInterval(checkL); };
    }, []); // run once

    // ── Move pin whenever lat/lng change (driven by parent) ──
    React.useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;
        if (!lat || !lng) return;
        mapRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
        setTimeout(() => { mapRef.current.invalidateSize(); }, 100);
    }, [lat, lng]);

    const handleFindClick = async () => {
        const currentAddress = (address || '').trim();
        const currentCity    = (city    || '').trim();

        if (!currentAddress && !currentCity) {
            setFindState('notfound');
            setNotFoundAddr('');
            setTimeout(() => setFindState('idle'), 4000);
            return;
        }

        setFindState('loading');
        setFoundName('');
        setLastQuery('');
        setNotFoundAddr('');

        const result = await findLocationByText(currentAddress, currentCity);

        if (!result) {
            setFindState('notfound');
            setNotFoundAddr(currentAddress && currentCity ? `${currentAddress}, ${currentCity}` : currentAddress || currentCity);
            setTimeout(() => setFindState('idle'), 8000);
        } else {
            setLastQuery(result.query || '');
            onLocationFound && onLocationFound(result.lat, result.lng);
            setFoundName(result.name || '');
            setFindState('found');
            setTimeout(() => setFindState('idle'), 8000);
        }
    };

    return (
        <div style={{ marginBottom: '1.5rem', background: '#fff', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem', fontWeight: 700 }}>📍 Delivery Location Map</h3>
            <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.9rem', lineHeight: 1.4 }}>
                Press <strong>Find Location</strong> to pin your delivery address on the map.
                {address && city && <span style={{ color: '#555' }}> Searching for: <em>{address}, {city}</em></span>}
            </p>

            <button
                type="button"
                onClick={handleFindClick}
                disabled={findState === 'loading'}
                style={{
                    marginBottom: '0.75rem', padding: '0.6rem 1.3rem',
                    background: findState === 'found' ? '#f0fdf4' : '#f8f9fa',
                    color:      findState === 'found' ? '#166534' : '#333',
                    border:     findState === 'found' ? '1px solid #86efac' : '1px solid #ddd',
                    borderRadius: '4px', cursor: findState === 'loading' ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem', fontWeight: 700, width: '100%', textAlign: 'center', transition: 'all 0.2s',
                }}
            >
                {findState === 'loading' ? '⏳ Searching...' : findState === 'found' ? '✅ Location Found!' : '🔍 Find Location'}
            </button>

            {findState === 'found' && (
                <div style={{ marginBottom: '0.6rem', padding: '0.6rem 0.9rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', fontWeight: 600, lineHeight: 1.5 }}>
                    ✅ <strong>Location Found!</strong>
                    {foundName && <div style={{ marginTop: '0.2rem', fontSize: '0.75rem', fontWeight: 400, opacity: 0.9 }}>{foundName.split(',').slice(0, 4).join(',')}</div>}
                </div>
            )}
            {findState === 'notfound' && (
                <div style={{ marginBottom: '0.6rem', padding: '0.6rem 0.9rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, lineHeight: 1.5 }}>
                    ❌ {notFoundAddr
                        ? <>Could not find <strong>{notFoundAddr}</strong>. Please check your address spelling.</>
                        : <>Address not found. Please check and try again.</>}
                </div>
            )}

            <div id="checkout-map" style={{ height: '300px', width: '100%', borderRadius: '8px', zIndex: 1, border: '1px solid #ddd' }} />

            <div style={{ marginTop: '0.7rem', fontSize: '0.78rem', color: '#555', fontWeight: 500 }}>
                {lat && lng
                    ? <span>📌 <strong>{Number(lat).toFixed(6)}</strong>, <strong>{Number(lng).toFixed(6)}</strong></span>
                    : <span style={{ color: '#aaa' }}>Press "Find Location" to pin your delivery address.</span>}
            </div>
            {lastQuery && (
                <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#888', fontStyle: 'italic' }}>
                    🔎 Searched: <strong style={{ fontStyle: 'normal', color: '#555' }}>{lastQuery}</strong>
                </div>
            )}
            <input type="hidden" name="latitude"  value={lat  || ''} />
            <input type="hidden" name="longitude" value={lng || ''} />
        </div>
    );
};

// ─── Find Location geocoder ─────────────────────────────────────────────────────
// 3 cascading Nominatim queries. Takes the FIRST result within Philippines
// bounding box. No address-text filtering — avoids false "not found" errors.
// Philippines bounding box: lat 4.5–21.5, lng 116.0–127.0
const PH_BOUNDS = { minLat: 4.5, maxLat: 21.5, minLng: 116.0, maxLng: 127.0 };

const findLocationByText = async (streetAddress, city) => {
    const street = (streetAddress || '').trim();
    const town   = (city          || '').trim();
    if (!street && !town) return null;

    const inPhilippines = (r) => {
        const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
        return lat >= PH_BOUNDS.minLat && lat <= PH_BOUNDS.maxLat &&
               lng >= PH_BOUNDS.minLng && lng <= PH_BOUNDS.maxLng;
    };

    const query = async (url, label) => {
        try {
            const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            const data = await res.json();
            if (!data || data.length === 0) return null;
            const best = data.find(r => inPhilippines(r));
            if (!best) return null;
            return { lat: parseFloat(best.lat), lng: parseFloat(best.lon), name: best.display_name, query: label };
        } catch { return null; }
    };

    // Fix 1a: [ADDRESS] + [CITY] + Philippines — most specific
    if (street && town) {
        const r = await query(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${street} ${town} Philippines`)}&countrycodes=ph&limit=5`,
            `${street} ${town} Philippines`
        );
        if (r) return r;
    }

    // Fix 1b: [ADDRESS] + Philippines — broader
    if (street) {
        const r = await query(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${street} Philippines`)}&countrycodes=ph&limit=5`,
            `${street} Philippines`
        );
        if (r) return r;
    }

    // Fix 1c: [CITY] + Philippines — city-level fallback
    if (town) {
        const r = await query(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${town} Philippines`)}&countrycodes=ph&limit=1`,
            `${town} Philippines`
        );
        if (r) return r;
    }

    return null;
};

// Used ONLY when saving an address to the DB (no Butuan-City-specific validation)
const geocodeByText = async (streetAddress, city) => {
    const street = (streetAddress || '').trim();
    const town   = (city          || '').trim();
    if (!street && !town) return null;
    try {
        const res  = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent([street, town, 'Philippines'].filter(Boolean).join(', '))}`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
            if (lat >= 4.5 && lat <= 21.5 && lng >= 116 && lng <= 127) return { lat, lng };
        }
        return null;
    } catch { return null; }
};


export default function Checkout() {
    const { user, refreshCart, fetchUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [pinWarning, setPinWarning] = useState(false);

    // Saved delivery addresses
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddrId, setSelectedAddrId] = useState(null);
    const [addrMode, setAddrMode] = useState(null); // null | 'add' | 'edit'
    const [editingAddr, setEditingAddr] = useState(null);
    const [addrForm, setAddrForm] = useState({ full_name: '', address: '', city: '', region: 'Luzon', phone: '', is_default: false });
    const [addrSaving, setAddrSaving] = useState(false);

    const passedNote = location.state?.orderNote || '';

    const directPurchase = location.state?.directPurchase || null;

    const [form, setForm] = useState({
        email: '',
        name: '',
        address: '',
        city: '',
        region: 'Luzon',
        phone: '',
        saveInfo: false,
        shippingMethod: 'Standard Delivery',
        paymentMethod: 'Cash on Delivery (COD)',
        selectedBank: '',
        bankAccountName: '',
        bankAccountNumber: '',
        orderNote: passedNote,
        billingMode: 'same',
        billingName: '',
        billingAddress: '',
        billingCity: '',
        billingRegion: 'Luzon',
        billingPhone: '',
        latitude: null,
        longitude: null
    });

    // ── Rule 1: On load, only set Delivery Details text — map pin does NOT auto-move ──
    useEffect(() => {
        if (!user) return;
        axios.get('/api/delivery-addresses').then(res => {
            setSavedAddresses(res.data);
            if (res.data.length > 0) {
                const def = res.data.find(a => a.is_default) || res.data[0];
                setSelectedAddrId(def.id);
                setForm(f => ({
                    ...f,
                    name:      def.full_name,
                    address:   def.address,
                    city:      def.city,
                    region:    normalizeRegion(def.region),
                    phone:     def.phone || f.phone,
                    latitude:  null, // pin does NOT auto-move
                    longitude: null,
                }));
            }
        }).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=/user/checkout');
            return;
        }

        // Pre-fill user data
        setForm(f => ({
            ...f,
            email: user.email || '',
            name: user.name || '',
            address: user.address || '',
            city: user.city || '',
            region: normalizeRegion(user.region),
            phone: user.phone || ''
        }));

        if (directPurchase) {
            setCartItems([{ id: 'direct', product: directPurchase.product, quantity: directPurchase.quantity }]);
            setLoading(false);
        } else {
            axios.get('/api/cart')
                .then(res => {
                    if (res.data.length === 0) {
                        navigate('/user/cart');
                    } else {
                        setCartItems(res.data);
                    }
                })
                .catch(() => setError('Failed to load cart.'))
                .finally(() => setLoading(false));
        }
    }, [user, navigate]);

    const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
    const setAddrVal = (k, v) => setAddrForm(prev => ({ ...prev, [k]: v }));

    const normalizeRegion = (r) => {
        if (!r) return 'Luzon';
        if (['Luzon', 'Visayas', 'Mindanao'].includes(r)) return r;
        return 'Luzon'; // Metro Manila and any legacy value → Luzon
    };

    // ── Rule 1: Switching addresses ONLY updates Delivery Details text — pin does NOT move ──
    const applyAddress = (addr) => {
        setSelectedAddrId(addr.id);
        setForm(f => ({
            ...f,
            name:      addr.full_name,
            address:   addr.address,
            city:      addr.city,
            region:    normalizeRegion(addr.region),
            phone:     addr.phone || f.phone,
            latitude:  null, 
            longitude: null,
        }));
        setPinWarning(false);
    };

    const startAdd = () => {
        setAddrForm({ full_name: form.name, address: '', city: '', region: 'Luzon', phone: form.phone, is_default: false });
        setEditingAddr(null);
        setAddrMode('add');
    };

    const startEdit = (addr) => {
        setAddrForm({ full_name: addr.full_name, address: addr.address, city: addr.city, region: normalizeRegion(addr.region), phone: addr.phone || '', is_default: addr.is_default });
        setEditingAddr(addr);
        setAddrMode('edit');
    };

    // ── Rule 3 (save): Geocode on save, also store coords in DB ──
    const handleSaveAddress = async () => {
        if (!addrForm.full_name.trim() || !addrForm.address.trim() || !addrForm.city.trim()) {
            alert('Full Name, Address, and City are required.');
            return;
        }
        setAddrSaving(true);
        try {
            const coords = await geocodeByText(addrForm.address, addrForm.city);
            const payload = {
                ...addrForm,
                latitude:  coords ? coords.lat : null,
                longitude: coords ? coords.lng : null,
            };

            if (addrMode === 'add') {
                const res = await axios.post('/api/delivery-addresses', payload);
                setSavedAddresses(prev => [...prev, res.data]);
                await applyAddress(res.data);
            } else {
                const res = await axios.put(`/api/delivery-addresses/${editingAddr.id}`, payload);
                setSavedAddresses(prev => prev.map(a => a.id === editingAddr.id ? res.data : a));
                if (selectedAddrId === editingAddr.id) await applyAddress(res.data);
            }
            setAddrMode(null);
            setEditingAddr(null);
        } catch {
            alert('Failed to save address. Please try again.');
        } finally {
            setAddrSaving(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Remove this saved address?')) return;
        try {
            await axios.delete(`/api/delivery-addresses/${id}`);
            setSavedAddresses(prev => prev.filter(a => a.id !== id));
            if (selectedAddrId === id) {
                setSelectedAddrId(null);
            }
        } catch {
            alert('Failed to delete address.');
        }
    };

    const subtotal = cartItems.reduce((acc, i) => acc + (i.product?.price || 0) * i.quantity, 0);
    const shipping = 0; // Free shipping
    const total = subtotal + shipping;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.latitude || !form.longitude) {
            setPinWarning(true);
            setError('Please pin your delivery location on the map before placing your order.');
            setIsSubmitting(false);
            // Scroll to map
            const mapEl = document.getElementById('checkout-map');
            if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);

        if (!form.address || !form.city || !form.name) {
            setError('Please select or add a delivery address before placing your order.');
            setIsSubmitting(false);
            return;
        }

        if (form.paymentMethod === 'Bank Transfer') {
            if (!form.selectedBank || !form.bankAccountName.trim() || !form.bankAccountNumber.trim()) {
                setError('Please select a bank and fill in your account details.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const res = await axios.post('/api/orders', {
                address: form.address,
                city: form.city,
                region: form.region,
                phone: form.phone,
                payment_method: form.paymentMethod,
                order_note: form.orderNote,
                save_info: form.saveInfo,
                direct_purchase: directPurchase ? { product_id: directPurchase.product.id, quantity: directPurchase.quantity } : null,
                billing_mode: form.billingMode,
                billing_name: form.billingMode === 'different' ? form.billingName : null,
                billing_address: form.billingMode === 'different' ? form.billingAddress : null,
                billing_city: form.billingMode === 'different' ? form.billingCity : null,
                billing_region: form.billingMode === 'different' ? form.billingRegion : null,
                billing_phone: form.billingMode === 'different' ? form.billingPhone : null,
                latitude: form.latitude,
                longitude: form.longitude
            });

            try {
                const { notificationStore } = await import('../sharedStore');
                if (res.data && res.data.orders && Array.isArray(res.data.orders)) {
                    res.data.orders.forEach(o => {
                        const mPayment = o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method;
                        notificationStore.add('admin', `New order received! Order #${o.ref || o.id} from ${user?.name || form.name} — ${o.product_name} x${o.quantity} — ₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(o.total_amount)} — Payment: ${mPayment}`);
                    });
                }
            } catch (err2) {
                console.error("Failed to append notification", err2);
            }

            await refreshCart();
            if (form.saveInfo) await fetchUser(); // Update context user if saved
            navigate('/user/orders', { state: { checkoutSuccess: true } });
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to place order. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Checkout...</div>;

    const fmt = n => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n);

    return (
        <UserLayout>
            <div className="mobile-p-2" style={{ flex: 1, padding: '4rem 5rem', maxWidth: '1400px', margin: '0 auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ marginBottom: '2rem', borderBottom: '2px solid #C9A84C', paddingBottom: '1rem' }}>
                    <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#111' }}>
                        <span style={{ color: '#C9A84C' }}>Secure</span> Checkout
                    </h1>
                </div>

                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '4px', marginBottom: '2rem', fontWeight: 600 }}>{error}</div>}

                <div className="mobile-stack" style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* LEFT COLUMN: FORMS */}
                    <form onSubmit={handleSubmit} style={{ flex: '1 1 600px' }}>

                        {/* Contact */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #C9A84C', paddingBottom: '0.5rem', display: 'inline-block', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Contact Information</h2>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Email Address</label>
                                <input type="email" value={form.email} readOnly style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }} />
                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.4rem' }}>Locked to your registered account context.</div>
                            </div>
                        </section>

                        {/* Delivery */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #C9A84C', paddingBottom: '0.5rem', display: 'inline-block', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Delivery Information</h2>

                            {/* ── Saved Address Cards ── */}
                            {savedAddresses.length > 0 && (
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Saved Addresses</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {savedAddresses.map(addr => (
                                            <div key={addr.id}
                                                onClick={() => applyAddress(addr)}
                                                style={{
                                                    border: selectedAddrId === addr.id ? '2px solid #C9A84C' : '1px solid #ddd',
                                                    borderRadius: '8px', padding: '0.85rem 1rem',
                                                    background: selectedAddrId === addr.id ? '#fdfbf6' : '#fff',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.85rem', transition: 'all 0.15s'
                                                }}>
                                                <input type="radio" name="savedAddr" readOnly
                                                    checked={selectedAddrId === addr.id}
                                                    onChange={() => applyAddress(addr)}
                                                    style={{ flexShrink: 0, accentColor: '#C9A84C', width: 16, height: 16 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>{addr.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#555', marginTop: 2 }}>{addr.address}, {addr.city}, {addr.region}</div>
                                                    {addr.phone && <div style={{ fontSize: '0.78rem', color: '#888' }}>{addr.phone}</div>}
                                                    {addr.is_default && <span style={{ fontSize: '0.7rem', background: '#C9A84C', color: '#000', borderRadius: 99, padding: '1px 8px', fontWeight: 700, marginTop: 3, display: 'inline-block' }}>Default</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                                    <button type="button" onClick={e => { e.stopPropagation(); startEdit(addr); }}
                                                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                                                    <button type="button" onClick={e => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                                                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #fecaca', borderRadius: '4px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>Remove</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Add New Address button ── */}
                            {addrMode === null && (
                                <button type="button" onClick={startAdd} style={{
                                    marginBottom: '1.5rem', padding: '0.6rem 1rem',
                                    border: '1.5px dashed #C9A84C', borderRadius: '6px',
                                    background: '#fdfbf6', color: '#7a5c00',
                                    fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer',
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                }}>+ Add New Address</button>
                            )}

                            {/* ── Add / Edit Address inline form ── */}
                            {addrMode !== null && (
                                <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111', marginBottom: '1rem' }}>
                                        {addrMode === 'add' ? '+ New Address' : '✏️ Edit Address'}
                                    </div>

                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Full Name *</label>
                                        <input type="text" value={addrForm.full_name} onChange={e => setAddrVal('full_name', e.target.value)}
                                            style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="Full Name" />
                                    </div>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Address *</label>
                                        <input type="text" value={addrForm.address} onChange={e => setAddrVal('address', e.target.value)}
                                            style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="Street address" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>City *</label>
                                            <input type="text" value={addrForm.city} onChange={e => setAddrVal('city', e.target.value)}
                                                style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Region *</label>
                                            <select value={addrForm.region} onChange={e => setAddrVal('region', e.target.value)}
                                                style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }}>
                                                <option value="Luzon">Luzon</option>
                                                <option value="Visayas">Visayas</option>
                                                <option value="Mindanao">Mindanao</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Phone</label>
                                        <input type="tel" value={addrForm.phone} onChange={e => setAddrVal('phone', e.target.value)}
                                            style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="+63 912 345 6789" />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.83rem', marginBottom: '1rem' }}>
                                        <input type="checkbox" checked={!!addrForm.is_default} onChange={e => setAddrVal('is_default', e.target.checked)} />
                                        Set as default address
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                        <button type="button" disabled={addrSaving} onClick={handleSaveAddress}
                                            style={{ padding: '0.65rem 1.3rem', background: '#000', color: '#C9A84C', fontWeight: 700, border: '1px solid #000', borderRadius: '4px', cursor: addrSaving ? 'not-allowed' : 'pointer', fontSize: '0.83rem' }}>
                                            {addrSaving ? 'Saving...' : addrMode === 'add' ? 'Save Address' : 'Save Changes'}
                                        </button>
                                        <button type="button" onClick={() => { setAddrMode(null); setEditingAddr(null); }}
                                            style={{ padding: '0.65rem 1.1rem', background: '#fff', color: '#555', fontWeight: 600, border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.83rem' }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(savedAddresses.length > 0 || addrMode !== null) && (
                                <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    Delivery details for this order
                                </div>
                            )}

                            {/* Read-only delivery address summary */}
                            {(!form.address && !form.city) ? (
                                <div style={{ padding: '1.2rem', background: '#f8f9fa', border: '1px dashed #ddd', borderRadius: '8px', marginBottom: '1.2rem', textAlign: 'center', color: '#aaa', fontSize: '0.87rem' }}>
                                    No address selected. Choose a saved address above or click <strong style={{ color: '#7a5c00' }}>+ Add New Address</strong>.
                                </div>
                            ) : (
                                <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem 1.2rem', marginBottom: '1.2rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Full Name</div>
                                            <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#111' }}>{form.name || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Phone</div>
                                            <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#111' }}>{form.phone || '—'}</div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Address</div>
                                            <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#111' }}>{form.address || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>City</div>
                                            <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#111' }}>{form.city || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Region</div>
                                            <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#111' }}>{form.region || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Country</div>
                                            <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#111' }}>Philippines</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pinWarning && (
                                <div style={{ marginBottom: '1rem', padding: '0.8rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', color: '#b45309', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    ⚠️ Please pin your delivery location on the map before placing your order.
                                </div>
                            )}

                            <LocationPicker
                                lat={form.latitude}
                                lng={form.longitude}
                                address={form.address}
                                city={form.city}
                                onDrag={(lat, lng) => {
                                    setVal('latitude', lat);
                                    setVal('longitude', lng);
                                    if (pinWarning) setPinWarning(false);
                                }}
                                onLocationFound={(lat, lng) => {
                                    setVal('latitude',  lat);
                                    setVal('longitude', lng);
                                    if (pinWarning) setPinWarning(false);
                                }}
                            />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#333' }}>
                                <input type="checkbox" checked={form.saveInfo} onChange={e => setVal('saveInfo', e.target.checked)} />
                                Save this information for next time
                            </label>
                        </section>

                        {/* Shipping */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #C9A84C', paddingBottom: '0.5rem', display: 'inline-block', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Shipping Method</h2>
                            <div style={{ padding: '1rem', border: '1px solid #C9A84C', background: '#fdfbf6', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                <span>Standard Delivery</span>
                                <span>Free</span>
                            </div>
                        </section>

                        {/* Payment */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #C9A84C', paddingBottom: '0.5rem', display: 'inline-block', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Payment</h2>
                            <div style={{ border: '1px solid #ddd', borderRadius: form.paymentMethod === 'Bank Transfer' ? '4px 4px 0 0' : '4px', overflow: 'hidden' }}>
                                {['GCash', 'Maya', 'Bank Transfer', 'Cash on Delivery (COD)'].map((method, i) => (
                                    <label key={method} style={{ display: 'block', padding: '1rem', borderBottom: i < 3 ? '1px solid #ddd' : 'none', cursor: 'pointer', background: form.paymentMethod === method ? '#fafafa' : '#fff' }}>
                                        <input type="radio" name="paymentMethod" value={method} checked={form.paymentMethod === method} onChange={e => setVal('paymentMethod', e.target.value)} style={{ marginRight: '1rem' }} />
                                        <span style={{ fontWeight: form.paymentMethod === method ? 700 : 500 }}>{method}</span>
                                    </label>
                                ))}
                            </div>
                            {form.paymentMethod === 'Bank Transfer' && (
                                <div style={{ padding: '1.5rem', background: '#fcfcfc', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                                    <div style={{ marginBottom: form.selectedBank ? '1.5rem' : '0' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555', marginBottom: '0.8rem' }}>Select Bank:</div>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {['BDO', 'BPI', 'Metrobank'].map(bank => (
                                                <label key={bank} style={{ padding: '0.8rem 1.2rem', border: form.selectedBank === bank ? '2px solid #C9A84C' : '1px solid #ddd', borderRadius: '4px', background: form.selectedBank === bank ? '#fff9e6' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: form.selectedBank === bank ? 700 : 500 }}>
                                                    <input type="radio" name="selectedBank" value={bank} checked={form.selectedBank === bank} onChange={e => {
                                                        setVal('selectedBank', e.target.value);
                                                        setVal('bankAccountName', '');
                                                        setVal('bankAccountNumber', '');
                                                    }} style={{ display: 'none' }} />
                                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: form.selectedBank === bank ? '4px solid #C9A84C' : '1px solid #ccc', background: '#fff' }}></div>
                                                    {bank}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {form.selectedBank && (
                                        <div style={{ background: '#fff', padding: '1.2rem', border: '1px solid #eee', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div style={{ fontWeight: 800, color: form.selectedBank === 'BPI' ? '#b31217' : form.selectedBank === 'BDO' ? '#00529b' : '#0033a0', marginBottom: '1rem', fontSize: '1.05rem' }}>{form.selectedBank}</div>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Account Name *</label>
                                                <input
                                                    type="text"
                                                    value={form.bankAccountName}
                                                    onChange={e => setVal('bankAccountName', e.target.value)}
                                                    required={form.paymentMethod === 'Bank Transfer' && !!form.selectedBank}
                                                    placeholder="Enter account name"
                                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Account Number *</label>
                                                <input
                                                    type="text"
                                                    value={form.bankAccountNumber}
                                                    onChange={e => setVal('bankAccountNumber', e.target.value)}
                                                    required={form.paymentMethod === 'Bank Transfer' && !!form.selectedBank}
                                                    placeholder="Enter account number"
                                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {form.selectedBank && (
                                        <div style={{ marginTop: '1.2rem', fontSize: '0.85rem', color: '#666', lineHeight: 1.5, padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px', borderLeft: '3px solid #C9A84C' }}>
                                            Please log in to your bank and transfer the total amount to complete your payment.
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Order Note */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid #C9A84C', paddingBottom: '0.5rem', display: 'inline-block', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Order Note (Optional)</h2>
                            <textarea value={form.orderNote} onChange={e => setVal('orderNote', e.target.value)} rows="3" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }} placeholder="Notes about your order..."></textarea>
                        </section>

                        {/* Buttons removed from here; now inside Order Summary card per request */}
                    </form>

                    {/* RIGHT COLUMN: ORDER SUMMARY */}
                    <div style={{ flex: '1 1 400px', background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #eee', position: 'sticky', top: '90px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 400, color: '#111', margin: 0, position: 'relative', display: 'inline-block' }}>
                                Order summary
                                <div style={{ height: '3px', width: '30px', background: '#C9A84C', marginTop: '8px' }}></div>
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {cartItems.map((item, idx) => (
                                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 0', borderBottom: idx === cartItems.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={(item.product?.image || '').startsWith('http') ? item.product.image : `/storage/${item.product?.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111' }}>{item.product?.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{item.product?.brand?.name}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>x{item.quantity}</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>₱{fmt((item.product?.price || 0) * item.quantity)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1.5px solid #000', marginTop: '0.5rem', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: '#666', fontSize: '0.95rem' }}>Subtotal</span>
                                <span style={{ color: '#111', fontWeight: 600 }}>₱{fmt(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: '#666', fontSize: '0.95rem' }}>Shipping</span>
                                <span style={{ color: '#16a34a', fontWeight: 700 }}>Free</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: '#666', fontSize: '0.95rem' }}>Discount</span>
                                <span style={{ color: '#999' }}>—</span>
                            </div>
                            
                            <div style={{ borderTop: '1px solid #eee', margin: '1.5rem 0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>Total</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111' }}>₱{fmt(total)}</span>
                            </div>

                            {/* Trust Badges */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                                {[
                                    { icon: '🛡️', label: 'Secure checkout' },
                                    { icon: '🔄', label: 'Easy returns' },
                                    { icon: '✅', label: 'Authentic items' }
                                ].map((badge, idx) => (
                                    <div key={idx} style={{ flex: 1, background: '#f8f9fa', padding: '0.75rem 0.25rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                                        <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{badge.icon}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.2 }}>{badge.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Buttons moved inside card */}
                            {(!form.latitude || !form.longitude) && (
                                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#b45309', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Pin your delivery location first to continue.
                                </div>
                            )}
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !form.latitude || !form.longitude} 
                                style={{ 
                                    width: '100%', 
                                    padding: '1.1rem', 
                                    background: (!form.latitude || !form.longitude) ? '#9ca3af' : '#16a34a', 
                                    color: '#fff', 
                                    fontWeight: 800, 
                                    textTransform: 'uppercase', 
                                    fontSize: '0.95rem', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: (isSubmitting || !form.latitude || !form.longitude) ? 'not-allowed' : 'pointer', 
                                    marginBottom: '0.75rem', 
                                    transition: 'all 0.2s', 
                                    boxShadow: (!form.latitude || !form.longitude) ? 'none' : '0 4px 6px rgba(22, 163, 74, 0.2)',
                                    opacity: (!form.latitude || !form.longitude) ? 0.7 : 1
                                }}
                                onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                            >
                                {isSubmitting ? 'Processing...' : 'PLACE ORDER'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => navigate('/user/cart')} 
                                disabled={isSubmitting} 
                                style={{ width: '100%', padding: '1rem', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.95rem', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                            >
                                Cancel order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
