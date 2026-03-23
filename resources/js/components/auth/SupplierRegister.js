import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function SupplierRegister() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '', address: '', brands: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            await axios.post('/api/register', { ...form, role: 'supplier' });
            setSuccess(true);
            setTimeout(() => navigate('/supplier-login'), 2000);
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setError(Object.values(errors).flat().join(' '));
            else setError(err?.response?.data?.message || 'Registration failed.');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-left">
                    <img className="auth-left__image"
                        src="https://images.unsplash.com/photo-1509343256512-d77a5cb3791b?w=600&auto=format&fit=crop"
                        alt="Supplier" />
                    <div className="auth-left__overlay" />
                    <div className="auth-left__content">
                        <h2 className="auth-left__title">Grow With Us.</h2>
                        <p className="auth-left__desc">Join J&amp;K Watch as an authorised supplier and reach thousands of collectors.</p>
                    </div>
                </div>
                <div className="auth-right">
                    <h1 className="auth-title">Supplier Registration</h1>
                    <p className="auth-subtitle">Register your company to start supplying luxury watches.</p>

                    {success && <div className="alert alert--success">Account created! Redirecting to login...</div>}
                    {error && <div className="alert alert--error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group-row">
                            <div className="form-group"><label>Company / Brand Name *</label><input type="text" className="form-input" placeholder="Your Company Name" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                            <div className="form-group"><label>Contact Number</label><input type="tel" className="form-input" placeholder="+63 2 1234 5678" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                        </div>
                        <div className="form-group"><label>Business Email *</label><input type="email" className="form-input" placeholder="supplier@company.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
                        <div className="form-group"><label>Brands Supplied *</label><input type="text" className="form-input" placeholder="e.g. Rolex, Omega (comma separated)" value={form.brands} onChange={e => set('brands', e.target.value)} required /></div>
                        <div className="form-group"><label>Business Address</label><input type="text" className="form-input" placeholder="Warehouse / Office address" value={form.address} onChange={e => set('address', e.target.value)} /></div>
                        <div className="form-group-row">
                            <div className="form-group"><label>Password *</label><input type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} /></div>
                            <div className="form-group"><label>Confirm Password *</label><input type="password" className="form-input" placeholder="Repeat password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} required /></div>
                        </div>
                        <button type="submit" className="btn btn--gold btn--full" disabled={loading || success}>
                            {loading ? 'Registering...' : 'Register as Supplier'}
                        </button>
                    </form>
                    <div className="auth-footer">Already have an account? <Link to="/supplier-login">Sign In as Supplier</Link></div>
                </div>
            </div>
        </div>
    );
}
