import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function RiderLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const loggedInUser = await login(form.email, form.password, 'rider');
            if (loggedInUser.role !== 'rider') {
                await logout();
                setError('This account is not a Rider account. Please login at the Customer login page.');
                return;
            }
            // Immediately check their status explicitly from the DB response:
            if (loggedInUser.status === 'active' || loggedInUser.rider_status === 'active') {
                navigate('/rider/home');
            } else if (loggedInUser.status === 'pending' || loggedInUser.rider_status === 'pending' || loggedInUser.rider_status === 'interview_scheduled') {
                // Navigate to the rider portal where RiderLayout natively mounts the waiting screen
                navigate('/rider/home');
            } else {
                navigate('/rider/home');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid rider credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Left panel */}
                <div className="auth-left">
                    <img className="auth-left__image"
                        src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop"
                        alt="Rider on motorcycle" />
                    <div className="auth-left__overlay" />
                    <div className="auth-left__content">
                        <h2 className="auth-left__title">Rider Portal.</h2>
                        <p className="auth-left__desc">Manage your deliveries and become a part of the J&K Watch delivery network.</p>
                    </div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <h1 className="auth-title">Rider Access</h1>
                    <p className="auth-subtitle">Sign in to your rider account.</p>

                    <div className="auth-tabs">
                        <button className="auth-tabs__btn active">Sign In</button>
                        <button className="auth-tabs__btn" onClick={() => navigate('/rider-register')}>Create Account</button>
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}

                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Rider Email</label>
                            <div className="form-field">
                                <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                <input type="email" className="form-input form-input--icon" placeholder="rider@company.com"
                                    value={form.email} onChange={e => set('email', e.target.value)} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="form-field">
                                <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                <input type="password" className="form-input form-input--icon" placeholder="••••••••"
                                    value={form.password} onChange={e => set('password', e.target.value)} required />
                            </div>
                        </div>
                        
                        <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ background: '#111827', borderColor: '#111827' }}>
                            {loading ? 'Signing in...' : 'Sign In as Rider'}
                        </button>

                        <div className="auth-supplier-link" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            Customer account?{' '}
                            <Link to="/login">Sign in as Customer</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
