import React, { useState, useEffect, useRef } from 'react';
import RiderLayout from './RiderLayout';
import { useAuth } from '../../Context/AuthContext';

const DeliveriesMapModal = ({ order, onClose }) => {
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

            if (isMounted && !mapRef.current && document.getElementById('delivery-map')) {
                const map = window.L.map('delivery-map').setView([lat, lng], 16);
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

                const customerMarker = window.L.marker([lat, lng]).addTo(map);
                const popupContent = `
                    <div style="text-align:center; font-family:sans-serif; color:#000;">
                        <strong style="display:block; margin-bottom:4px; font-size:14px;">${order.user?.name || order.customer_name || 'Customer'}</strong>
                        <div style="font-size:12px;">${order.address || order.user?.address || ''}</div>
                    </div>
                `;
                customerMarker.bindPopup(popupContent).openPopup();
                
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

    const handleCopy = () => {
        if (lat && lng) {
            navigator.clipboard.writeText(`${lat},${lng}`);
            alert('Coordinates copied to clipboard!');
        }
    };

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
                    <h3 style={{ margin: 0, color: '#C9A84C', fontWeight: 700, fontSize: '1.1rem' }}>Delivery Location</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', display: 'flex' }}>✕</button>
                </div>
                <div style={{ padding: '1.5rem', flex: 1 }}>
                    {lat && lng ? (
                        <>
                            <div id="delivery-map" style={{ height: '350px', width: '100%', borderRadius: '8px', zIndex: 1, background: '#222' }}></div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" style={{
                                    flex: 1, display: 'block', background: '#3498db', color: '#fff',
                                    textAlign: 'center', padding: '0.9rem', borderRadius: '6px', fontWeight: 800, textDecoration: 'none'
                                }}>
                                    🧭 Open Navigation
                                </a>
                                <button onClick={handleCopy} style={{ flex: 1, background: '#333', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.9rem', cursor: 'pointer', fontWeight: 700 }}>
                                    📋 Copy Coordinates
                                </button>
                            </div>
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

export default function RiderDeliveries() {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [proofFile, setProofFile] = useState(null);
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [mapTarget, setMapTarget] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/rider/deliveries');
            setDeliveries((res.data.mine || []).filter(d => d.status === 'accepted' || d.status === 'out_for_delivery'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            setLoading(false);
        }
    };

    const handleMarkPickedUp = async (orderId) => {
        try {
            const axios = (await import('axios')).default;
            await axios.put(`/api/rider/deliveries/${orderId}/picked-up`);
            alert('Order marked as picked up!');
            fetchDeliveries();
        } catch (error) {
            console.error('Failed to mark as picked up', error);
            alert('Failed to update delivery status');
        }
    };

    const handleMarkDelivered = async (orderId) => {
        if (!proofFile) {
            alert("Please take or upload a photo of the proof of delivery.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append('proof_of_delivery', proofFile);
            formData.append('_method', 'PUT');

            const axios = (await import('axios')).default;
            await axios.post(`/api/rider/deliveries/${orderId}/delivered`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Order marked as delivered!');
            setProofFile(null);
            setActiveOrderId(null);
            fetchDeliveries();
        } catch (error) {
            console.error('Failed to mark as delivered', error);
            alert('Failed to validate or complete proof of delivery upload.');
        }
    };

    const fmt = (n) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n);

    return (
        <RiderLayout>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">My Deliveries</h1>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 4 }}>
                        Your active assignments
                    </p>
                </div>
            </div>

            <DeliveriesMapModal order={mapTarget} onClose={() => setMapTarget(null)} />

            {loading ? (
                <div style={{ color: '#888', padding: '2rem 0' }}>Loading active deliveries...</div>
            ) : deliveries.length === 0 ? (
                <div style={{ color: '#888', padding: '2rem 0', background: '#1a1a1a', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    No active deliveries right now. Check Home for assignments.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    {deliveries.map(o => (
                        <div key={o.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.3rem', fontWeight: 600 }}>Order #{o.ref || o.id}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#C9A84C' }}>
                                        {o.product?.name || o.product_name || 'Product'}
                                        {o.brand?.name && <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '8px', fontWeight: 600 }}>— {o.brand?.name}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', textAlign: 'right' }}>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                                            ₱{fmt(o.total_amount || 0)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#27ae60', marginTop: '4px', textTransform: 'uppercase' }}>
                                            {o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setMapTarget(o)}
                                        title="View Location"
                                        style={{ background: 'transparent', border: '1px solid #C9A84C', color: '#C9A84C', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'} 
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        📍
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginTop: '1.2rem' }}>
                                <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{o.user?.name || o.customer_name || 'Customer'}</div>
                                <div style={{ fontSize: '0.95rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                    <span>📍</span> {o.address || o.user?.address || 'No address provided'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📞</span> {o.phone || o.user?.phone || 'No phone'}
                                </div>
                            </div>

                            {/* Progress Steps for Picked Up / Delivered */}
                            <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0 1rem 0', padding: '0 0.5rem' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#27ae60', border: '3px solid #1a1a1a', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <div style={{ position: 'absolute', top: '32px', left: '-10px', fontSize: '0.75rem', color: '#27ae60', fontWeight: 700 }}>Assigned</div>
                                    <div style={{ position: 'absolute', top: '11px', left: '24px', right: '0', height: '3px', background: o.status === 'out_for_delivery' ? '#27ae60' : 'rgba(255,255,255,0.1)', zIndex: 1, transition: 'background 0.3s' }}></div>
                                </div>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: o.status === 'out_for_delivery' ? '#3498db' : 'rgba(255,255,255,0.1)', border: '3px solid #1a1a1a', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {o.status === 'out_for_delivery' && <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }}></div>}
                                    </div>
                                    <div style={{ position: 'absolute', top: '32px', left: '-15px', fontSize: '0.75rem', color: o.status === 'out_for_delivery' ? '#3498db' : '#666', fontWeight: 600 }}>Picked Up</div>
                                    <div style={{ position: 'absolute', top: '11px', left: '24px', right: '0', height: '3px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }}></div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '3px solid #1a1a1a', position: 'relative', zIndex: 2 }}></div>
                                    <div style={{ position: 'absolute', top: '32px', left: '-15px', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Delivered</div>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '2.5rem' }}>
                                {o.status === 'accepted' ? (
                                    <button 
                                        onClick={() => handleMarkPickedUp(o.id)}
                                        style={{ width: '100%', padding: '1rem', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#2980b9'} onMouseLeave={e => e.currentTarget.style.background = '#3498db'}
                                    >
                                        Mark as Picked Up
                                    </button>
                                ) : o.status === 'out_for_delivery' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid currentColor', borderColor: '#C9A84C' }}>
                                        <div style={{ color: '#C9A84C', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Proof of Delivery Required</div>
                                        <input 
                                            // Tie input uniquely per row
                                            id={`proof-input-${o.id}`}
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment"
                                            onChange={e => {
                                                setProofFile(e.target.files[0]);
                                                setActiveOrderId(o.id);
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                        <button 
                                            onClick={() => document.getElementById(`proof-input-${o.id}`)?.click()}
                                            style={{ padding: '0.8rem', background: '#222', color: '#fff', border: '1px dashed #666', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#222'}
                                        >
                                            {(proofFile && activeOrderId === o.id) ? `Selected: ${proofFile.name}` : '📷 Upload Proof'}
                                        </button>
                                        <button 
                                            disabled={!(proofFile && activeOrderId === o.id)}
                                            onClick={() => handleMarkDelivered(o.id)}
                                            style={{
                                                padding: '0.8rem', 
                                                background: (proofFile && activeOrderId === o.id) ? '#27ae60' : 'rgba(39,174,96,0.3)', 
                                                color: (proofFile && activeOrderId === o.id) ? '#fff' : '#aaa', 
                                                border: 'none', borderRadius: '6px', 
                                                cursor: (proofFile && activeOrderId === o.id) ? 'pointer' : 'not-allowed', 
                                                fontWeight: 800, fontSize: '0.9rem', transition: '0.2s'
                                            }}
                                        >
                                            Mark as Delivered
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </RiderLayout>
    );    
}
