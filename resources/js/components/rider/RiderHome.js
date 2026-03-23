import React, { useState, useEffect } from 'react';
import RiderLayout from './RiderLayout';
import { useAuth } from '../../Context/AuthContext';

export default function RiderHome() {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelTarget, setCancelTarget] = useState(null); // for styled confirm modal
    const [toast, setToast] = useState('');

    const showToast = (msg, duration = 3000) => {
        setToast(msg);
        setTimeout(() => setToast(''), duration);
    };

    const fetchDeliveries = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/rider/deliveries');
            setDeliveries(res.data);
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
            showToast('Delivery assignment cancelled.');
            const { notificationStore } = await import('../sharedStore');
            notificationStore.add('admin', `Rider ${user?.name || 'A rider'} cancelled/declined delivery for Order #${cancelTarget.ref || cancelTarget.id}.`);
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
                        <h3 style={{ margin: '0 0 0.8rem', color: '#e74c3c', fontWeight: 700 }}>Cancel Assignment?</h3>
                        <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                            Are you sure you want to cancel this delivery assignment? The order will return to unassigned status.
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
                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>NEW ASSIGNMENTS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{pendingDeliveries.length}</div>
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

            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>Active Deliveries</h2>
            
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
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        {o.region || o.user?.region || 'Region'}
                                    </span>
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
                            
                            {/* Action Buttons */}
                            {o.status === 'assigned' && (
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                    <button onClick={() => handleAccept(o)} style={{ flex: 1, padding: '0.9rem', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#2980b9'} onMouseLeave={e => e.currentTarget.style.background = '#3498db'}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                        Accept
                                    </button>
                                    <button onClick={() => setCancelTarget(o)} style={{ flex: 1, padding: '0.9rem', background: 'transparent', color: '#e74c3c', border: '1px solid currentColor', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {o.status === 'out_for_delivery' && (
                                <div style={{ marginTop: '2.5rem', padding: '0.8rem', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: '8px', textAlign: 'center', color: '#2ecc71', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Out for delivery. Navigate to My Deliveries to complete it.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </RiderLayout>
    );
}
