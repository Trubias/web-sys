import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const redirectUrl = queryParams.get('redirect') || '/user/dashboard';

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const carouselSlides = [
        {
            image: "https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&auto=format&fit=crop",
            title: "Mastering Time.",
            desc: "Exclusive access to the world's most prestigious timepieces."
        },
        {
            image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop",
            title: "Partner Portal.",
            desc: "Manage your watch inventory and grow your business with J&K Watch."
        },
        {
            image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop",
            title: "Rider Portal.",
            desc: "Manage your deliveries and become a part of the J&K Watch delivery network."
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSignIn = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const loggedInUser = await login(form.email, form.password);
            if (loggedInUser.role === 'admin') {
                navigate('/admin');
            } else if (loggedInUser.role === 'supplier') {
                navigate('/supplier');
            } else if (loggedInUser.role === 'rider') {
                navigate('/rider/home');
            } else {
                navigate(redirectUrl);
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-left mobile-hide" style={{ position: 'relative', overflow: 'hidden' }}>
                    {carouselSlides.map((slide, index) => (
                        <div 
                            key={index} 
                            style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '100%', 
                                opacity: currentSlide === index ? 1 : 0, 
                                transition: 'opacity 1s ease-in-out',
                                zIndex: currentSlide === index ? 1 : 0
                            }}
                        >
                            <img className="auth-left__image" src={slide.image} alt={slide.title} />
                            <div className="auth-left__overlay" />
                            <div className="auth-left__content">
                                <h2 className="auth-left__title">{slide.title}</h2>
                                <p className="auth-left__desc">{slide.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right panel — forms */}
                <div className="auth-right mobile-w-full mobile-p-4">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">
                        Please enter your details to sign in.
                    </p>

                    {error && <div className="alert alert--error">{error}</div>}

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

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <Link to="/supplier-register" className="btn btn--outline" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                                Register as Supplier
                            </Link>
                            <Link to="/rider-register" className="btn btn--outline" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                                Register as Rider
                            </Link>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link to="/register" style={{ color: '#6b7280', fontSize: '0.875rem' }}>Are you a new customer? Register here</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

