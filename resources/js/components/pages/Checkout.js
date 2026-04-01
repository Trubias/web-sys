import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import UserLayout from '../user/UserLayout';

const LocationPicker = ({ lat, lng, address, city, region, country, onChange }) => {
    const mapRef = React.useRef(null);
    const markerRef = React.useRef(null);

    React.useEffect(() => {
        let isMounted = true;
        
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        
        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            document.head.appendChild(script);
        }

        const checkL = setInterval(() => {
            if (window.L && document.getElementById('checkout-map')) {
                clearInterval(checkL);
                if (!isMounted || mapRef.current) return;
                
                const map = window.L.map('checkout-map').setView([12.8797, 121.7740], 6);
                const satLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles courtesy of Esri and the GIS community', maxZoom: 19
                });
                const streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                });
                satLayer.addTo(map);
                let isSat = true;
                const toggleCtrl = window.L.control({ position: 'topright' });
                toggleCtrl.onAdd = function() {
                    const btn = window.L.DomUtil.create('button', '');
                    btn.innerHTML = '🗺️ Street View';
                    btn.style.cssText = 'background:#fff;border:2px solid rgba(0,0,0,0.2);border-radius:4px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700;box-shadow:0 1px 5px rgba(0,0,0,0.3);';
                    window.L.DomEvent.on(btn, 'click', function(e) {
                        window.L.DomEvent.stopPropagation(e);
                        if (isSat) { map.removeLayer(satLayer); streetLayer.addTo(map); btn.innerHTML = '🛰️ Satellite View'; isSat = false; }
                        else { map.removeLayer(streetLayer); satLayer.addTo(map); btn.innerHTML = '🗺️ Street View'; isSat = true; }
                    });
                    return btn;
                };
                toggleCtrl.addTo(map);

                const marker = window.L.marker([12.8797, 121.7740], { draggable: true }).addTo(map);
                marker.on('dragend', function (e) {
                    const pos = marker.getLatLng();
                    onChange(pos.lat, pos.lng);
                });

                mapRef.current = map;
                markerRef.current = marker;

                if (lat && lng) {
                   map.setView([lat, lng], 16);
                   marker.setLatLng([lat, lng]);
                }
                
                setTimeout(() => { map.invalidateSize(); }, 200);
            }
        }, 100);

        return () => { 
            isMounted = false; 
            clearInterval(checkL); 
        };
    }, []);

    // Step 6: Auto track based on exact Address, City, Region, Country
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (!lat && !lng && mapRef.current && markerRef.current) {
                const queries = [];
                // High precision query (Address + City works best without confusing region names)
                if (address && city) queries.push(`${address}, ${city}, ${country || 'Philippines'}`);
                // Fallback query (City only)
                if (city) queries.push(`${city}, ${country || 'Philippines'}`);
                
                if (queries.length === 0) return;
                
                const tryGeocode = async (index) => {
                    if (index >= queries.length || lat || lng) return;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queries[index])}`);
                        const data = await res.json();
                        if (data && data.length > 0 && !lat && !lng) {
                            const newLat = parseFloat(data[0].lat);
                            const newLon = parseFloat(data[0].lon);
                            mapRef.current.setView([newLat, newLon], index === 0 ? 16 : 13);
                            markerRef.current.setLatLng([newLat, newLon]);
                            setTimeout(() => { mapRef.current.invalidateSize(); }, 200);
                            onChange(newLat, newLon);
                        } else {
                            tryGeocode(index + 1);
                        }
                    } catch (err) {
                        tryGeocode(index + 1);
                    }
                };
                
                tryGeocode(0);
            }
        }, 1500); // 1.5s debounce to prevent spamming
        
        return () => clearTimeout(timer);
    }, [address, city, region, country]);

    const handleCurrentLocation = () => {
        const queries = [];
        if (address && city) queries.push(`${address}, ${city}, ${country || 'Philippines'}`);
        if (city) queries.push(`${city}, ${country || 'Philippines'}`);
        
        const tryGeocode = async (index) => {
            // Fallback to GPS if address isn't provided or geocoding failed
            if (index >= queries.length) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        onChange(latitude, longitude);
                        if (mapRef.current && markerRef.current) {
                            mapRef.current.setView([latitude, longitude], 16);
                            markerRef.current.setLatLng([latitude, longitude]);
                            setTimeout(() => { mapRef.current.invalidateSize(); }, 200);
                        }
                    }, (error) => {
                        alert("Unable to find your typed address and GPS access was denied. Please drag the pin manually.");
                    });
                }
                return;
            }
            
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queries[index])}`);
                const data = await res.json();
                if (data && data.length > 0) {
                    const newLat = parseFloat(data[0].lat);
                    const newLon = parseFloat(data[0].lon);
                    if (mapRef.current && markerRef.current) {
                        mapRef.current.setView([newLat, newLon], index === 0 ? 16 : 13);
                        markerRef.current.setLatLng([newLat, newLon]);
                        setTimeout(() => { mapRef.current.invalidateSize(); }, 200);
                        onChange(newLat, newLon);
                    }
                } else {
                    tryGeocode(index + 1);
                }
            } catch (err) {
                tryGeocode(index + 1);
            }
        };
        
        tryGeocode(0);
    };

    return (
        <div style={{ marginBottom: '1.5rem', background: '#fff', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', fontWeight: 700 }}>📍 Pin Your Delivery Location</h3>
            <button type="button" onClick={handleCurrentLocation} style={{ marginBottom: '1rem', padding: '0.6rem 1.2rem', background: '#f8f9fa', color: '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                Use My Current Location
            </button>
            <div id="checkout-map" style={{ height: '300px', width: '100%', borderRadius: '8px', zIndex: 1, border: '1px solid #ddd' }}></div>
            <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#888' }}>
                Latitude: {lat || '___'} | Longitude: {lng || '___'}
            </div>
            <input type="hidden" name="latitude" id="latitude" value={lat || ''} />
            <input type="hidden" name="longitude" id="longitude" value={lng || ''} />
        </div>
    );
};

export default function Checkout() {
    const { user, refreshCart, fetchUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const passedNote = location.state?.orderNote || '';

    const directPurchase = location.state?.directPurchase || null;

    const [form, setForm] = useState({
        email: '',
        name: '',
        address: '',
        city: '',
        region: 'Metro Manila',
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
        billingRegion: 'Metro Manila',
        billingPhone: '',
        latitude: null,
        longitude: null
    });

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
            region: user.region || 'Metro Manila',
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

    const subtotal = cartItems.reduce((acc, i) => acc + (i.product?.price || 0) * i.quantity, 0);
    const shipping = 0; // Free shipping
    const total = subtotal + shipping;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

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
            <div className="mobile-p-2" style={{ flex: 1, padding: '4rem 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Checkout</h1>

                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '4px', marginBottom: '2rem', fontWeight: 600 }}>{error}</div>}

                <div className="mobile-stack" style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* LEFT COLUMN: FORMS */}
                    <form onSubmit={handleSubmit} style={{ flex: '1 1 600px' }}>

                        {/* Contact */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Contact Information</h2>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Email Address</label>
                                <input type="email" value={form.email} readOnly style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }} />
                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.4rem' }}>Locked to your registered account context.</div>
                            </div>
                        </section>

                        {/* Delivery */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Delivery Information</h2>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Country</label>
                                <select disabled style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', background: '#f3f4f6' }}>
                                    <option>Philippines</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Full Name *</label>
                                <input type="text" value={form.name} onChange={e => setVal('name', e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="John Doe" />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Address *</label>
                                <input type="text" value={form.address} onChange={e => setVal('address', e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="Street address" />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>City *</label>
                                    <input type="text" value={form.city} onChange={e => setVal('city', e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Region *</label>
                                    <select value={form.region} onChange={e => setVal('region', e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }}>
                                        <option value="Metro Manila">Metro Manila</option>
                                        <option value="Luzon">Luzon</option>
                                        <option value="Visayas">Visayas</option>
                                        <option value="Mindanao">Mindanao</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Phone *</label>
                                <input type="tel" value={form.phone} onChange={e => setVal('phone', e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="+63 912 345 6789" />
                            </div>

                            <LocationPicker 
                                lat={form.latitude} 
                                lng={form.longitude} 
                                address={form.address}
                                city={form.city}
                                region={form.region}
                                country="Philippines"
                                onChange={(lat, lng) => {
                                    setVal('latitude', lat);
                                    setVal('longitude', lng);
                                }} 
                            />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#333' }}>
                                <input type="checkbox" checked={form.saveInfo} onChange={e => setVal('saveInfo', e.target.checked)} />
                                Save this information for next time
                            </label>
                        </section>

                        {/* Shipping */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Shipping Method</h2>
                            <div style={{ padding: '1rem', border: '1px solid #C9A84C', background: '#fdfbf6', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                <span>Standard Delivery</span>
                                <span>Free</span>
                            </div>
                        </section>

                        {/* Payment */}
                        <section style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Payment</h2>
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
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Order Note (Optional)</h2>
                            <textarea value={form.orderNote} onChange={e => setVal('orderNote', e.target.value)} rows="3" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }} placeholder="Notes about your order..."></textarea>
                        </section>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '1rem', background: '#000', color: '#C9A84C', fontWeight: 800, textTransform: 'uppercase', fontSize: '1.1rem', border: '1px solid #000', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!isSubmitting) e.target.style.background = '#111'; }} onMouseLeave={e => { if (!isSubmitting) e.target.style.background = '#000'; }}>
                                {isSubmitting ? 'Processing...' : 'BUY NOW'}
                            </button>
                            <button type="button" onClick={() => navigate('/user/cart')} disabled={isSubmitting} style={{ flex: 1, padding: '1rem', background: 'red', color: '#fff', fontWeight: 800, textTransform: 'uppercase', fontSize: '1.1rem', border: '1px solid red', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!isSubmitting) e.target.style.background = '#d32f2f'; }} onMouseLeave={e => { if (!isSubmitting) e.target.style.background = 'red'; }}>
                                Cancel
                            </button>
                        </div>
                    </form>

                    {/* RIGHT COLUMN: ORDER SUMMARY */}
                    <div style={{ flex: '1 1 400px', background: '#fafafa', padding: '2rem', borderRadius: '8px', border: '1px solid #eaeaea', position: 'sticky', top: '90px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Order Summary</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px' }}>
                                            <img src={(item.product?.image || '').startsWith('http') ? item.product.image : `/storage/${item.product?.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                        </div>
                                        <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#C9A84C', color: '#000', fontSize: '0.75rem', fontWeight: 800, minWidth: '22px', height: '22px', padding: '0 6px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fafafa' }}>
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{item.product?.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.product?.brand?.name}</div>
                                    </div>
                                    <div style={{ fontWeight: 800 }}>₱{fmt((item.product?.price || 0) * item.quantity)}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #ddd', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', color: '#444' }}>
                                <span>Subtotal</span>
                                <strong>₱{fmt(subtotal)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', color: '#444' }}>
                                <span>Shipping</span>
                                <strong>Free</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #eaeaea', fontSize: '1.3rem', color: '#111' }}>
                                <span>Total</span>
                                <strong>₱{fmt(total)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
