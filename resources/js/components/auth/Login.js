import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const redirectUrl = queryParams.get('redirect') || '/user/dashboard';
    
    // States for toggling views
    const [view, setView] = useState('signin'); // 'signin' or 'signup'
    const [signupType, setSignupType] = useState('customer'); // 'customer', 'supplier', 'rider'
    
    // Sign In form state
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Registration common states
    const [registerError, setRegisterError] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    // Customer Registration form state
    const [customerForm, setCustomerForm] = useState({ 
        name: '', email: '', password: '', password_confirmation: '', 
        phone: '', address: '', region: '', city: '' 
    });

    // Supplier Registration form state
    const [supplierForm, setSupplierForm] = useState({ 
        name: '', email: '', password: '', password_confirmation: '', 
        phone: '', address: '', brands: '' 
    });

    // Rider Registration form state
    const [riderForm, setRiderForm] = useState({ 
        name: '', email: '', password: '', password_confirmation: '', 
        phone: '', vehicle: '', region: '', city: '' 
    });
    const [govIdFile, setGovIdFile] = useState(null);
    const fileInputRef = useRef(null);

    const setL = (k, v) => setLoginForm(f => ({ ...f, [k]: v }));
    const setC = (k, v) => setCustomerForm(f => ({ ...f, [k]: v }));
    const setS = (k, v) => setSupplierForm(f => ({ ...f, [k]: v }));
    const setR = (k, v) => setRiderForm(f => ({ ...f, [k]: v }));

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setGovIdFile(e.target.files[0]);
        }
    };

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
    }, [carouselSlides.length]);

    const handleSignIn = async (e) => {
        e.preventDefault(); 
        setLoginError(''); 
        setLoginLoading(true);
        try {
            const loggedInUser = await login(loginForm.email, loginForm.password);
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
            setLoginError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally { 
            setLoginLoading(false); 
        }
    };

    const handleCustomerRegister = async (e) => {
        e.preventDefault(); 
        setRegisterError(''); 
        setRegisterLoading(true);
        try {
            const res = await axios.post('/api/register', { ...customerForm, role: 'user' });
            const token = res.data.token;
            localStorage.setItem('jk_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            navigate('/');
            window.location.reload();
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setRegisterError(Object.values(errors).flat().join(' '));
            else setRegisterError(err?.response?.data?.message || 'Registration failed.');
        } finally { 
            setRegisterLoading(false); 
        }
    };

    const handleSupplierRegister = async (e) => {
        e.preventDefault(); 
        setRegisterError(''); 
        setRegisterLoading(true);
        try {
            await axios.post('/api/register', { ...supplierForm, role: 'supplier' });
            setRegisterSuccess(true);
            setTimeout(() => {
                setRegisterSuccess(false);
                setView('signin');
            }, 3000);
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setRegisterError(Object.values(errors).flat().join(' '));
            else setRegisterError(err?.response?.data?.message || 'Registration failed.');
        } finally { 
            setRegisterLoading(false); 
        }
    };

    const handleRiderRegister = async (e) => {
        e.preventDefault();
        setRegisterError('');
        
        if (!govIdFile) {
            setRegisterError('Please upload a Government ID for verification.');
            return;
        }

        setRegisterLoading(true);
        try {
            const formData = new FormData();
            Object.keys(riderForm).forEach(key => formData.append(key, riderForm[key]));
            formData.append('role', 'rider');
            formData.append('status', 'pending');
            formData.append('government_id', govIdFile);

            const res = await axios.post('/api/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setRegisterSuccess(true);
            const token = res.data.token;
            localStorage.setItem('jk_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setTimeout(() => {
                navigate('/rider/dashboard');
                window.location.reload();
            }, 2000);
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setRegisterError(Object.values(errors).flat().join(' '));
            else setRegisterError(err?.response?.data?.message || 'Registration failed.');
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '1000px' }}>
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

                {/* Right panel */}
                <div className="auth-right mobile-w-full mobile-p-4">
                    <h1 className="auth-title">Welcome to J&K Watch</h1>
                    <p className="auth-subtitle">
                        Manage your timepieces or your deliveries from one single portal.
                    </p>

                    <div className="auth-tabs" style={{ marginBottom: '2rem' }}>
                        <button 
                            className={`auth-tabs__btn ${view === 'signin' ? 'active' : ''}`} 
                            onClick={() => { setView('signin'); setLoginError(''); }}
                        >
                            Sign In
                        </button>
                        <button 
                            className={`auth-tabs__btn ${view === 'signup' ? 'active' : ''}`} 
                            onClick={() => { setView('signup'); setSignupType('customer'); setRegisterError(''); }}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* SIGN IN FORM */}
                    {view === 'signin' && (
                        <div>
                            {loginError && <div className="alert alert--error">{loginError}</div>}
                            <form className="auth-form" onSubmit={handleSignIn}>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div className="form-field">
                                        <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                        <input type="email" className="form-input form-input--icon" placeholder="name@example.com"
                                            value={loginForm.email} onChange={e => setL('email', e.target.value)} required />
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
                                            value={loginForm.password} onChange={e => setL('password', e.target.value)} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn--gold btn--full" disabled={loginLoading} style={{ marginTop: '1rem' }}>
                                    {loginLoading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* SIGN UP FORM */}
                    {view === 'signup' && (
                        <div>
                            {registerSuccess && <div className="alert alert--success">Registration successful! Redirecting...</div>}
                            {registerError && <div className="alert alert--error">{registerError}</div>}

                            {/* CUSTOMER FORM */}
                            {signupType === 'customer' && (
                                <form className="auth-form" onSubmit={handleCustomerRegister}>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group"><label>Full Name *</label><input type="text" className="form-input" placeholder="John Doe" value={customerForm.name} onChange={e => setC('name', e.target.value)} required /></div>
                                        <div className="form-group"><label>Phone Number</label><input type="tel" className="form-input" placeholder="+63 912 345 6789" value={customerForm.phone} onChange={e => setC('phone', e.target.value)} /></div>
                                    </div>
                                    <div className="form-group"><label>Email Address *</label><input type="email" className="form-input" placeholder="name@example.com" value={customerForm.email} onChange={e => setC('email', e.target.value)} required /></div>
                                    
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group">
                                            <label>Region *</label>
                                            <select className="form-input" value={customerForm.region} onChange={e => setC('region', e.target.value)} required>
                                                <option value="">Select Region</option>
                                                <option value="Luzon">Luzon</option>
                                                <option value="Visayas">Visayas</option>
                                                <option value="Mindanao">Mindanao</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>City / Province *</label>
                                            <input type="text" className="form-input" placeholder="e.g. Butuan City" value={customerForm.city} onChange={e => setC('city', e.target.value)} required />
                                        </div>
                                    </div>

                                    <div className="form-group"><label>Delivery Address</label><input type="text" className="form-input" placeholder="Your street delivery address" value={customerForm.address} onChange={e => setC('address', e.target.value)} /></div>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group"><label>Password *</label><input type="password" className="form-input" placeholder="Min. 8 characters" value={customerForm.password} onChange={e => setC('password', e.target.value)} required minLength={8} /></div>
                                        <div className="form-group"><label>Confirm Password *</label><input type="password" className="form-input" placeholder="Repeat password" value={customerForm.password_confirmation} onChange={e => setC('password_confirmation', e.target.value)} required /></div>
                                    </div>
                                    <button type="submit" className="btn btn--gold btn--full" disabled={registerLoading}>{registerLoading ? 'Creating Account...' : 'Create My Account'}</button>
                                </form>
                            )}

                            {/* SUPPLIER FORM */}
                            {signupType === 'supplier' && (
                                <form className="auth-form" onSubmit={handleSupplierRegister}>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group"><label>Company / Brand Name *</label><input type="text" className="form-input" placeholder="Your Company Name" value={supplierForm.name} onChange={e => setS('name', e.target.value)} required /></div>
                                        <div className="form-group"><label>Contact Number</label><input type="tel" className="form-input" placeholder="+63 2 1234 5678" value={supplierForm.phone} onChange={e => setS('phone', e.target.value)} /></div>
                                    </div>
                                    <div className="form-group"><label>Business Email *</label><input type="email" className="form-input" placeholder="supplier@company.com" value={supplierForm.email} onChange={e => setS('email', e.target.value)} required /></div>
                                    <div className="form-group"><label>Brands Supplied *</label><input type="text" className="form-input" placeholder="e.g. Rolex, Omega (comma separated)" value={supplierForm.brands} onChange={e => setS('brands', e.target.value)} required /></div>
                                    <div className="form-group"><label>Business Address</label><input type="text" className="form-input" placeholder="Warehouse / Office address" value={supplierForm.address} onChange={e => setS('address', e.target.value)} /></div>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group"><label>Password *</label><input type="password" className="form-input" placeholder="Min. 8 characters" value={supplierForm.password} onChange={e => setS('password', e.target.value)} required minLength={8} /></div>
                                        <div className="form-group"><label>Confirm Password *</label><input type="password" className="form-input" placeholder="Repeat password" value={supplierForm.password_confirmation} onChange={e => setS('password_confirmation', e.target.value)} required /></div>
                                    </div>
                                    <button type="submit" className="btn btn--gold btn--full" disabled={registerLoading}>{registerLoading ? 'Registering...' : 'Register as Supplier'}</button>
                                </form>
                            )}

                            {/* RIDER FORM */}
                            {signupType === 'rider' && (
                                <form className="auth-form" onSubmit={handleRiderRegister}>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group"><label>Full Name *</label><input type="text" className="form-input" placeholder="Juan Dela Cruz" value={riderForm.name} onChange={e => setR('name', e.target.value)} required /></div>
                                        <div className="form-group"><label>Phone Number *</label><input type="tel" className="form-input" placeholder="+63 912 345 6789" value={riderForm.phone} onChange={e => setR('phone', e.target.value)} required /></div>
                                    </div>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group"><label>Email Address *</label><input type="email" className="form-input" placeholder="rider@example.com" value={riderForm.email} onChange={e => setR('email', e.target.value)} required /></div>
                                        <div className="form-group"><label>Vehicle Information *</label><input type="text" className="form-input" placeholder="e.g., Motorcycle" value={riderForm.vehicle} onChange={e => setR('vehicle', e.target.value)} required /></div>
                                    </div>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group">
                                            <label>Region *</label>
                                            <select className="form-input" value={riderForm.region} onChange={e => setR('region', e.target.value)} required>
                                                <option value="">Select Region</option>
                                                <option value="Luzon">Luzon</option>
                                                <option value="Visayas">Visayas</option>
                                                <option value="Mindanao">Mindanao</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>City / Province *</label>
                                            <input type="text" className="form-input" placeholder="e.g. Butuan City" value={riderForm.city} onChange={e => setR('city', e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="form-group-row mobile-stack">
                                        <div className="form-group"><label>Password *</label><input type="password" className="form-input" placeholder="Min. 8 characters" value={riderForm.password} onChange={e => setR('password', e.target.value)} required minLength={8} /></div>
                                        <div className="form-group"><label>Confirm Password *</label><input type="password" className="form-input" placeholder="Repeat password" value={riderForm.password_confirmation} onChange={e => setR('password_confirmation', e.target.value)} required /></div>
                                    </div>
                                    <div className="form-group">
                                        <label>Government Identification (Image) *</label>
                                        <div 
                                            style={{
                                                border: '2px dashed #e5e7eb', padding: '1rem', textAlign: 'center', borderRadius: '6px',
                                                cursor: 'pointer', background: '#f9fafb', fontSize: '0.85rem'
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {govIdFile ? <div style={{ color: '#27ae60', fontWeight: 600 }}>File: {govIdFile.name}</div> : "Click to upload ID image"}
                                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn--gold btn--full" disabled={registerLoading} style={{ marginTop: '1rem' }}>
                                        {registerLoading ? 'Submitting Application...' : 'Apply as Rider'}
                                    </button>
                                </form>
                            )}

                            {/* SWITCHER LINKS */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {signupType !== 'customer' && (
                                    <button onClick={() => setSignupType('customer')} className="btn btn--outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                                        Register as Customer
                                    </button>
                                )}
                                {signupType !== 'supplier' && (
                                    <button onClick={() => setSignupType('supplier')} className="btn btn--outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                                        Register as Supplier
                                    </button>
                                )}
                                {signupType !== 'rider' && (
                                    <button onClick={() => setSignupType('rider')} className="btn btn--outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                                        Register as Rider
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

