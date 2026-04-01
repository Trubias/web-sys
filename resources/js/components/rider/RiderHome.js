import React, { useState, useEffect } from 'react';
import RiderLayout from './RiderLayout';
import { useAuth } from '../../Context/AuthContext';

const RiderMapModal = ({ order, onClose }) => {
    const mapRef = React.useRef(null);
    const lat = order?.latitude;
    const lng = order?.longitude;

    React.useEffect(() => {
        if (!order || !lat || !lng) return;

        let isMounted = true;
        
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
        }
        if (!document.getElementById('leaflet-routing-css')) {
            const linkR = document.createElement('link'); linkR.id = 'leaflet-routing-css'; linkR.rel = 'stylesheet'; linkR.href = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css'; document.head.appendChild(linkR);
        }

        const loadScripts = async () => {
            if (!window.L) {
                if (!document.getElementById('leaflet-js')) {
                    const script = document.createElement('script'); script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; document.head.appendChild(script);
                }
                while (!window.L) await new Promise(r => setTimeout(r, 100));
            }
            if (!window.L.Routing) {
                if (!document.getElementById('leaflet-routing-js')) {
                    const scriptR = document.createElement('script'); scriptR.id = 'leaflet-routing-js'; scriptR.src = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js'; document.head.appendChild(scriptR);
                }
                while (!window.L.Routing) await new Promise(r => setTimeout(r, 100));
            }

            if (isMounted && !mapRef.current && document.getElementById('rider-map')) {
                const map = window.L.map('rider-map').setView([lat, lng], 16);
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

                const redIcon = new window.L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                window.L.marker([lat, lng], {icon: redIcon}).addTo(map);
                mapRef.current = map;
                
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(pos => {
                        if (!isMounted) return;
                        const riderLat = pos.coords.latitude;
                        const riderLng = pos.coords.longitude;
                        
                        const riderIcon = new window.L.Icon({
                            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
                            iconSize: [36, 36],
                            iconAnchor: [18, 18]
                        });
                        window.L.marker([riderLat, riderLng], {icon: riderIcon}).bindPopup('<b>Your Location</b>').addTo(map);

                        window.L.Routing.control({
                            waypoints: [
                                window.L.latLng(riderLat, riderLng),
                                window.L.latLng(lat, lng)
                            ],
                            lineOptions: { styles: [{ color: '#3498db', weight: 6, opacity: 0.8 }] },
                            show: false,
                            addWaypoints: false,
                            createMarker: function() { return null; }
                        }).addTo(map);
                        
                        const group = new window.L.featureGroup([
                            window.L.marker([riderLat, riderLng]),
                            window.L.marker([lat, lng])
                        ]);
                        map.fitBounds(group.getBounds(), { padding: [40, 40] });

                    }, err => console.log('GPS tracking blocked or unavailable.'));
                }
                
                setTimeout(() => {
                    map.invalidateSize();
                }, 200);
            }
        };
        loadScripts();
        return () => { isMounted = false; };
    }, [order, lat, lng]);

    if (!order) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: '#1a1a1a', borderRadius: 12, width: '100%', maxWidth: 500,
                border: '1px solid #333', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #333' }}>
                    <h3 style={{ margin: 0, color: '#C9A84C', fontWeight: 700, fontSize: '1.1rem' }}>Customer Location</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', display: 'flex' }}>✕</button>
                </div>
                <div style={{ padding: '1.5rem', flex: 1 }}>
                    {lat && lng ? (
                        <>
                            <div id="rider-map" style={{ height: '350px', width: '100%', borderRadius: '8px', zIndex: 1, background: '#222' }}></div>
                            <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" style={{
                                marginTop: '1.5rem', display: 'block', background: '#C9A84C', color: '#000',
                                textAlign: 'center', padding: '0.9rem', borderRadius: '6px', fontWeight: 800, textDecoration: 'none'
                            }}>
                                🧭 Navigate with Google Maps
                            </a>
                        </>
                    ) : (
                        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #333' }}>
                            Customer did not pin a location.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function RiderHome() {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState([]);
    const [availableDeliveries, setAvailableDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [mapTarget, setMapTarget] = useState(null);
    const [toast, setToast] = useState('');

    const showToast = (msg, duration = 3000) => {
        setToast(msg);
        setTimeout(() => setToast(''), duration);
    };

    const fetchDeliveries = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/rider/deliveries');
            if (res.data.available !== undefined) {
                setAvailableDeliveries(res.data.available);
                setDeliveries(res.data.mine);
            } else {
                setDeliveries(res.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const handleAccept = async (order) => {
        try {
            const axios = (await import('axios')).default;
            await axios.put(`/api/rider/deliveries/${order.id}/accept`);
            fetchDeliveries();
            showToast('Delivery accepted!');
            const { notificationStore } = await import('../sharedStore');
            notificationStore.add('admin', `Rider ${user?.name || 'A rider'} accepted delivery for Order #${order.ref || order.id}.`);
        } catch (error) {
            showToast('Failed to accept delivery. Please try again.');
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelTarget) return;
        try {
            const axios = (await import('axios')).default;
            await axios.put(`/api/rider/deliveries/${cancelTarget.id}/cancel`);
            fetchDeliveries();
            showToast('Delivery ignored.');
            const { notificationStore } = await import('../sharedStore');
            notificationStore.add('admin', `Rider ${user?.name || 'A rider'} rejected/ignored broadcast for Order #${cancelTarget.ref || cancelTarget.id}.`);
        } catch (error) {
            showToast('Failed to cancel delivery. Please try again.');
        } finally {
            setCancelTarget(null);
        }
    };

    // Show orders in assigned, accepted, and picked up (out_for_delivery) status
    const pendingDeliveries = deliveries.filter(d => ['assigned', 'accepted', 'out_for_delivery'].includes(d.status));
    const completedToday = deliveries.filter(d => {
        if (d.status !== 'delivered' && d.status !== 'completed') return false;
        const dDate = new Date(d.delivered_at || d.updated_at).toDateString();
        const today = new Date().toDateString();
        return dDate === today;
    });

    const earnings = deliveries.filter(d => d.status === 'delivered' || d.status === 'completed').length * 200;
    
    const fmt = (n) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n);

    return (
        <RiderLayout>
            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
                    background: '#27ae60', color: '#fff', padding: '0.9rem 1.5rem',
                    borderRadius: 10, fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                    {toast}
                </div>
            )}

            {/* Cancel confirm modal */}
            {cancelTarget && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#1a1a1a', borderRadius: 14, width: '90%', maxWidth: 380,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.7)', padding: '1.5rem'
                    }}>
                        <h3 style={{ margin: '0 0 0.8rem', color: '#e74c3c', fontWeight: 700 }}>Ignore Broadcast?</h3>
                        <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                            Are you sure you want to ignore this delivery? It will be removed from your screen.
                        </p>
                        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setCancelTarget(null)} style={{
                                padding: '0.55rem 1.2rem', background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                                color: '#aaa', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem'
                            }}>Keep It</button>
                            <button onClick={handleCancelConfirm} style={{
                                padding: '0.55rem 1.2rem', background: '#e74c3c',
                                border: 'none', borderRadius: 8,
                                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem'
                            }}>Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rider Map Modal */}
            <RiderMapModal order={mapTarget} onClose={() => setMapTarget(null)} />

            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Rider Home</h1>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 4 }}>
                        Welcome back, <strong>{user?.name}</strong> • Base: {user?.city ? user.city + ', ' : ''}{user?.region}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>AVAILABLE BROADCASTS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3498db' }}>{availableDeliveries.length}</div>
                </div>
                <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>COMPLETED TODAY</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#27ae60' }}>{completedToday.length}</div>
                </div>
                <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>TOTAL EARNINGS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#C9A84C' }}>₱{fmt(earnings)}</div>
                </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>Available Broadcasts</h2>
            
            {!loading && availableDeliveries.length === 0 ? (
                <div style={{ color: '#888', padding: '2rem 0', background: '#1a1a1a', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                    No pending broadcasts in your region right now.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    {availableDeliveries.map(o => (
                        <div key={o.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem', border: '1px solid #3498db', boxShadow: '0 4px 12px rgba(52,152,219,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.3rem', fontWeight: 600 }}>Order #{o.ref || o.id}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3498db' }}>
                                        {o.product?.name || o.product_name || 'Product'}
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>₱{fmt(o.total_amount || 0)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginTop: '1.2rem' }}>
                                <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem', fontSize: '1.05rem' }}>{o.user?.name || o.customer_name || 'Customer'}</div>
                                <div style={{ fontSize: '0.95rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                    <span>📍</span> {o.address || o.user?.address || 'No address provided'}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ background: 'rgba(52,152,219,0.15)', color: '#3498db', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        {o.region || o.user?.region || 'Region'}
                                    </span>
                                    <button onClick={() => setMapTarget(o)} style={{ background: '#2c2c2c', color: '#3498db', border: '1px solid #444', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>🗺️ View Location</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button onClick={() => handleAccept(o)} style={{ flex: 1, padding: '0.9rem', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Accept Delivery
                                </button>
                                <button onClick={() => setCancelTarget(o)} style={{ flex: 1, padding: '0.9rem', background: 'transparent', color: '#e74c3c', border: '1px solid currentColor', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> Ignore
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>My Active Deliveries</h2>
            
            {loading ? (
                <div style={{ color: '#888', padding: '2rem 0' }}>Loading deliveries...</div>
            ) : pendingDeliveries.length === 0 ? (
                <div style={{ color: '#888', padding: '2rem 0', background: '#1a1a1a', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    No pending assignments right now.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {pendingDeliveries.map(o => (
                        <div key={o.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.3rem', fontWeight: 600 }}>Order #{o.ref || o.id}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#C9A84C' }}>
                                        {o.product?.name || o.product_name || 'Product'}
                                        {o.brand?.name && <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '8px', fontWeight: 600 }}>— {o.brand?.name}</span>}
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                                    ₱{fmt(o.total_amount || 0)}
                                </div>
                            </div>
                            
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginTop: '1.2rem' }}>
                                <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem', fontSize: '1.05rem' }}>
                                    {o.user?.name || o.customer_name || 'Customer'}
                                </div>
                                {/* Customer contact number */}
                                {(o.user?.phone || o.phone) && (
                                    <div style={{ fontSize: '0.9rem', color: '#C9A84C', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span>📞</span>
                                        <span style={{ fontWeight: 600 }}>{o.user?.phone || o.phone}</span>
                                    </div>
                                )}
                                <div style={{ fontSize: '0.95rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                    <span>📍</span> {o.address || o.user?.address || 'No address provided'}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        {o.region || o.user?.region || 'Region'}
                                    </span>
                                    <button onClick={() => setMapTarget(o)} style={{ background: '#2c2c2c', color: '#C9A84C', border: '1px solid #444', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#3c3c3c'} onMouseLeave={e => e.currentTarget.style.background = '#2c2c2c'}>
                                        🗺️ View Customer Location
                                    </button>
                                </div>
                            </div>

                            {/* Progress Steps */}
                            <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', padding: '0 0.5rem' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3498db', border: '3px solid #1a1a1a', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }}></div>
                                    </div>
                                    <div style={{ position: 'absolute', top: '32px', left: '-10px', fontSize: '0.75rem', color: '#3498db', fontWeight: 700 }}>Assigned</div>
                                    <div style={{ position: 'absolute', top: '11px', left: '24px', right: '0', height: '3px', background: ['accepted', 'out_for_delivery'].includes(o.status) ? '#3498db' : 'rgba(255,255,255,0.1)', zIndex: 1 }}></div>
                                </div>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: ['accepted', 'out_for_delivery'].includes(o.status) ? '#3498db' : 'rgba(255,255,255,0.1)', border: '3px solid #1a1a1a', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {['accepted', 'out_for_delivery'].includes(o.status) && <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }}></div>}
                                    </div>
                                    <div style={{ position: 'absolute', top: '32px', left: '-15px', fontSize: '0.75rem', color: ['accepted', 'out_for_delivery'].includes(o.status) ? '#3498db' : '#666', fontWeight: ['accepted', 'out_for_delivery'].includes(o.status) ? 700 : 600 }}>Picked Up</div>
                                    <div style={{ position: 'absolute', top: '11px', left: '24px', right: '0', height: '3px', background: o.status === 'out_for_delivery' ? '#3498db' : 'rgba(255,255,255,0.1)', zIndex: 1 }}></div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '3px solid #1a1a1a', position: 'relative', zIndex: 2 }}></div>
                                    <div style={{ position: 'absolute', top: '32px', left: '-15px', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Delivered</div>
                                </div>
                            </div>
                            
                            {o.status === 'out_for_delivery' && (
                                <div style={{ marginTop: '2.5rem', padding: '0.8rem', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: '8px', textAlign: 'center', color: '#2ecc71', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Out for delivery. Navigate to My Deliveries to complete it.
                                </div>
                            )}
                            {o.status === 'accepted' && (
                                <div style={{ marginTop: '2.5rem', padding: '0.8rem', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '8px', textAlign: 'center', color: '#3498db', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Accepted. Navigate to My Deliveries to process.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </RiderLayout>
    );
}
