import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { notificationStore } from '../sharedStore';

const navItems = [
    {
        to: '/admin',
        label: 'Dashboard',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        to: '/admin/products',
        label: 'Product Management',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
        ),
    },
    {
        to: '/admin/inventory',
        label: 'Inventory',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
        ),
    },
    {
        to: '/admin/orders',
        label: 'Orders',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
        ),
    },
    {
        isDropdown: true,
        label: 'Users',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
        children: [
            { to: '/admin/customers', label: 'Customers' },
            { to: '/admin/suppliers', label: 'Suppliers' },
            { to: '/admin/riders', label: 'Riders' },
        ]
    },
    {
        to: '/admin/reports',
        label: 'Reports',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
    {
        to: '/admin/settings',
        label: 'Settings',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
        ),
    },
];

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell({ user }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const panelRef = useRef(null);

    const syncNotifs = () => {
        const all = notificationStore.getAll();
        // Admin sees notifications targeted to 'admin'
        setNotifications(all.filter(n => n.target === 'admin').reverse());
    };

    useEffect(() => {
        syncNotifs();
        window.addEventListener('jk_notification_update', syncNotifs);
        window.addEventListener('storage', syncNotifs);
        return () => {
            window.removeEventListener('jk_notification_update', syncNotifs);
            window.removeEventListener('storage', syncNotifs);
        };
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Real logic based on User state in DB (with fallback to localStorage if needed initially)
    const newOrderOn = user?.notify_new_order ?? (localStorage.getItem('admin_notify_newOrder') !== 'false');

    const unreadCount = notifications.filter(n => {
        if (n.read) return false;
        if (n.type === 'new_order' && !newOrderOn) return false;
        return true;
    }).length;

    const markRead = (id) => {
        notificationStore.markRead(id);
        syncNotifs();
    };

    const markAllRead = () => {
        const all = notificationStore.getAll();
        all.filter(n => n.target === 'admin' && !n.read).forEach(n => notificationStore.markRead(n.id));
        syncNotifs();
    };

    const clearAll = () => {
        notificationStore.clearAll('admin');
        syncNotifs();
    };


    return (
        <div style={{ position: 'relative' }} ref={panelRef}>
            {/* Bell button */}
            <button
                className="admin-topbar__icon-btn"
                onClick={() => setOpen(o => !o)}
                style={{ position: 'relative' }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2,
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
                <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 360, background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    zIndex: 999, overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
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
                                        Mark all read
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
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                                No notifications yet
                            </div>
                        ) : notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => markRead(n.id)}
                                style={{
                                    padding: '0.9rem 1.2rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    background: n.read ? 'transparent' : 'rgba(201,168,76,0.07)',
                                    transition: 'background 0.15s',
                                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                }}
                            >
                                {/* Unread dot */}
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                                    background: n.read ? 'transparent' : '#C9A84C',
                                }} />
                                <div>
                                    <div style={{ color: n.read ? '#888' : '#e5e5e5', fontSize: '0.845rem', lineHeight: 1.55, fontWeight: n.read ? 400 : 600 }}>
                                        {n.message}
                                    </div>
                                    <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 4 }}>
                                        {new Date(n.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

export default function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const avatarRef = React.useRef(null);

    useEffect(() => {
        if (!avatarOpen) return;
        const handler = (e) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [avatarOpen]);

    const [usersMenuOpen, setUsersMenuOpen] = useState(() => {
        return location.pathname.includes('/admin/suppliers') ||
            location.pathname.includes('/admin/riders') ||
            location.pathname.includes('/admin/customers');
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (to) => {
        if (to === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(to);
    };

    return (
        <div className="admin-shell">
            {/* Sidebar */}
            <aside className={`admin-sidebar${sidebarOpen ? '' : ' admin-sidebar--collapsed'}`}>
                <div className="admin-sidebar__brand">
                    <span className="admin-sidebar__logo">⌚</span>
                    {sidebarOpen && (
                        <div>
                            <div className="admin-sidebar__brand-name">J&K Watch</div>
                            <div className="admin-sidebar__brand-sub">Admin Portal</div>
                        </div>
                    )}
                </div>

                <nav className="admin-sidebar__nav">
                    {navItems.map((item, idx) => {
                        if (item.isDropdown) {
                            const isChildActive = item.children.some(child => isActive(child.to));
                            return (
                                <div key={`dropdown-${idx}`}>
                                    <div
                                        className={`admin-sidebar__link${isChildActive && !usersMenuOpen ? ' active' : ''}`}
                                        onClick={() => {
                                            if (!sidebarOpen) setSidebarOpen(true);
                                            setUsersMenuOpen(!usersMenuOpen);
                                        }}
                                        title={!sidebarOpen ? item.label : ''}
                                    >
                                        <div className="admin-sidebar__link-content">
                                            <span className="admin-sidebar__link-icon">{item.icon}</span>
                                            {sidebarOpen && <span className="admin-sidebar__link-label">{item.label}</span>}
                                        </div>
                                        {sidebarOpen && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: usersMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                    <div className={`admin-sidebar__subnav ${usersMenuOpen && sidebarOpen ? 'admin-sidebar__subnav--open' : ''}`}>
                                        {item.children.map(child => (
                                            <Link
                                                key={child.to}
                                                to={child.to}
                                                className={isActive(child.to) ? 'active' : ''}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        return (
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
                        );
                    })}
                </nav>


            </aside>

            {/* Main */}
            <div className="admin-main">
                {/* Top bar */}
                <header className="admin-topbar">
                    <button className="admin-topbar__toggle" onClick={() => setSidebarOpen(o => !o)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="admin-topbar__right">
                        {/* Functional notification bell */}
                        <NotificationBell user={user} />
                        <div ref={avatarRef} style={{ cursor: 'pointer', position: 'relative' }}>
                            <div className="admin-topbar__avatar" onClick={() => setAvatarOpen(o => !o)} style={{ overflow: 'hidden' }}>
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    user?.name?.charAt(0)?.toUpperCase() || 'A'
                                )}
                            </div>

                            {avatarOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                                    width: 180, background: '#0f172a', /* dark navy */
                                    border: '1px solid #C9A84C', /* gold border */
                                    borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                                    zIndex: 999, padding: '0.4rem 0', display: 'flex', flexDirection: 'column'
                                }}>
                                    <div
                                        onClick={() => { setAvatarOpen(false); navigate('/admin/settings'); }}
                                        style={{
                                            padding: '0.75rem 1.2rem', color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s',
                                            fontWeight: 500
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                                        </svg>
                                        Settings
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setAvatarOpen(false); handleLogout(); }}
                                        style={{
                                            padding: '0.75rem 1.2rem', color: '#e74c3c', fontSize: '0.9rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s', borderTop: '1px solid rgba(255,255,255,0.06)',
                                            fontWeight: 500
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Sign Out
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
