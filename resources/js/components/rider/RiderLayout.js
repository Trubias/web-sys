import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const navItems = [
    {
        to: '/rider/home',
        label: 'Home',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
        ),
    },
    {
        to: '/rider/deliveries',
        label: 'My Deliveries',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
        ),
    },
    {
        to: '/rider/history',
        label: 'Delivery History',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    {
        to: '/rider/profile',
        label: 'Profile',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
];

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const panelRef = useRef(null);

    const fetchNotifs = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/user/notifications');
            setNotifications(res.data);
        } catch (e) {}
    };

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        try {
            const axios = (await import('axios')).default;
            await axios.put(`/api/user/notifications/${id}/read`);
        } catch (e) {}
    };

    const markAllRead = async () => {
        try {
            const axios = (await import('axios')).default;
            await axios.post('/api/user/notifications/read');
            fetchNotifs();
        } catch (e) {}
    };

    const clearAll = async () => {
        try {
            const axios = (await import('axios')).default;
            await axios.delete('/api/user/notifications');
            fetchNotifs();
        } catch (e) {}
    };

    return (
        <div style={{ position: 'relative', marginRight: '1rem' }} ref={panelRef}>
            {/* Bell button */}
            <button
                className="admin-topbar__icon-btn"
                onClick={() => setOpen(o => !o)}
                style={{ position: 'relative', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-6px', right: '-8px',
                        background: '#e74c3c', color: '#fff',
                        borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                        minWidth: 16, height: 16, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px', lineHeight: 1,
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification panel */}
            {open && (
                <div className="mobile-notification-dropdown" style={{
                    position: 'absolute', top: 'calc(100% + 15px)', right: -10,
                    width: 360, background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    zIndex: 999, overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
                            Notifications
                            {unreadCount > 0 && (
                                <span style={{ marginLeft: 8, background: '#e74c3c', color: '#fff', borderRadius: 999, fontSize: '0.7rem', padding: '1px 7px', fontWeight: 700 }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                        Mark all as read
                                    </button>
                                )}
                                <button onClick={clearAll} style={{ fontSize: '0.75rem', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '0.875rem' }}>
                                No notifications yet.
                            </div>
                        ) : notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => { if (!n.is_read) markRead(n.id); }}
                                style={{
                                    padding: '0.9rem 1.2rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    cursor: n.is_read ? 'default' : 'pointer',
                                    background: n.is_read ? 'transparent' : 'rgba(201,168,76,0.07)',
                                    borderLeft: n.is_read ? '3px solid transparent' : '3px solid #C9A84C',
                                    transition: 'background 0.15s',
                                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                }}
                            >
                                {/* Unread dot */}
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                                    background: n.is_read ? 'transparent' : '#C9A84C',
                                }} />
                                <div>
                                    <div style={{ color: n.is_read ? '#888' : '#e5e5e5', fontSize: '0.845rem', lineHeight: 1.55, fontWeight: n.is_read ? 400 : 600 }}>
                                        {n.message || n.title}
                                    </div>
                                    <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 4 }}>
                                        {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RiderLayout({ children }) {
    const { user, logout, fetchUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Original Sidebar state logic
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Guaranteed fresh DB check on mount/navigation to prevent stale status caching
    useEffect(() => {
        if (fetchUser) fetchUser();
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const [avatarOpen, setAvatarOpen] = useState(false);
    const avatarRef = useRef(null);

    useEffect(() => {
        if (!avatarOpen) return;
        const handler = (e) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [avatarOpen]);

    const handleLogout = async () => {
        await logout();
        navigate('/rider-login');
    };

    const isActive = (to) => {
        return location.pathname === to || location.pathname.startsWith(to + '/');
    };

    // ── PENDING / INTERVIEW SCREEN ─────────────────────────────────────────
    if (user && user.rider_status !== 'active') {
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
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem'
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

    return (
        <div className="admin-shell rider-shell">
            {/* Mobile Overlay (Only active structurally, hidden by css later) */}
            <div 
                className={`admin-sidebar-overlay${sidebarOpen ? ' admin-sidebar-overlay--visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar (Desktop only via CSS) */}
            <aside className={`admin-sidebar rider-sidebar${sidebarOpen ? ' admin-sidebar--mobile-open' : ' admin-sidebar--collapsed'}`}>
                <div className="admin-sidebar__brand">
                    <span className="admin-sidebar__logo">🛵</span>
                    {sidebarOpen && (
                        <div>
                            <div className="admin-sidebar__brand-name">J&K Watch</div>
                            <div className="admin-sidebar__brand-sub">Rider Portal</div>
                        </div>
                    )}
                </div>

                <nav className="admin-sidebar__nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`admin-sidebar__link${isActive(item.to) ? ' active' : ''}`}
                            title={!sidebarOpen ? item.label : ''}
                        >
                            <div className="admin-sidebar__link-content">
                                <span className="admin-sidebar__link-icon">{item.icon}</span>
                                {sidebarOpen && <span className="admin-sidebar__link-label">{item.label}</span>}
                            </div>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main */}
            <div className="admin-main rider-main">
                {/* Top bar */}
                <header className="admin-topbar rider-topbar">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Hamburger - visible only on desktop */}
                        <button className="admin-topbar__toggle rider-topbar__toggle" onClick={() => setSidebarOpen(o => !o)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        {/* Mobile Brand Title in Topbar (Visible on mobile, hidden on desktop if desired, but user said "top navbar with the logo must stay unchanged on desktop.") -> Wait! They meant my PREVIOUS change? No! "On desktop... the existing desktop layout must remain exactly as it is with the current navbar and sidebar hamburger menu working..." So let's keep topbar brand ONLY on mobile if they want it like customer portal. Or wait, they saw my screenshot (Image 4) and said "On desktop... top navbar with the J and K Watch Rider Portal logo... must stay unchanged on desktop". No! The screenshot is what they want to fix, but they actually like the logo in the top navbar? I will keep the brand title visible! But they said "On desktop and laptop screens... the hamburger menu and sidebar drawer must continue working exactly as before... The top navbar with the J and K Watch Rider Portal logo, bell icon, and avatar must stay unchanged on desktop." This implies they accept the new topbar branding I just made, OR they want the exact previous top bar. The safest bet is to include the brand title but styled generically. */}
                        <div className="rider-mobile-topbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '1rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🛵</span>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, fontFamily: '"Playfair Display", serif' }}>J&K Watch</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#C9A84C', letterSpacing: '0.5px' }}>Rider Portal</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-topbar__right" style={{ display: 'flex', alignItems: 'center' }}>
                        <NotificationBell />
                        <div className="admin-topbar__avatar" ref={avatarRef} onClick={() => setAvatarOpen(o => !o)} style={{ cursor: 'pointer', position: 'relative' }}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                user?.name?.charAt(0)?.toUpperCase() || 'R'
                            )}

                            {avatarOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                                    width: 170, background: '#1a1a1a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                    zIndex: 999, padding: '0.4rem 0', display: 'flex', flexDirection: 'column'
                                }}>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setAvatarOpen(false); handleLogout(); }}
                                        style={{
                                            padding: '0.75rem 1.2rem', color: '#e74c3c', fontSize: '0.88rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.6rem', transition: '0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Logout
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="admin-content rider-content">
                    {children}
                </main>
            </div>

            {/* Bottom Navigation (Mobile Only via CSS) */}
            <nav className="rider-bottom-nav">
                <div className="rider-bottom-nav__inner">
                    {navItems.map((item) => {
                        const active = isActive(item.to);
                        return (
                            <Link key={item.to} to={item.to} className={`rider-bottom-nav__item ${active ? 'active' : ''}`}>
                                <div className="rider-bottom-nav__icon">{item.icon}</div>
                                <span className="rider-bottom-nav__label">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
