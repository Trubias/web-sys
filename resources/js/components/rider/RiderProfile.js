import React, { useState, useRef } from 'react';
import RiderLayout from './RiderLayout';
import { useAuth } from '../../Context/AuthContext';

export default function RiderProfile() {
    const { user, fetchUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        vehicle_type: user?.vehicle_type || '',
        region: user?.region || '',
        city: user?.city || '',
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => formData.append(key, form[key]));
            if (avatarFile) formData.append('avatar', avatarFile);

            const axios = (await import('axios')).default;
            await axios.post('/api/rider/profile', formData, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('jk_token')}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            await fetchUser();
            setIsEditing(false);
            setAvatarFile(null);
            setPreview(null);
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            console.error('Update failed', error);
            setErrorMsg('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const axios = (await import('axios')).default;
            await axios.delete('/api/rider/avatar', {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('jk_token')}`
                }
            });
            await fetchUser();
            setAvatarFile(null);
            setPreview(null);
            setSuccessMsg('Avatar removed successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            console.error('Remove avatar failed', error);
            setErrorMsg('Failed to remove avatar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <RiderLayout>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">My Profile</h1>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 4 }}>Manage your personal details and vehicle info</p>
                </div>
            </div>

            <div className="admin-card" style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    
                    {/* Avatar side */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        {preview || user?.avatar ? (
                            <img src={preview || user?.avatar} alt="Profile" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid #333' }} />
                        ) : (
                            <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold' }}>
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                        {isEditing && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: 130, padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box' }}>Change Avatar</button>
                                {user?.avatar && (
                                    <button type="button" onClick={handleRemoveAvatar} disabled={loading} style={{ width: 130, padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box' }}>
                                        {loading ? '...' : 'Remove Avatar'}
                                    </button>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setAvatarFile(e.target.files[0]);
                                            setPreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: 8 }}>
                            <span className="admin-badge admin-badge--green">Active Rider</span>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>Joined: {new Date(user?.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Details side */}
                    <div style={{ flex: '1 1 250px', minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Personal Information</h2>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} style={{ padding: '0.4rem 1rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Edit Details</button>
                            )}
                        </div>
                        
                        {successMsg && <div style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#2ecc71', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid rgba(39, 174, 96, 0.3)', fontWeight: 600 }}>{successMsg}</div>}
                        {errorMsg && <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid rgba(231, 76, 60, 0.3)', fontWeight: 600 }}>{errorMsg}</div>}

                        {!isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Full Name</div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', wordBreak: 'break-word' }}>{user?.name}</div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: '1 1 45%', minWidth: 150 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Email Address</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-all' }}>{user?.email}</div>
                                    </div>
                                    <div style={{ flex: '1 1 45%', minWidth: 150 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Phone Number</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.phone || 'N/A'}</div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Service Area</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.city ? user.city + ', ' : ''}{user?.region || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Vehicle Information</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.vehicle_type || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Government ID</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                        {user?.government_id ? (
                                            <a href={user.government_id} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'none' }}>View Document</a>
                                        ) : 'Not uploaded'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: 4 }}>Full Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="admin-select" style={{ width: '100%', padding: '0.6rem' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: 4 }}>Phone Number</label>
                                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="admin-select" style={{ width: '100%', padding: '0.6rem' }} required />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: '1 1 45%', minWidth: 150 }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: 4 }}>Region</label>
                                        <select value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="admin-select" style={{ width: '100%', padding: '0.6rem' }} required>
                                            <option value="">Select Region</option>
                                            <option value="Luzon">Luzon</option>
                                            <option value="Visayas">Visayas</option>
                                            <option value="Mindanao">Mindanao</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: '1 1 45%', minWidth: 150 }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: 4 }}>City / Province</label>
                                        <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="admin-select" style={{ width: '100%', padding: '0.6rem' }} required />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: 4 }}>Vehicle Information</label>
                                    <input type="text" value={form.vehicle_type} onChange={e => setForm({...form, vehicle_type: e.target.value})} className="admin-select" style={{ width: '100%', padding: '0.6rem' }} required />
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                                    <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.7rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" onClick={() => { setIsEditing(false); setPreview(null); setAvatarFile(null); }} style={{ padding: '0.7rem 1.5rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </RiderLayout>
    );
}
