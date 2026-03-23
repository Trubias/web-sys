import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const redirectUrl = queryParams.get('redirect') || '/user/dashboard';

    const [tab, setTab] = useState('signin');
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '', address: '', region: '', city: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSignIn = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const loggedInUser = await login(form.email, form.password, 'user');
            if (loggedInUser.role === 'admin') {
                navigate('/admin');
            } else if (loggedInUser.role === 'supplier') {
                await logout();
                setError('This is a customer login. Please use the Supplier login portal.');
            } else if (loggedInUser.role === 'rider') {
                await logout();
                setError('This account is a Rider account. Please login at the Rider login page.');
            } else {
                navigate(redirectUrl);
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally { setLoading(false); }
    };

    const handleRegister = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const axios = (await import('axios')).default;
            await axios.post('/api/register', { ...form, role: 'user' });
            await login(form.email, form.password);
            navigate(redirectUrl);
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
                        src="https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&auto=format&fit=crop"
                        alt="Luxury watch" />
                    <div className="auth-left__overlay" />
                    <div className="auth-left__content">
                        <h2 className="auth-left__title">Mastering Time.</h2>
                        <p className="auth-left__desc">Exclusive access to the world's most prestigious timepieces.</p>
                    </div>
                </div>

                {/* Right panel — forms */}
                <div className="auth-right mobile-w-full mobile-p-4">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">
                        Please enter your details to {tab === 'signin' ? 'sign in' : 'create your account'}.
                    </p>

                    <div className="auth-tabs">
                        <button className={`auth-tabs__btn${tab === 'signin' ? ' active' : ''}`}
                            onClick={() => { setTab('signin'); setError(''); }}>Sign In</button>
                        <button className={`auth-tabs__btn${tab === 'register' ? ' active' : ''}`}
                            onClick={() => { setTab('register'); setError(''); }}>Create Account</button>
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}

                    {/* Sign In */}
                    {tab === 'signin' && (
                        <form className="auth-form" onSubmit={handleSignIn}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="form-field">
                                    <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    <input type="email" className="form-input form-input--icon" placeholder="name@example.com"
                                        value={form.email} onChange={e => set('email', e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <label style={{ marginBottom: 0 }}>Password</label>
                                    <span style={{ fontSize: '0.78rem', color: '#C9A84C', cursor: 'pointer' }}>Forgot Password?</span>
                                </div>
                                <div className="form-field">
                                    <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                    <input type="password" className="form-input form-input--icon" placeholder="••••••••"
                                        value={form.password} onChange={e => set('password', e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {/* Register as User */}
                    {tab === 'register' && (
                        <form className="auth-form" onSubmit={handleRegister}>
                            <div className="form-group-row mobile-stack">
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" className="form-input" placeholder="+63 912 345 6789" value={form.phone} onChange={e => set('phone', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input type="email" className="form-input" placeholder="name@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Address *</label>
                                <input type="text" className="form-input" placeholder="Your delivery address" value={form.address} onChange={e => set('address', e.target.value)} required />
                            </div>
                            <div className="form-group-row mobile-stack">
                                <div className="form-group">
                                    <label>Region</label>
                                    <select className="form-input" value={form.region} onChange={e => set('region', e.target.value)}>
                                        <option value="">Select Region</option>
                                        <option value="Luzon">Luzon</option>
                                        <option value="Visayas">Visayas</option>
                                        <option value="Mindanao">Mindanao</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>City / Province</label>
                                    <input type="text" className="form-input" placeholder="e.g. Butuan City" value={form.city} onChange={e => set('city', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group-row mobile-stack">
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password *</label>
                                    <input type="password" className="form-input" placeholder="Repeat password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn--gold btn--full" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    {/* Supplier & Rider links */}
                    <div className="auth-supplier-link" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                        <div>
                            Are you a supplier?{' '}
                            <Link to="/supplier-login">Login as Supplier</Link>
                        </div>
                        <div>
                            Are you a rider?{' '}
                            <Link to="/rider-login">Login as Rider</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
