import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__grid">
                    {/* Brand */}
                    <div>
                        <div className="footer__logo">⌚ J<span>&amp;</span>K Watch</div>
                        <p className="footer__desc">Curating the finest horological masterpieces for those who appreciate timeless craftsmanship and elegance in luxury timepieces in Manila.</p>
                        <div style={{ color: '#C9A84C', fontSize: '0.8rem' }}>📘</div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <div className="footer__col-title">Quick Links</div>
                        <div className="footer__links">
                            <Link to="/">Home</Link>
                            <Link to="/browse">Browse</Link>
                            <Link to="/about">About</Link>
                            <Link to="/contact">Contact</Link>
                        </div>
                    </div>

                    {/* Top Brands */}
                    <div>
                        <div className="footer__col-title">Top Brands</div>
                        <div className="footer__links">
                            <Link to="/browse?brand=rolex">Rolex</Link>
                            <Link to="/browse?brand=omega">Omega</Link>
                            <Link to="/browse?brand=seiko">Seiko</Link>
                            <Link to="/browse?brand=cartier">Cartier</Link>
                            <Link to="/browse?brand=jaeger">Jaeger</Link>
                            <Link to="/browse">Others</Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <div className="footer__col-title">Contact</div>
                        <div className="footer__contact-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            <span>123 Bonifacio High St, Taguig, Manila, Philippines</span>
                        </div>
                        <div className="footer__contact-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012.91 2h3a2 2 0 012 1.72 19.5 19.5 0 00.7 2.81 2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                            <span>+63 2 1234 5678</span>
                        </div>
                        <div className="footer__contact-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                            <span>jaywarrentrubias2019@gmail.com</span>
                        </div>
                        <div className="footer__contact-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            <span>Mon–Sat: 10AM – 6PM</span>
                        </div>
                    </div>
                </div>

                <div className="footer__bottom">
                    <span>⌚ J&amp;K Watch Luxury Timepieces. All rights reserved.</span>
                    <div className="footer__bottom-links">
                        <Link to="/contact">Privacy Policy</Link>
                        <Link to="/contact">Terms of Service</Link>
                        <Link to="/contact">Warranty</Link>
                        <Link to="/contact">Contact Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
