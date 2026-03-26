import React, { useState } from 'react';
import axios from 'axios';
import Footer from '../Footer';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.message) { setError('Please fill all required fields.'); return; }
        
        setLoading(true);
        try {
            console.log('Sending contact inquiry...', form);
            await axios.post('/api/contact', form);
            console.log('Success!');
            setSent(true);
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            console.error('Email error:', err);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Hero */}
            <section className="contact-hero">
                <div className="container">
                    <h1>GET IN TOUCH</h1>
                    <p>Whether you're looking for a specific timepiece, need servicing, or have questions about our collection, our experts are here to assist you.</p>
                </div>
            </section>

            {/* Content */}
            <section className="contact-content">
                <div className="container">
                    <div className="contact-content__grid mobile-stack">
                        {/* Form */}
                        <div className="contact-form">
                            <h2>SEND US A MESSAGE</h2>
                            {sent && <div className="alert alert--success">Message sent! We'll be in touch within 24 hours.</div>}
                            {error && <div className="alert alert--error">{error}</div>}
                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group-row mobile-stack">
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address *</label>
                                        <input type="email" className="form-input" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <select className="form-input" value={form.subject} onChange={e => set('subject', e.target.value)}>
                                        <option value="">Select inquiry type</option>
                                        <option>Product Inquiry</option>
                                        <option>Watch Servicing</option>
                                        <option>Warranty Claim</option>
                                        <option>Order Status</option>
                                        <option>General Question</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Message *</label>
                                    <textarea className="form-input" rows={5} placeholder="How can we help you today?" value={form.message} onChange={e => set('message', e.target.value)} required />
                                </div>
                                <button type="submit" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                                    {loading ? 'SENDING...' : 'SEND MESSAGE →'}
                                </button>
                            </form>
                        </div>

                        {/* Info */}
                        <div className="contact-info">
                            <h2>VISIT OUR BOUTIQUE</h2>
                            <div className="contact-info__map">
                                <iframe
                                    title="Boutique Location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.5!2d121.0437!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDMzJzE3LjAiTiAxMjHCsDAyJzM3LjMiRQ!5e0!3m2!1sen!2sph!4v1"
                                    allowFullScreen=""
                                    loading="lazy"
                                />
                            </div>

                            <div className="contact-info__item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                <div>
                                    <h4>Boutique Address</h4>
                                    <p>123 Bonifacio High Street, Suite 400<br />Taguig, Manila, Philippines</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                <div className="contact-info__item">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    <div>
                                        <h4>Opening Hours</h4>
                                        <p>Mon–Fri: 10:00 AM – 7:00 PM<br />Saturday: 10:00 AM – 6:00 PM<br />Sunday: Closed</p>
                                    </div>
                                </div>
                            </div>

                            <div className="contact-info__item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012.91 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                                <div>
                                    <h4>Contact Details</h4>
                                    <p>Phone: +63 2 1234 5678<br />Email: jayandkit.noreply@gmail.com</p>
                                </div>
                            </div>

                            <div>
                                <p style={{ fontSize: '0.82rem', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.75rem', color: '#C9A84C' }}>FOLLOW US</p>
                                <div className="contact-info__social">
                                    {/* Instagram */}
                                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="contact-info__social-btn" title="Instagram">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                        </svg>
                                    </a>
                                    {/* TikTok */}
                                    <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="contact-info__social-btn" title="TikTok">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
