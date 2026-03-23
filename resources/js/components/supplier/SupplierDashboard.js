import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { reqStore, deliveryStore, notificationStore } from '../sharedStore';
import ProductRequestsPage from './ProductRequestsPage';
import InventorySuppliedPage from './InventorySuppliedPage';
import DeliveriesPage from './DeliveriesPage';
import SupplierReportsPage from './SupplierReportsPage';
import SupplierProfilePage from './SupplierProfilePage';

export default function SupplierDashboard() {
    const { user, loading, logout, fetchUser } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activePage, setActivePage] = useState('dashboard');
    const [notifOpen, setNotifOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dashboardReqs, setDashboardReqs] = useState([]);
    const [dashboardDels, setDashboardDels] = useState([]);
    const avatarRef = useRef(null);

    // Close avatar dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const syncNotifs = () => {
            const all = notificationStore.getAll();
            // Display for supplier: explicitly target='supplier' OR matches company name
            setNotifications(all.filter(n => n.target === 'supplier' || (user?.name && n.target === user.name)));
        };
        const syncData = () => {
            setDashboardReqs(reqStore.getAll().filter(r => r.status !== 'declined' && String(r.supplier_id) === String(user?.id)));
            setDashboardDels(deliveryStore.getAll().filter(d => String(d.supplier_id) === String(user?.id)));
        };
        syncNotifs();
        syncData();
        window.addEventListener('jk_notification_update', syncNotifs);
        window.addEventListener('jk_req_update', syncData);
        window.addEventListener('jk_delivery_update', syncData);
        const storageSync = () => { syncNotifs(); syncData(); };
        window.addEventListener('storage', storageSync);
        return () => {
            window.removeEventListener('jk_notification_update', syncNotifs);
            window.removeEventListener('jk_req_update', syncData);
            window.removeEventListener('jk_delivery_update', syncData);
            window.removeEventListener('storage', storageSync);
        };
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const dashStats = {
        totalReqs: dashboardReqs.length,
        pendingDels: dashboardReqs.filter(r => r.status === 'pending' || r.status === 'accepted' || r.status === 'preparing').length,
        completedDels: dashboardReqs.filter(r => r.status === 'completed' || r.status === 'delivered').length,
        transporting: dashboardReqs.filter(r => r.status === 'transporting').length,
    };

    useEffect(() => {
        if (!loading) {
            if (!user) navigate('/supplier-login');
            else if (user.role !== 'supplier') navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading || !user) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading...
        </div>
    );

    const handleLogout = async () => {
        try { await logout(); navigate('/login'); }
        catch (e) { console.error('Logout failed', e); }
    };

    // ── PENDING / INTERVIEW SCREEN ─────────────────────────────────────────
    if (user.supplier_status !== 'active') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff' }}>
                <div style={{ width: '100%', padding: '1rem 2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                            background: '#ef4444', color: '#fff', fontWeight: 600, borderRadius: '0.5rem',
                            border: 'none', cursor: 'pointer'
                        }}>
                        Sign Out
                    </button>
                </div>
                <div style={{
                    maxWidth: 600, width: '100%', textAlign: 'center', flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', backgroundColor: '#fef3c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="3">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>
                        Application Under Review
                    </h1>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#4b5563', marginBottom: '2rem' }}>
                        You are going to undergo an interview first before being a part of our Company.
                    </p>
                    {user.interview_date && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '0.5rem', width: '100%' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Scheduled Interview</h3>
                            <p style={{ fontSize: '1.2rem', color: '#b08d25', fontWeight: 'bold' }}>
                                {new Date(user.interview_date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── ACTIVE SUPPLIER SHELL ──────────────────────────────────────────────
    const NAV_ITEMS = [
        {
            key: 'dashboard', label: 'Dashboard',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>,
        },
        {
            key: 'requests', label: 'Product Requests',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>,
        },
        {
            key: 'deliveries', label: 'Deliveries',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>,
        },
        {
            key: 'inventory', label: 'Inventory Supplied',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>,
        },
        {
            key: 'reports', label: 'Reports',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>,
        },
        {
            key: 'profile', label: 'Profile',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>,
        },
    ];

    return (
        <div className="admin-shell">

            {/* ── Sidebar ── */}
            <aside className={"admin-sidebar" + (sidebarOpen ? '' : ' admin-sidebar--collapsed')}>
                <div className="admin-sidebar__brand">
                    <span className="admin-sidebar__logo">⌚</span>
                    {sidebarOpen && (
                        <div>
                            <div className="admin-sidebar__brand-name">J&K Watch</div>
                            <div className="admin-sidebar__brand-sub">Supplier Portal</div>
                        </div>
                    )}
                </div>

                <nav className="admin-sidebar__nav">
                    {NAV_ITEMS.map(item => (
                        <div key={item.key}
                            className={"admin-sidebar__link" + (activePage === item.key ? ' active' : '')}
                            onClick={() => setActivePage(item.key)}
                            style={{ cursor: 'pointer' }}>
                            <div className="admin-sidebar__link-content">
                                <span className="admin-sidebar__link-icon">{item.icon}</span>
                                {sidebarOpen && <span className="admin-sidebar__link-label">{item.label}</span>}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* ── Main ── */}
            <div className="admin-main">
                <header className="admin-topbar">
                    <button className="admin-topbar__toggle" onClick={() => setSidebarOpen(o => !o)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="admin-topbar__right" style={{ position: 'relative' }}>
                        <button className="admin-topbar__icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 01-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff',
                                    fontSize: '0.65rem', fontWeight: 'bold', width: 16, height: 16, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <div style={{
                                position: 'absolute', top: 50, right: 60, width: 340, background: '#fff', zIndex: 100,
                                borderRadius: 12, boxShadow: '0 15px 35px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', overflow: 'hidden'
                            }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#fafafa', fontWeight: 700, color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Notifications</span>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: '#dca54c', cursor: 'pointer', fontWeight: 600 }} onClick={() => {
                                            notifications.forEach(n => { if (!n.read) notificationStore.markRead(n.id); });
                                        }}>Mark all as read</span>}
                                        {notifications.length > 0 && (
                                            <button onClick={() => {
                                                const remain = notificationStore.getAll().filter(n => !(n.target === 'supplier' || n.target === user?.name));
                                                notificationStore.save(remain);
                                            }} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#ef4444', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer' }}>
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>No notifications yet.</div>
                                    ) : notifications.map(n => (
                                        <div key={n.id}
                                            onClick={() => { if (!n.read) notificationStore.markRead(n.id); setNotifOpen(false); }}
                                            style={{
                                                padding: '1rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                                                background: n.read ? '#fff' : '#fef3c7', transition: 'background 0.2s',
                                                borderLeft: n.read ? '3px solid transparent' : '3px solid #f59e0b'
                                            }}>
                                            <div style={{ fontSize: '0.85rem', color: '#1f2937', lineHeight: 1.4, marginBottom: 6, fontWeight: n.read ? 500 : 700 }}>
                                                {n.message}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {new Date(n.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* K Avatar + Dropdown */}
                        <div ref={avatarRef} style={{ position: 'relative' }}>
                            <div className="admin-topbar__avatar"
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false); }}
                                title="Account Menu">
                                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            {avatarOpen && (
                                <div style={{
                                    position: 'absolute', top: '110%', right: 0, minWidth: 180,
                                    background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10, boxShadow: '0 15px 35px rgba(0,0,0,0.35)',
                                    overflow: 'hidden', zIndex: 200,
                                }}>
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: '0.78rem', color: '#9ca3af' }}>
                                        Signed in as <strong style={{ color: '#C9A84C' }}>{user?.name || 'Supplier'}</strong>
                                    </div>
                                    <button onClick={() => { setActivePage('profile'); setAvatarOpen(false); }} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        width: '100%', padding: '0.7rem 1rem', background: 'none',
                                        border: 'none', color: '#e5e7eb', cursor: 'pointer',
                                        fontSize: '0.875rem', fontWeight: 600, textAlign: 'left',
                                        transition: 'background 0.15s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.12)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        Profile
                                    </button>
                                    <button onClick={handleLogout} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        width: '100%', padding: '0.7rem 1rem', background: 'none',
                                        border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
                                        color: '#f87171', cursor: 'pointer',
                                        fontSize: '0.875rem', fontWeight: 600, textAlign: 'left',
                                        transition: 'background 0.15s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="admin-content">

                    {/* ── DASHBOARD ── */}
                    {activePage === 'dashboard' && (
                        <>
                            <div style={{ marginBottom: '2rem' }}>
                                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#b08d25', margin: 0 }}>
                                    Supplier Dashboard
                                </h1>
                                <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                                    Overview of your luxury timepiece supply operations
                                </p>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                {[
                                    { label: 'Total Product Requests', val: dashStats.totalReqs, pct: '', pctColor: '#10b981', bg: '#fef3c7', ic: '#dca54c' },
                                    { label: 'Pending Deliveries', val: dashStats.pendingDels, pct: '', pctColor: '#ef4444', bg: '#ffedd5', ic: '#f97316' },
                                    { label: 'Completed Deliveries', val: dashStats.completedDels, pct: '', pctColor: '#10b981', bg: '#d1fae5', ic: '#10b981' },
                                    { label: 'Upcoming Shipments', val: dashStats.transporting, pct: '', pctColor: '#6b7280', bg: '#f3f4f6', ic: '#6b7280' },
                                ].map(s => (
                                    <div key={s.label} style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '0.5rem', background: s.bg, color: s.ic,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            {s.pct && <span style={{
                                                fontSize: '0.75rem', fontWeight: 600, color: s.pctColor,
                                                background: s.pctColor === '#10b981' ? '#d1fae5' : s.pctColor === '#ef4444' ? '#fee2e2' : '#f3f4f6',
                                                padding: '0.25rem 0.5rem', borderRadius: '1rem'
                                            }}>{s.pct}</span>}
                                        </div>
                                        <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>{s.label}</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111827', marginTop: '0.25rem' }}>{s.val}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Panels */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <span style={{ fontWeight: 600, color: '#111827' }}>Pending Requests</span>
                                        <span onClick={() => setActivePage('requests')}
                                            style={{ color: '#dca54c', fontSize: '0.875rem', cursor: 'pointer' }}>View All →</span>
                                    </div>
                                    {dashboardReqs.filter(r => r.status === 'pending').slice(0, 3).length === 0 ? (
                                        <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>No requests yet.</div>
                                    ) : dashboardReqs.filter(r => r.status === 'pending').slice(0, 3).map((r, i) => (
                                        <div key={r.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            paddingBottom: '1rem', borderBottom: i !== 2 ? '1px solid #f3f4f6' : 'none'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{r.model}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>{r.ref} • Qty: {r.qty} • {r.date}</div>
                                            </div>
                                            <span style={{
                                                fontSize: '0.73rem', padding: '0.15rem 0.45rem',
                                                background: '#fef3c7', color: '#f59e0b',
                                                borderRadius: '1rem', fontWeight: 600
                                            }}>Pending</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <span style={{ fontWeight: 600, color: '#111827' }}>Recent Deliveries</span>
                                        <span onClick={() => setActivePage('deliveries')} style={{ color: '#dca54c', fontSize: '0.875rem', cursor: 'pointer' }}>View All →</span>
                                    </div>
                                    {dashboardReqs.filter(r => r.status === 'completed' || r.status === 'delivered').reverse().slice(0, 3).length === 0 ? (
                                        <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>No deliveries yet.</div>
                                    ) : dashboardReqs.filter(r => r.status === 'completed' || r.status === 'delivered').reverse().slice(0, 3).map((r, i) => {
                                        const dStatus = { label: 'Delivered', bg: '#d1fae5', col: '#10b981' };
                                        return (
                                            <div key={r.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                paddingBottom: '1rem', borderBottom: i !== 2 ? '1px solid #f3f4f6' : 'none'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{r.ref}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>{r.model} • Qty: {r.qty}</div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.73rem', fontWeight: 600, color: dStatus.col, background: dStatus.bg,
                                                    padding: '0.25rem 0.5rem', borderRadius: '1rem'
                                                }}>{dStatus.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── PRODUCT REQUESTS ── */}
                    {activePage === 'requests' && <ProductRequestsPage user={user} setActivePage={setActivePage} />}

                    {/* ── INVENTORY SUPPLIED ── */}
                    {activePage === 'inventory' && <InventorySuppliedPage user={user} />}

                    {/* ── DELIVERIES ── */}
                    {activePage === 'deliveries' && <DeliveriesPage user={user} />}

                    {/* ── REPORTS ── */}
                    {activePage === 'reports' && <SupplierReportsPage user={user} />}

                    {/* ── PROFILE ── */}
                    {activePage === 'profile' && <SupplierProfilePage user={user} onUserUpdated={fetchUser} />}

                </main>
            </div>
        </div>
    );
}
