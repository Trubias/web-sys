import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { useCurrency } from '../utils/currency';

export default function UserLayout({ children }) {
    const { user, logout, cartCount } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    useCurrency();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/user/notifications');
            setNotifications(res.data);
        } catch (e) { }
    }

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const handleMarkAllRead = async () => {
        try {
            await axios.post('/api/user/notifications/read');
            fetchNotifications();
        } catch (e) { }
    }

    const handleClearAll = async () => {
        try {
            await axios.delete('/api/user/notifications');
            fetchNotifications();
        } catch (e) { }
    }

    const handleMarkSingleRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        try {
            await axios.put(`/api/user/notifications/${id}/read`);
        } catch (e) { }
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearchOpen(false);
        const q = searchQuery.trim().toLowerCase();
        if (q === 'home') navigate('/user/dashboard');
        else if (q === 'browse' || q === 'browse products') navigate('/user/browse');
        else if (q === 'wishlist') navigate('/user/wishlist');
        else if (q === 'profile') navigate('/user/profile');
        else if (q === 'orders') navigate('/user/orders');
        else navigate(`/user/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    };

    const navLinks = [
        { path: '/user/dashboard', label: 'Home' },
        { path: '/user/browse', label: 'Browse Products' },
        { path: '/user/wishlist', label: 'Wishlist' },
        { path: '/user/orders', label: 'Orders' }
    ];

    // Bottom nav items (mobile)
    const bottomNavItems = [
        {
            path: '/user/dashboard', label: 'Home',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
        },
        {
            path: '/user/wishlist', label: 'Wishlist',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        },
        {
            path: '/user/cart', label: 'Cart',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
            badge: cartCount
        },
        {
            path: '/user/orders', label: 'Orders',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
        },
    ];

    return (
        <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Top Navigation */}
            <header style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: '#0a0a0a',
                color: '#fff',
                padding: '0 1rem',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(201,168,76,0.2)',
                boxSizing: 'border-box',
                overflow: 'visible',
            }}>
                {/* Left: Logo + Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                    <Link to="/user/dashboard" style={{
                        textDecoration: 'none', color: '#C9A84C',
                        fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.5px',
                        whiteSpace: 'nowrap'
                    }}>
                        JK Watch
                    </Link>

                    <nav className="mobile-hide" style={{ display: 'flex', gap: '2rem' }}>
                        {navLinks.map(link => {
                            const isActive = location.pathname.includes(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    style={{
                                        color: isActive ? '#C9A84C' : '#fff',
                                        textDecoration: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        paddingBottom: '0.3rem',
                                        borderBottom: isActive ? '2px solid #C9A84C' : '2px solid transparent',
                                        transition: 'all 0.2s ease',
                                        opacity: isActive ? 1 : 0.7
                                    }}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Right: Icon Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>

                    {/* Search */}
                    <div ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        {isSearchOpen && (
                            <form onSubmit={handleSearchSubmit} className="jk-search-form">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="jk-search-input"
                                />
                            </form>
                        )}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="jk-search-toggle"
                            style={{ color: isSearchOpen ? '#C9A84C' : '#fff', opacity: isSearchOpen ? 1 : 0.8 }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </button>
                    </div>

                    {/* Notifications */}
                    <div ref={notifRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8, position: 'relative', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: 4, right: 4, background: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        {isNotifOpen && (
                            <div className="mobile-notification-dropdown" style={{ position: 'absolute', top: '50px', right: '-10px', width: '320px', background: '#1a1a1a', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h3>
                                    {notifications.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                                            <button onClick={handleMarkAllRead} style={{ background: 'transparent', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}>Mark All Read</button>
                                            <button onClick={handleClearAll} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}>Clear All</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>No notifications yet.</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} onClick={() => { if (!n.is_read) handleMarkSingleRead(n.id); }} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: n.is_read ? 'transparent' : 'rgba(201,168,76,0.05)', display: 'flex', gap: '1rem', opacity: n.is_read ? 0.7 : 1, cursor: n.is_read ? 'default' : 'pointer' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : '#C9A84C', marginTop: 6, flexShrink: 0 }}></div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.4rem' }}>{n.message}</div>
                                                    <div style={{ color: '#666', fontSize: '0.7rem' }}>{new Date(n.created_at).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cart (desktop only) */}
                    <Link to="/user/cart" className="mobile-hide" style={{ position: 'relative', color: '#fff', opacity: 0.8, minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                        {cartCount > 0 && (
                            <span style={{ position: 'absolute', top: 2, right: 2, background: '#C9A84C', color: '#000', fontSize: '10px', fontWeight: 'bold', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Avatar + Dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                width: 34, height: 34, borderRadius: '50%', background: '#C9A84C', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                                fontSize: '1rem', cursor: 'pointer',
                                userSelect: 'none',
                                overflow: 'hidden',
                                flexShrink: 0,
                            }}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>

                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '44px',
                                right: 0,
                                width: '180px',
                                background: '#1a1a1a',
                                borderRadius: '8px',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                                zIndex: 1100,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>{user?.name || 'User'}</div>
                                </div>
                                <Link
                                    to="/user/profile"
                                    style={{ padding: '0.8rem 1rem', color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                    onClick={() => setIsDropdownOpen(false)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    style={{ padding: '0.8rem 1rem', background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Hamburger (mobile only) */}
                    <button
                        className="mobile-show-flex"
                        style={{ display: 'none', flexDirection: 'column', gap: '5px', cursor: 'pointer', background: 'transparent', border: 'none', marginLeft: '0.25rem', minWidth: '44px', minHeight: '44px', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setIsMobileMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                    >
                        <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff' }} />
                        <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff' }} />
                        <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff' }} />
                    </button>
                </div>
            </header>

            {/* Mobile Nav Overlay */}
            {isMobileMenuOpen && (
                <div style={{ position: 'fixed', top: '60px', left: 0, right: 0, background: '#0a0a0a', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 999 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {navLinks.map(link => {
                            const isActive = location.pathname.includes(link.path);
                            return (
                                <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} style={{ color: isActive ? '#C9A84C' : '#fff', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main style={{ paddingBottom: '5rem' }}>
                {children}
            </main>

            {/* Bottom Navigation Bar (Mobile Only) */}
            <nav className="mobile-show" style={{
                display: 'none',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60px',
                backgroundColor: '#0a0a0a',
                borderTop: '1px solid rgba(201,168,76,0.2)',
                zIndex: 1000,
                alignItems: 'center',
                justifyContent: 'space-around',
            }}>
                {bottomNavItems.map(item => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                                textDecoration: 'none',
                                flex: 1,
                                height: '100%',
                                position: 'relative',
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                transition: 'color 0.2s',
                            }}
                        >
                            {item.icon}
                            {item.label}
                            {item.badge > 0 && (
                                <span style={{ position: 'absolute', top: 6, right: '20%', background: '#C9A84C', color: '#000', fontSize: '9px', fontWeight: 'bold', width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
