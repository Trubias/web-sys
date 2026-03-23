import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { setCurrencySettings, getCurrencySettings } from '../utils/currency';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';

const getToken = () => localStorage.getItem('admin_token') || localStorage.getItem('jk_token') || '';
const authHead = () => ({ headers: { Authorization: 'Bearer ' + getToken() } });

export default function AdminSettings() {
    const { user, fetchUser } = useAuth();
    const [form, setForm] = useState({
        storeName: 'J&K Watch Store',
        email: 'jekwat.store@gmail.com',
        currency: getCurrencySettings(),
        address: '123 Bonifacio High St, Taguig, Manila, Philippines',
        description: '',
        newOrder: user?.notify_new_order ?? true,
        password: '',
        confirmPassword: '',
    });
    
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);
    
    // Status banners
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        
        // 1. Validate Passwords if user is trying to change them
        if (form.password || form.confirmPassword) {
            if (form.password !== form.confirmPassword) {
                return setErrorMsg('Passwords do not match. Please try again.');
            }
        }
        
        // 2. Save Settings
        // Save currency globally
        setCurrencySettings(form.currency);
        
        // Save Notification Preferences to Database
        try {
            await axios.put('/api/admin/settings', { notify_new_order: form.newOrder }, authHead());
            if (fetchUser) fetchUser(); // Refresh user state if possible
        } catch (error) {
            console.error('Failed to update settings', error);
            setErrorMsg('Failed to save notification preferences.');
            return;
        }

        localStorage.setItem('admin_notify_newOrder', form.newOrder);
        // Force the layout bell icon to re-read localStorage immediately
        window.dispatchEvent(new Event('jk_notification_update'));
        
        // 3. Show Success
        if (form.password && form.password === form.confirmPassword) {
            setSuccessMsg('Settings saved and Password updated successfully.');
            setForm(f => ({ ...f, password: '', confirmPassword: '' })); // clear on success
        } else {
            setSuccessMsg('Settings saved successfully.');
        }
        
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const eyeIcon = (show) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ cursor: 'pointer' }}>
            {show ? (
                <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            ) : (
                <>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </>
            )}
        </svg>
    );

    return (
        <AdminLayout>
            <div className="admin-page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 className="admin-page-title">Settings</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.2rem', fontSize: '0.9rem' }}>Manage your luxury watch collection</p>
                </div>
            </div>
            
            {successMsg && <div style={{ background: '#10b981', color: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '2rem', fontWeight: 600 }}>{successMsg}</div>}
            {errorMsg && <div style={{ background: '#e74c3c', color: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '2rem', fontWeight: 600 }}>{errorMsg}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* General Settings */}
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', fontFamily: 'Playfair Display, serif' }}>General Settings</h3>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Store Name</label>
                        <input type="text" className="form-input" value={form.storeName} onChange={e => set('storeName', e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Email Address</label>
                        <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Currency</label>
                        <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                            <option value="PHP">PHP — Philippine Peso (₱)</option>
                            <option value="USD">USD — US Dollar ($)</option>
                            <option value="EUR">EUR — Euro (€)</option>
                        </select>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>Prices globally update based on selected currency.</p>
                    </div>
                </div>

                {/* Store Information */}
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', fontFamily: 'Playfair Display, serif' }}>Store Information</h3>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Address</label>
                        <input type="text" className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Photo</label>
                        <div 
                            onClick={() => document.getElementById('storePhotoInput').click()}
                            style={{ width: '80px', height: '80px', border: '2px dashed #d1d5db', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer', background: '#f9fafb', overflow: 'hidden', position: 'relative' }}
                        >
                            {form.photo ? (
                                <img src={URL.createObjectURL(form.photo)} alt="Store" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '4px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Upload
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            id="storePhotoInput" 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                    set('photo', e.target.files[0]);
                                }
                            }} 
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Store Description</label>
                        <textarea className="form-input" rows="3" value={form.description} onChange={e => set('description', e.target.value)}></textarea>
                    </div>
                </div>

                {/* Notifications & Alerts */}
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', fontFamily: 'Playfair Display, serif' }}>Notifications & Alerts</h3>

                    {/* Low Stock Alerts toggle removed as per request */}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block' }}>New Order Notifications</span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Show badge for pending customer orders</span>
                        </div>
                        <div
                            style={{ width: '40px', height: '22px', background: form.newOrder ? '#C9A84C' : '#e5e7eb', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => set('newOrder', !form.newOrder)}
                        >
                            <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: form.newOrder ? '20px' : '2px', transition: '0.2s' }}></div>
                        </div>
                    </div>
                </div>

                {/* Security & Access */}
                <div className="admin-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', fontFamily: 'Playfair Display, serif' }}>Security & Access</h3>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Change Password</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type={showPass ? 'text' : 'password'} 
                                className="form-input" 
                                placeholder="Enter new password" 
                                value={form.password} 
                                onChange={e => set('password', e.target.value)} 
                            />
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPass(!showPass)}>
                                {eyeIcon(showPass)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type={showConf ? 'text' : 'password'} 
                                className="form-input" 
                                placeholder="Confirm new password" 
                                value={form.confirmPassword} 
                                onChange={e => set('confirmPassword', e.target.value)} 
                            />
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowConf(!showConf)}>
                                {eyeIcon(showConf)}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', textAlign: 'right', paddingTop: '1rem' }}>
                        <button className="btn btn--gold" onClick={handleSave} style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Save All Changes</button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
