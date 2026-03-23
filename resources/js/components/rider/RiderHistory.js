import React, { useState, useEffect } from 'react';
import RiderLayout from './RiderLayout';

export default function RiderHistory() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const axios = (await import('axios')).default;
                const res = await axios.get('/api/rider/deliveries');
                setDeliveries(res.data.filter(d => d.status === 'delivered' || d.status === 'completed'));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching deliveries:', error);
                setLoading(false);
            }
        };
        fetchDeliveries();
    }, []);

    const fmt = (n) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n);

    return (
        <RiderLayout>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Delivery History</h1>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 4 }}>
                        Summary of all your completed deliveries
                    </p>
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#888', padding: '2rem 0' }}>Loading delivery history...</div>
            ) : deliveries.length === 0 ? (
                <div style={{ color: '#888', padding: '2rem 0', background: '#1a1a1a', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    No completed deliveries yet.
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
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', textAlign: 'right' }}>
                                    ₱{fmt(o.total_amount || 0)}
                                    <div style={{ fontSize: '0.75rem', color: '#27ae60', marginTop: '4px', textTransform: 'uppercase' }}>
                                        {o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginTop: '1.2rem' }}>
                                <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{o.user?.name || o.customer_name || 'Customer'}</div>
                                <div style={{ fontSize: '0.95rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                    <span>📍</span> {o.address || o.user?.address || 'No address provided'}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📅</span> {o.delivered_at ? new Date(o.delivered_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : new Date(o.updated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                    <span style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                        Delivered
                                    </span>
                                </div>
                            </div>
                            
                            {o.proof_of_delivery && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <a 
                                        href={o.proof_of_delivery} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.9rem', background: '#222', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,152,219,0.1)'} onMouseLeave={e => e.currentTarget.style.background = '#222'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                        View Proof of Delivery
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </RiderLayout>
    );
}
