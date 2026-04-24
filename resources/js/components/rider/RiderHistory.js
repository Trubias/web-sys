import React, { useState, useEffect, useMemo } from 'react';
import RiderLayout from './RiderLayout';

export default function RiderHistory() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const getProofUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const filename = path.split('/').pop();
        return `/rider/proofs/${filename}`;
    };

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const axios = (await import('axios')).default;
                const res = await axios.get('/api/rider/deliveries');
                setDeliveries((res.data.mine || []).filter(d => d.status === 'delivered' || d.status === 'completed'));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching deliveries:', error);
                setLoading(false);
            }
        };
        fetchDeliveries();
    }, []);

    const fmt = (n) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n);

    // Helpers for dates
    const isToday = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    const isThisWeek = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0,0,0,0);
        return d >= startOfWeek;
    };

    const isThisMonth = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    // Calculate delivery duration
    const getDuration = (created, delivered) => {
        if (!created || !delivered) return null;
        const diffMs = new Date(delivered) - new Date(created);
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hr${diffHours > 1?'s':''}`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1?'s':''}`;
    };

    // Filters
    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(d => {
            const date = d.delivered_at || d.updated_at;
            let matchTab = true;
            if (activeTab === 'Today') matchTab = isToday(date);
            else if (activeTab === 'This week') matchTab = isThisWeek(date);

            let matchSearch = true;
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const refMatch = (d.ref || String(d.id)).toLowerCase().includes(q);
                const nameMatch = (d.user?.name || d.customer_name || '').toLowerCase().includes(q);
                matchSearch = refMatch || nameMatch;
            }

            return matchTab && matchSearch;
        });
    }, [deliveries, activeTab, searchQuery]);

    // Stats calculated dynamically from filtered deliveries
    const stats = useMemo(() => {
        let todayCount = 0;
        let weekCount = 0;
        let earnings = 0;

        if (!loading) {
            filteredDeliveries.forEach(d => {
                const date = d.delivered_at || d.updated_at;
                if (isToday(date)) todayCount++;
                if (isThisWeek(date)) weekCount++;
                
                // Sum actual order amount as per user request
                earnings += parseFloat(d.total_amount || 0);
            });
        }

        return { todayCount, weekCount, earnings };
    }, [filteredDeliveries, loading]);

    const tabs = ['All', 'Today', 'This week'];
    const getTabColor = (tab, isActive) => {
        if (!isActive) return { bg: 'transparent', color: '#888', border: 'rgba(255,255,255,0.1)' };
        if (tab === 'All') return { bg: '#333', color: '#fff', border: '#444' };
        if (tab === 'Today') return { bg: 'rgba(39, 174, 96, 0.2)', color: '#27ae60', border: 'rgba(39, 174, 96, 0.5)' };
        if (tab === 'This week') return { bg: 'rgba(52, 152, 219, 0.2)', color: '#3498db', border: 'rgba(52, 152, 219, 0.5)' };
        return { bg: '#333', color: '#fff', border: '#444' };
    };

    // Determine the label for earnings
    const getEarningsLabel = () => {
        if (activeTab === 'Today') return 'EARNINGS TODAY';
        if (activeTab === 'This week') return 'EARNINGS THIS WEEK';
        return 'TOTAL EARNINGS';
    };

    return (
        <RiderLayout>
            <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="admin-page-title">Delivery History</h1>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 4 }}>
                        Summary of all your completed deliveries
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Today</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{loading ? '...' : stats.todayCount}</div>
                </div>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>This Week</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{loading ? '...' : stats.weekCount}</div>
                </div>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(39,174,96,0.2)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#27ae60', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{getEarningsLabel()}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#27ae60' }}>{loading ? '...' : `₱${fmt(stats.earnings)}`}</div>
                </div>
            </div>

            {/* Filter & Search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {tabs.map(tab => {
                        const style = getTabColor(tab, activeTab === tab);
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                background: style.bg, color: style.color,
                                border: `1px solid ${style.border}`,
                                padding: '0.5rem 1rem', borderRadius: '20px',
                                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}>
                                {tab}
                            </button>
                        )
                    })}
                </div>
                <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
                    <input 
                        type="text" 
                        placeholder="Search by order # or name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '0.6rem 1rem', borderRadius: '20px',
                            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontSize: '0.85rem', outline: 'none'
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#888', padding: '2rem 0' }}>Loading delivery history...</div>
            ) : filteredDeliveries.length === 0 ? (
                <div style={{ color: '#888', padding: '2rem 0', background: '#1a1a1a', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    No completed deliveries found.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    {filteredDeliveries.map(o => {
                        const duration = getDuration(o.created_at, o.delivered_at);
                        const rate = o.rating ? o.rating.rating : null;

                        return (
                            <div key={o.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                {/* Duration Badge */}
                                {duration && (
                                    <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <span>⏱</span> {duration}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingRight: '60px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.3rem', fontWeight: 600 }}>Order #{o.ref || o.id}</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#C9A84C' }}>
                                            {o.product?.name || o.product_name || 'Product'}
                                            {o.brand?.name && <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '8px', fontWeight: 600 }}>— {o.brand?.name}</span>}
                                        </div>
                                    </div>
                                </div>
                                


                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginTop: '1.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{o.user?.name || o.customer_name || 'Customer'}</div>
                                            <div style={{ fontSize: '0.95rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                                <span>📍</span> {o.address || o.user?.address || 'No address provided'}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', textAlign: 'right' }}>
                                            ₱{fmt(o.total_amount || 0)}
                                            <div style={{ fontSize: '0.7rem', color: '#27ae60', marginTop: '4px', textTransform: 'uppercase' }}>
                                                {o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>📅</span> {o.delivered_at ? new Date(o.delivered_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : new Date(o.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {o.proof_of_delivery && (
                                                <button 
                                                    onClick={() => setSelectedProof(getProofUrl(o.proof_of_delivery))}
                                                    style={{ background: 'transparent', border: 'none', color: '#3498db', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    View Proof
                                                </button>
                                            )}
                                            {o.rating && (
                                                <button 
                                                    onClick={() => setSelectedReview({ order: o, rating: o.rating })}
                                                    style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    View Review
                                                </button>
                                            )}
                                            <span style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                Delivered
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {selectedProof && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setSelectedProof(null)}>
                    <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedProof(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', padding: '5px' }}>&times;</button>
                        <img src={selectedProof} alt="Proof of Delivery" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }} />
                    </div>
                </div>
            )}

            {selectedReview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setSelectedReview(null)}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#1a1a1a', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedReview(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        
                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.3rem', fontWeight: 600 }}>Order #{selectedReview.order.ref || selectedReview.order.id}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#C9A84C', marginBottom: '0.5rem' }}>
                                {selectedReview.order.product?.name || selectedReview.order.product_name || 'Product'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                Review by: <span style={{ color: '#fff', fontWeight: 600 }}>{selectedReview.order.user?.name || selectedReview.order.customer_name || 'Customer'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ color: '#d97706', fontSize: '2.5rem', letterSpacing: '4px', lineHeight: 1 }}>
                                {'★'.repeat(selectedReview.rating.rating)}{'☆'.repeat(5 - selectedReview.rating.rating)}
                            </div>
                        </div>

                        {(() => {
                            let tags = selectedReview.rating.tags;
                            if (typeof tags === 'string') {
                                try { tags = JSON.parse(tags); } catch (e) { tags = []; }
                            }
                            if (Array.isArray(tags) && tags.length > 0) {
                                return (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        {tags.map((tag, idx) => (
                                            <span key={idx} style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '8px', textAlign: 'center' }}>
                            {selectedReview.rating.comment ? (
                                <div style={{ color: '#ddd', fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                                    "{selectedReview.rating.comment}"
                                </div>
                            ) : (
                                <div style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    No comment left
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </RiderLayout>
    );
}
