import React, { useState, useEffect, useCallback } from 'react';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';

// ── Status helpers ────────────────────────────────────────────────────────────

function normalizeStatus(rawStatus) {
    // Map backend statuses to customer-facing labels
    const map = {
        pending: 'Pending',
        processing: 'Processing',
        assigned: 'Processing',   // admin assigned rider = Processing from customer view
        accepted: 'Processing',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        completed: 'Delivered',
        cancelled: 'Cancelled',
        canceled: 'Cancelled',
    };
    return map[(rawStatus || '').toLowerCase()] || rawStatus || 'Pending';
}

function statusBadgeStyle(label) {
    const styles = {
        'Pending': { background: '#fef9c3', color: '#a16207', border: '1px solid #fde047' },
        'Processing': { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' },
        'Out for Delivery': { background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd' },
        'Delivered': { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
        'Cancelled': { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
    };
    return styles[label] || { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
}

function formatPaymentMethod(method, bankName) {
    const labels = {
        gcash: 'GCash',
        maya: 'Maya',
        bank_transfer: 'Bank Transfer',
        cod: 'Cash on Delivery',
    };
    const label = labels[(method || '').toLowerCase()] || method;
    if ((method || '').toLowerCase() === 'bank_transfer' && bankName) {
        return `${label} (${bankName})`;
    }
    return label;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatRef(ref) {
    if (!ref) return '—';
    return ref.startsWith('#') ? ref : `#${ref}`;
}

// ── Pinned Location Map ───────────────────────────────────────────────────────

const PinnedLocationMap = ({ lat, lng }) => {
    const [showMap, setShowMap] = useState(false);
    const mapRef = React.useRef(null);

    React.useEffect(() => {
        if (!showMap || !lat || !lng) return;

        let isMounted = true;
        const loadLeaflet = async () => {
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
                await new Promise(resolve => script.onload = resolve);
            }

            // Using a dynamic ID to prevent conflicts if multiple maps exist, though modal is single.
            const mapId = `view-map-${lat}-${lng}`;
            
            if (isMounted && !mapRef.current && window.L && document.getElementById(mapId)) {
                const map = window.L.map(mapId).setView([lat, lng], 16);
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

                window.L.marker([lat, lng]).addTo(map);
                mapRef.current = map;
                
                setTimeout(() => {
                    map.invalidateSize();
                }, 200);
            }
        };
        loadLeaflet();
        return () => { isMounted = false; };
    }, [showMap, lat, lng]);

    if (!lat || !lng) {
        return <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem', fontStyle: 'italic', padding: '0.2rem 0' }}>No precise location pinned.</div>;
    }

    const mapId = `view-map-${lat}-${lng}`;

    return (
        <div style={{ marginTop: '0.8rem' }}>
            {!showMap ? (
                <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#333', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e9ecef'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8f9fa'}
                >
                    📍 View Pinned Location
                </button>
            ) : (
                <div style={{ border: '1px solid #eaeaea', borderRadius: '6px', overflow: 'hidden', marginTop: '0.5rem' }}>
                    <div id={mapId} style={{ height: '250px', width: '100%', zIndex: 1, background: '#f0f0f0' }}></div>
                    <div style={{ padding: '0.6rem', background: '#fafafa', textAlign: 'center', borderTop: '1px solid #eaeaea' }}>
                        <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600 }}>
                            Open in Google Maps ↗
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onCancelOrder }) {
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    if (!order) return null;

    const statusLabel = normalizeStatus(order.status);
    const badgeStyle = statusBadgeStyle(statusLabel);
    const paymentDisplay = formatPaymentMethod(order.payment_method, order.bank_name);

    const showRider = !!order.rider_id;
    const hasRider = !!(order.rider && order.rider.id);

    const isPending = (order.status || '').toLowerCase() === 'pending';

    const imgSrc = order.product_image
        ? (order.product_image.startsWith('http') ? order.product_image : `/storage/${order.product_image}`)
        : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=200&auto=format&fit=crop';

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        await onCancelOrder(order.id);
        setIsCancelling(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', overflowY: 'auto'
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Modal Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.5rem', borderBottom: '1px solid #f0f0f0',
                    background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
                    borderRadius: '12px 12px 0 0'
                }}>
                    <div>
                        <div style={{ color: '#C9A84C', fontWeight: 800, fontSize: '1.1rem' }}>
                            {formatRef(order.ref)}
                        </div>
                        <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Ordered on {formatDate(order.created_at)}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                        width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                        fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>✕</button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555' }}>ORDER STATUS</span>
                        <span style={{
                            ...badgeStyle,
                            padding: '0.25rem 0.8rem', borderRadius: '20px',
                            fontSize: '0.78rem', fontWeight: 700
                        }}>
                            {statusLabel}
                        </span>
                    </div>

                    {/* Product */}
                    <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <img src={imgSrc} alt={order.product_name}
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', flexShrink: 0 }}
                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=200&auto=format&fit=crop'; }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', marginBottom: '0.2rem' }}>
                                {order.product_name}
                            </div>
                            {order.brand_name && (
                                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>{order.brand_name}</div>
                            )}
                            <div style={{ fontSize: '0.83rem', color: '#555' }}>
                                Qty: <strong>{order.quantity}</strong> &nbsp;·&nbsp; Unit price: ₱{Number(order.unit_price || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div>
                        <SectionLabel icon="📦" label="Delivery Address" />
                        <InfoBox>
                            <InfoRow label="Name" value={order.customer_name || '—'} />
                            <InfoRow label="Address" value={order.address || '—'} />
                            <InfoRow label="City" value={order.city || '—'} />
                            <InfoRow label="Region" value={order.region || '—'} />
                            <PinnedLocationMap lat={order.latitude} lng={order.longitude} />
                        </InfoBox>
                    </div>

                    {/* Delivery Rider */}
                    <div>
                        <SectionLabel icon="🏍️" label="Delivery Rider" />
                        <InfoBox>
                            {showRider && hasRider ? (
                                <>
                                    <InfoRow label="Name" value={order.rider.name || '—'} />
                                    <InfoRow label="Contact" value={order.rider.phone || '—'} />
                                </>
                            ) : (
                                <div style={{ color: '#9ca3af', fontSize: '0.87rem', fontStyle: 'italic', padding: '0.25rem 0' }}>
                                    Rider not yet assigned
                                </div>
                            )}
                        </InfoBox>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <SectionLabel icon="💳" label="Payment Method" />
                        <InfoBox>
                            <InfoRow label="Method" value={paymentDisplay} />
                        </InfoBox>
                    </div>

                    {/* Order Note */}
                    {order.order_note && (
                        <div>
                            <SectionLabel icon="📝" label="Order Note" />
                            <InfoBox>
                                <div style={{ fontSize: '0.87rem', color: '#444', lineHeight: 1.5 }}>{order.order_note}</div>
                            </InfoBox>
                        </div>
                    )}

                    {/* Totals */}
                    <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Subtotal</span>
                            <span style={{ color: '#fff', fontSize: '0.85rem' }}>₱{Number(order.total_amount || 0).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Shipping</span>
                            <span style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 600 }}>Free</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1rem' }}>Total</span>
                            <span style={{ color: '#C9A84C', fontWeight: 800, fontSize: '1.1rem' }}>
                                ₱{Number(order.total_amount || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Cancel Order Section */}
                    {order.status !== 'cancelled' && order.status !== 'canceled' && (
                        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                            {showCancelConfirm ? (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.25rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem', color: '#b91c1c', fontSize: '1rem', fontWeight: 700 }}>Cancel this order?</h4>
                                    <p style={{ margin: '0 0 1rem', color: '#7f1d1d', fontSize: '0.85rem' }}>
                                        Are you sure you want to cancel this order? This action cannot be undone.
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowCancelConfirm(false)} disabled={isCancelling} style={{
                                            padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #fca5a5',
                                            borderRadius: '6px', color: '#b91c1c', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                                        }}>Keep Order</button>
                                        <button onClick={handleConfirmCancel} disabled={isCancelling} style={{
                                            padding: '0.6rem 1rem', background: '#b91c1c', border: 'none',
                                            borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                                        }}>{isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    disabled={!isPending}
                                    style={{
                                        width: '100%', padding: '0.9rem',
                                        background: isPending ? '#fff' : '#f9f9f9',
                                        border: `1px solid ${isPending ? '#fca5a5' : '#eaeaea'}`,
                                        color: isPending ? '#dc2626' : '#9ca3af',
                                        borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem',
                                        cursor: isPending ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                    }}
                                    onMouseEnter={e => {
                                        if (isPending) {
                                            e.currentTarget.style.background = '#fef2f2';
                                            e.currentTarget.style.borderColor = '#ef4444';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (isPending) {
                                            e.currentTarget.style.background = '#fff';
                                            e.currentTarget.style.borderColor = '#fca5a5';
                                        }
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    {isPending ? 'Cancel Order' : 'Order cannot be cancelled at this stage'}
                                </button>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function SectionLabel({ icon, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span>{icon}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        </div>
    );
}

function InfoBox({ children }) {
    return (
        <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {children}
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.87rem' }}>
            <span style={{ color: '#888', minWidth: '100px', flexShrink: 0 }}>{label}:</span>
            <span style={{ color: '#111', fontWeight: 500 }}>{value}</span>
        </div>
    );
}

// ── Main Orders Page ──────────────────────────────────────────────────────────

export default function UserOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = useCallback(() => {
        axios.get('/api/orders')
            .then(res => {
                setOrders(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch orders:', err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchOrders();
        // Real-time polling every 15 seconds
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // If selectedOrder is open, sync it with latest data
    useEffect(() => {
        if (selectedOrder) {
            const updated = orders.find(o => o.id === selectedOrder.id);
            if (updated) setSelectedOrder(updated);
        }
    }, [orders]);

    const handleCancelOrder = async (orderId) => {
        try {
            await axios.delete(`/api/orders/${orderId}`);
            // Instantly remove from local list
            setOrders(prev => prev.filter(o => o.id !== orderId));
            setSelectedOrder(null);
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert('Failed to cancel order. Please try again.');
        }
    };

    const thStyle = {
        textAlign: 'left', padding: '1rem 1.2rem',
        fontSize: '0.7rem', fontWeight: 700, color: '#555',
        textTransform: 'uppercase', letterSpacing: '0.04em',
        borderBottom: '2px solid #eaeaea', whiteSpace: 'nowrap'
    };

    const tdStyle = {
        padding: '1rem 1.2rem', verticalAlign: 'middle',
        borderBottom: '1px solid #f3f3f3', fontSize: '0.87rem', color: '#333'
    };

    return (
        <UserLayout>
            <div style={{ padding: '3rem 5rem', maxWidth: '1400px', margin: '0 auto' }}>

                {/* Page Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: '2.2rem', color: '#111', margin: '0 0 0.3rem'
                    }}>
                        My Orders
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                        Track and manage all your purchase orders
                    </p>
                </div>

                {/* Orders Table Card */}
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #eaeaea', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                            Loading your orders…
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{ padding: '5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111', marginBottom: '0.5rem' }}>No orders yet</div>
                            <div style={{ color: '#888', fontSize: '0.9rem' }}>When you place an order, it will appear here.</div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                                <thead style={{ background: '#fafafa' }}>
                                    <tr>
                                        <th style={thStyle}>Order ID</th>
                                        <th style={thStyle}>Product</th>
                                        <th style={thStyle}>Date Ordered</th>
                                        <th style={thStyle}>Total</th>
                                        <th style={thStyle}>Payment</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => {
                                        const statusLabel = normalizeStatus(order.status);
                                        const badgeStyle = statusBadgeStyle(statusLabel);

                                        const imgSrc = order.product_image
                                            ? (order.product_image.startsWith('http') ? order.product_image : `/storage/${order.product_image}`)
                                            : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=80&auto=format&fit=crop';

                                        return (
                                            <tr key={order.id}
                                                style={{ transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={tdStyle}>
                                                    <span style={{ fontWeight: 700, color: '#C9A84C', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                        {formatRef(order.ref)}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                        <img src={imgSrc} alt={order.product_name}
                                                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', flexShrink: 0 }}
                                                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=80&auto=format&fit=crop'; }} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#111', fontSize: '0.88rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {order.product_name}
                                                            </div>
                                                            {order.brand_name && (
                                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{order.brand_name}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>{formatDate(order.created_at)}</td>
                                                <td style={{ ...tdStyle, fontWeight: 700, color: '#111' }}>
                                                    ₱{Number(order.total_amount || 0).toLocaleString()}
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontSize: '0.83rem' }}>
                                                        {formatPaymentMethod(order.payment_method, order.bank_name)}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                    <span style={{
                                                        ...badgeStyle,
                                                        padding: '0.28rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem', fontWeight: 700,
                                                        display: 'inline-block', whiteSpace: 'nowrap'
                                                    }}>
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        style={{
                                                            background: '#0a0a0a', color: '#C9A84C',
                                                            border: '1px solid #C9A84C', borderRadius: '6px',
                                                            padding: '0.4rem 1rem', fontSize: '0.78rem',
                                                            fontWeight: 700, cursor: 'pointer',
                                                            transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#000'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#C9A84C'; }}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Total count hint */}
                {orders.length > 0 && (
                    <div style={{ textAlign: 'right', marginTop: '0.75rem', color: '#aaa', fontSize: '0.78rem' }}>
                        Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onCancelOrder={handleCancelOrder}
                />
            )}
        </UserLayout>
    );
}
