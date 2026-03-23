import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '', address: '', region: '', city: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const res = await axios.post('/api/register', { ...form, role: 'user' });
            const token = res.data.token;
            localStorage.setItem('jk_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            navigate('/');
            window.location.reload();
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setError(Object.values(errors).flat().join(' '));
            else setError(err?.response?.data?.message || 'Registration failed.');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-left mobile-hide">
                    <img className="auth-left__image"
                        src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&auto=format&fit=crop"
                        alt="Watch" />
                    <div className="auth-left__overlay" />
                    <div className="auth-left__content">
                        <h2 className="auth-left__title">Join the Circle.</h2>
                        <p className="auth-left__desc">Become a member and access exclusive timepiece collections.</p>
                    </div>
                </div>
                <div className="auth-right mobile-w-full mobile-p-4">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Register as a customer to start shopping.</p>

                    {error && <div className="alert alert--error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group-row mobile-stack">
                            <div className="form-group"><label>Full Name *</label><input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                            <div className="form-group"><label>Phone Number</label><input type="tel" className="form-input" placeholder="+63 912 345 6789" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                        </div>
                        <div className="form-group"><label>Email Address *</label><input type="email" className="form-input" placeholder="name@example.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
                        
                        <div className="form-group-row mobile-stack">
                            <div className="form-group">
                                <label>Region *</label>
                                <select className="form-input" value={form.region} onChange={e => set('region', e.target.value)} required>
                                    <option value="">Select Region</option>
                                    <option value="Luzon">Luzon</option>
                                    <option value="Visayas">Visayas</option>
                                    <option value="Mindanao">Mindanao</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>City / Province *</label>
                                <input type="text" className="form-input" placeholder="e.g. Butuan City" value={form.city} onChange={e => set('city', e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-group"><label>Delivery Address</label><input type="text" className="form-input" placeholder="Your street delivery address" value={form.address} onChange={e => set('address', e.target.value)} /></div>
                        <div className="form-group-row mobile-stack">
                            <div className="form-group"><label>Password *</label><input type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} /></div>
                            <div className="form-group"><label>Confirm Password *</label><input type="password" className="form-input" placeholder="Repeat password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} required /></div>
                        </div>
                        <button type="submit" className="btn btn--gold btn--full" disabled={loading}>{loading ? 'Creating Account...' : 'Create My Account'}</button>
                    </form>
                    <div className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></div>
                    <div className="auth-supplier-link">Are you a supplier? <Link to="/supplier-login">Login as Supplier</Link></div>
                </div>
            </div>
        </div>
    );
}
