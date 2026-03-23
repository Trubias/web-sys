import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

export default function Navbar() {
    const { user, logout, cartCount } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setMenuOpen(false);
    };

    const close = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar__inner">
                <Link to="/" className="navbar__logo" onClick={close}>
                    <span className="navbar__logo-text">J<span>&amp;</span>K Watch</span>
                </Link>

                <div className="navbar__links mobile-hide">
                    <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>Home</NavLink>
                    <NavLink to="/browse" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>Browse</NavLink>
                    <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>About</NavLink>
                    <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>Contact</NavLink>

                    {user ? (
                        <>
                            <Link to="/wishlist" className="navbar__cart" onClick={close} style={{ fontSize: '0.85rem' }}>
                                ♥
                            </Link>
                            <button className="navbar__btn-gold" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <NavLink to="/login" className="navbar__btn-gold" onClick={close}>
                            Login / Register
                        </NavLink>
                    )}
                </div>

                <button className="mobile-show-flex" style={{ display: 'none', flexDirection: 'column', gap: '5px', cursor: 'pointer', background: 'transparent', border: 'none', padding: '0.5rem' }} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
                    <span style={{ display: 'block', width: '25px', height: '2px', background: '#fff', transition: 'all 0.3s' }} />
                    <span style={{ display: 'block', width: '25px', height: '2px', background: '#fff', transition: 'all 0.3s' }} />
                    <span style={{ display: 'block', width: '25px', height: '2px', background: '#fff', transition: 'all 0.3s' }} />
                </button>

                {menuOpen && (
                    <div className="mobile-show" style={{ display: 'none', position: 'absolute', top: '100%', left: 0, right: 0, background: '#0a0a0a', borderTop: '1px solid #222', zIndex: 999 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem' }}>
                            <NavLink to="/" end style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }} onClick={close}>Home</NavLink>
                            <NavLink to="/browse" style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }} onClick={close}>Browse</NavLink>
                            <NavLink to="/about" style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }} onClick={close}>About</NavLink>
                            <NavLink to="/contact" style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }} onClick={close}>Contact</NavLink>

                            {user ? (
                                <button className="navbar__btn-gold" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', textAlign: 'center' }} onClick={handleLogout}>Logout</button>
                            ) : (
                                <NavLink to="/login" className="navbar__btn-gold" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', textAlign: 'center', boxSizing: 'border-box' }} onClick={close}>
                                    Login / Register
                                </NavLink>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
