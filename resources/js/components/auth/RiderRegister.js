import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function RiderRegister() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        password_confirmation: '', 
        phone: '', 
        vehicle: '',
        region: '',
        city: ''
    });
    const [govIdFile, setGovIdFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setGovIdFile(e.target.files[0]);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!govIdFile) {
            setError('Please upload a Government ID for verification.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => formData.append(key, form[key]));
            formData.append('role', 'rider');
            formData.append('status', 'pending'); // Rider needs approval
            formData.append('government_id', govIdFile);

            const axios = (await import('axios')).default;
            const res = await axios.post('/api/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Auto login after successful application to show pending screen
            const token = res.data.token;
            localStorage.setItem('jk_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            navigate('/rider/dashboard');
            window.location.reload();
        } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) setError(Object.values(errors).flat().join(' '));
            else setError(err?.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '900px' }}>
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
                    <p className="auth-subtitle">Apply to be a J&K Watch Delivery Rider.</p>

                    <div className="auth-tabs">
                        <button className="auth-tabs__btn" onClick={() => navigate('/rider-login')}>Sign In</button>
                        <button className="auth-tabs__btn active">Create Account</button>
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}

                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" className="form-input" placeholder="Juan Dela Cruz" value={form.name} onChange={e => set('name', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input type="tel" className="form-input" placeholder="+63 912 345 6789" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-group-row">
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input type="email" className="form-input" placeholder="rider@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Vehicle Information *</label>
                                <input type="text" className="form-input" placeholder="e.g., Motorcycle - Honda Click" value={form.vehicle} onChange={e => set('vehicle', e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-group-row">
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

                        <div className="form-group-row">
                            <div className="form-group">
                                <label>Password *</label>
                                <input type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <input type="password" className="form-input" placeholder="Repeat password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Government Identification (Image) *</label>
                            <div 
                                style={{
                                    border: '2px dashed #e5e7eb',
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: '#f9fafb',
                                    fontSize: '0.85rem'
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {govIdFile ? (
                                    <div style={{ color: '#27ae60', fontWeight: 600 }}>File selected: {govIdFile.name}</div>
                                ) : (
                                    <div style={{ color: '#6b7280' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}>
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg><br/>
                                        Click to upload Drivers License / Valid ID
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ background: '#111827', borderColor: '#111827', marginTop: '1rem' }}>
                            {loading ? 'Submitting Application...' : 'Apply as Rider'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
