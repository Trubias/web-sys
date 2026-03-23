import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function SupplierLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('signin');
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '', address: '', brands: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSignIn = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role === 'user') {
                await logout();
                setError('This account is a customer account. Please use the customer login.');
                return;
            }
            if (user.role === 'rider') {
                await logout();
                setError('This account is a rider account. Please use the rider login.');
                return;
            }
            if (user.role !== 'supplier' && user.role !== 'admin') {
                await logout();
                setError('This account is not registered as a supplier.');
                return;
            }
            navigate('/supplier');
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid credentials.');
        } finally { setLoading(false); }
    };

    const handleRegister = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const axios = (await import('axios')).default;
            await axios.post('/api/register', { ...form, role: 'supplier' });
            await login(form.email, form.password);
            navigate('/supplier');
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
                        src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop"
                        alt="Supplier" />
                    <div className="auth-left__overlay" />
                    <div className="auth-left__content">
                        <h2 className="auth-left__title">Partner Portal.</h2>
                        <p className="auth-left__desc">Manage your watch inventory and grow your business with J&amp;K Watch.</p>
                    </div>
                </div>

                <div className="auth-right">
                    <h1 className="auth-title">Supplier Access</h1>
                    <p className="auth-subtitle">{tab === 'signin' ? 'Sign in to your supplier account.' : 'Register as a watch supplier.'}</p>

                    <div className="auth-tabs">
                        <button className={`auth-tabs__btn${tab === 'signin' ? ' active' : ''}`} onClick={() => { setTab('signin'); setError(''); }}>Sign In</button>
                        <button className={`auth-tabs__btn${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Create Account</button>
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}

                    {tab === 'signin' && (
                        <form className="auth-form" onSubmit={handleSignIn}>
                            <div className="form-group">
                                <label>Supplier Email</label>
                                <div className="form-field">
                                    <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    <input type="email" className="form-input form-input--icon" placeholder="supplier@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="form-field">
                                    <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                    <input type="password" className="form-input form-input--icon" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In as Supplier'}</button>
                        </form>
                    )}

                    {tab === 'register' && (
                        <form className="auth-form" onSubmit={handleRegister}>
                            <div className="form-group-row">
                                <div className="form-group"><label>Company Name *</label><input type="text" className="form-input" placeholder="Your Brand / Company" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                                <div className="form-group"><label>Contact Number</label><input type="tel" className="form-input" placeholder="+63 2 1234 5678" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                            </div>
                            <div className="form-group"><label>Business Email *</label><input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
                            <div className="form-group"><label>Brands Supplied *</label><input type="text" className="form-input" placeholder="e.g. Rolex, Omega (comma separated)" value={form.brands} onChange={e => set('brands', e.target.value)} required /></div>
                            <div className="form-group"><label>Business Address</label><input type="text" className="form-input" placeholder="Warehouse / Office address" value={form.address} onChange={e => set('address', e.target.value)} /></div>
                            <div className="form-group-row">
                                <div className="form-group"><label>Password *</label><input type="password" className="form-input" placeholder="Min. 8 chars" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} /></div>
                                <div className="form-group"><label>Confirm *</label><input type="password" className="form-input" placeholder="Repeat" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} required /></div>
                            </div>
                            <button type="submit" className="btn btn--gold btn--full" disabled={loading}>{loading ? 'Registering...' : 'Register as Supplier'}</button>
                        </form>
                    )}

                    <div className="auth-supplier-link">Customer account? <Link to="/login">Sign in as Customer</Link></div>
                </div>
            </div>
        </div>
    );
}
