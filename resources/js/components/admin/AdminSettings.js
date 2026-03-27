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
        storeName: user?.store_name || 'J&K Watch Store',
        email: user?.email || '',
        currency: user?.currency || getCurrencySettings(),
        address: user?.address || '123 Bonifacio High St, Taguig, Manila, Philippines',
        description: user?.description || '',
        newOrder: user?.notify_new_order ?? true,
        password: '',
        confirmPassword: '',
        photo: null,
        removeAvatar: false,
    });
    
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);
    
    useEffect(() => {
        if (user) {
            setForm(f => ({
                ...f,
                storeName: user.store_name || 'J&K Watch Store',
                email: user.email || '',
                currency: user.currency || getCurrencySettings(),
                address: user.address || '123 Bonifacio High St, Taguig, Manila, Philippines',
                description: user.description || '',
                newOrder: user.notify_new_order ?? true,
            }));
        }
    }, [user]);
    
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
        // Save currency globally in localStorage as well
        setCurrencySettings(form.currency);

        // Save Avatar / Remove Avatar
        try {
            if (form.removeAvatar) {
                await axios.delete('/api/admin/avatar', authHead());
            } else if (form.photo) {
                const fd = new FormData();
                fd.append('avatar', form.photo);
                await axios.post('/api/admin/avatar', fd, {
                    headers: { ...authHead().headers, 'Content-Type': 'multipart/form-data' }
                });
            }
        } catch (e) {
            console.error('Failed to save avatar', e);
        }
        
        // Save ALL Settings to Database
        try {
            const savePayload = {
                storeName: form.storeName,
                email: form.email,
                currency: form.currency,
                address: form.address,
                description: form.description,
                notify_new_order: form.newOrder,
            };
            if (form.password) {
                savePayload.password = form.password;
            }

            await axios.put('/api/admin/settings', savePayload, authHead());
            if (fetchUser) await fetchUser(); // Await fetchUser so the layout instantly picks up changes
        } catch (error) {
            console.error('Failed to update settings', error);
            setErrorMsg(error.response?.data?.message || 'Failed to save settings.');
            return;
        }

        localStorage.setItem('admin_notify_newOrder', form.newOrder);
        // Force the layout bell icon to re-read localStorage immediately
        window.dispatchEvent(new Event('jk_notification_update'));
        
        // 3. Show Success
        if (form.password) {
            setSuccessMsg('Settings saved and Password updated successfully.');
            setForm(f => ({ ...f, password: '', confirmPassword: '', photo: null, removeAvatar: false })); // clear on success
        } else {
            setSuccessMsg('Settings saved successfully.');
            setForm(f => ({ ...f, photo: null, removeAvatar: false }));
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
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.75rem', display: 'block' }}>Photo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div 
                                style={{ width: '80px', height: '80px', border: `2px solid ${(!form.removeAvatar && (form.photo || user?.avatar)) ? '#C9A84C' : '#d1d5db'}`, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '1.6rem', background: '#f9fafb', overflow: 'hidden', position: 'relative', flexShrink: 0, fontWeight: 800 }}
                            >
                                {(!form.removeAvatar && form.photo) ? (
                                    <img src={URL.createObjectURL(form.photo)} alt="Store Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (!form.removeAvatar && user?.avatar) ? (
                                    <img src={user.avatar} alt="Store Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('storePhotoInput').click()}
                                    style={{ background: '#111827', color: '#C9A84C', border: '1.5px solid #C9A84C', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    Change Avatar
                                </button>
                                {((user?.avatar && !form.removeAvatar) || form.photo) && (
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, photo: null, removeAvatar: true }))}
                                        style={{ background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        Remove Avatar
                                    </button>
                                )}
                            </div>
                        </div>
                        <input 
                            type="file" 
                            id="storePhotoInput" 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                    setForm(f => ({ ...f, photo: e.target.files[0], removeAvatar: false }));
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
