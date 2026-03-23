import React, { useState } from 'react';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';

export default function UserProfile() {
    const { user, fetchUser } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', avatar: null });
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const fileInputRef = React.useRef(null);

    // Password State
    const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
    const [passMsg, setPassMsg] = useState('');
    const [passError, setPassError] = useState('');

    // Preferences State
    const [prefForm, setPrefForm] = useState({ email: user?.email || '', address: user?.address || '', phone: user?.phone || '' });
    const [prefEdit, setPrefEdit] = useState(false);
    const [prefMsg, setPrefMsg] = useState('');

    // Address State (for Address tab, tied to user.address)
    const [addrEdit, setAddrEdit] = useState(false);
    const [addrVal, setAddrVal] = useState(user?.address || '');
    const [regionVal, setRegionVal] = useState(user?.region || '');
    const [cityVal, setCityVal] = useState(user?.city || '');

    const [recentOrders, setRecentOrders] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);

    React.useEffect(() => {
        import('axios').then(axios => {
            axios.default.get('/api/orders').then(res => {
                setRecentOrders(res.data.slice(0, 5));
                setTotalOrders(res.data.length);
                setTotalSpent(res.data.reduce((sum, o) => sum + Number(o.total_amount), 0));
            }).catch(console.error);
        });
    }, []);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPassError(''); setPassMsg('');
        if (passForm.new !== passForm.confirm) {
            setPassError('New Password and Confirm Password do not match.');
            return;
        }
        if (passForm.new.length < 8) {
            setPassError('Password must be at least 8 characters long.');
            return;
        }
        // Mock successful save
        setPassMsg('Password successfully updated.');
        setPassForm({ current: '', new: '', confirm: '' });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', profileForm.name);
            formData.append('phone', profileForm.phone);
            formData.append('address', profileForm.address);
            if (profileForm.avatar) {
                formData.append('avatar', profileForm.avatar);
            }
            formData.append('_method', 'PUT'); // Fake PUT for multi-part

            const axios = (await import('axios')).default;
            await axios.post('/api/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchUser(); // Instantly syncs across layout and tables
            setIsEditingProfile(false);
            setPreviewAvatar(null);
        } catch (error) {
            alert('Failed to update profile.');
        }
    };

    const handlePrefSubmit = async (e) => {
        e.preventDefault();
        setPrefMsg('');
        try {
            const axios = (await import('axios')).default;
            await axios.put('/api/user/profile', prefForm);
            setPrefMsg('Preferences updated successfully.');
            setPrefEdit(false);
            // Optionally refresh user context here
        } catch (error) {
            setPrefMsg('Failed to update preferences. Please try again.');
        }
    };

    const handleAddrSubmit = async (e) => {
        e.preventDefault();
        try {
            const axios = (await import('axios')).default;
            await axios.put('/api/user/profile', { address: addrVal, region: regionVal, city: cityVal });
            setAddrEdit(false);
            setPrefForm(f => ({...f, address: addrVal}));
            await fetchUser(); // Sync globally
        } catch (error) {
            alert('Failed to update address.');
        }
    };

    return (
        <UserLayout>
            <div className="mobile-p-2" style={{ padding: '4rem 5rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
                <h1 style={{ fontSize: '2rem', color: '#111', fontWeight: 800, marginBottom: '2rem' }}>My Profile</h1>
                
                {/* Profile Header Card */}
                <div className="mobile-stack mobile-p-4" style={{ background: '#fff', borderRadius: '8px', padding: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', border: '1px solid #eaeaea', marginBottom: '2rem' }}>
                    
                    {/* Synchronized Avatar styling */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
                        {previewAvatar || user?.avatar ? (
                            <img 
                                src={previewAvatar || user?.avatar} 
                                alt="Avatar" 
                                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eaeaea' }} 
                            />
                        ) : (
                            <div style={{ 
                                width: 80, height: 80, borderRadius: '50%', background: '#C9A84C', color: '#fff', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', 
                                fontSize: '3rem', cursor: 'default', userSelect: 'none'
                            }}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        {isEditingProfile && (
                            <>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ background: '#f5f5f5', border: '1px solid #ccc', color: '#333', fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Change Photo
                                </button>
                                <input 
                                    type="file" 
                                    accept="image/jpeg, image/png, image/jpg" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            setProfileForm(f => ({...f, avatar: file}));
                                            setPreviewAvatar(URL.createObjectURL(file));
                                        }
                                    }} 
                                />
                            </>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        {!isEditingProfile ? (
                            <div className="mobile-stack" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.6rem', color: '#111', fontWeight: 800, margin: '0 0 0.4rem 0' }}>{user?.name || 'Customer'}</h2>
                                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>{user?.phone || 'No phone provided'} &nbsp;|&nbsp; {user?.address || 'No address provided'}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setProfileForm({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', avatar: null });
                                        setPreviewAvatar(null);
                                        setIsEditingProfile(true);
                                    }}
                                    style={{ background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    Edit Profile
                                </button>
                            </div>
                        ) : (
                            <form className="mobile-stack" onSubmit={handleProfileSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '600px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: '#555' }}>Full Name *</label>
                                    <input type="text" value={profileForm.name} onChange={e => setProfileForm(f => ({...f, name: e.target.value}))} required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: '#555' }}>Phone Number</label>
                                    <input type="text" value={profileForm.phone} onChange={e => setProfileForm(f => ({...f, phone: e.target.value}))} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: '#555' }}>Default Address</label>
                                    <input type="text" value={profileForm.address} onChange={e => setProfileForm(f => ({...f, address: e.target.value}))} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                                    <button type="submit" style={{ padding: '0.6rem 1.5rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                                    <button type="button" onClick={() => { setIsEditingProfile(false); setPreviewAvatar(null); }} style={{ padding: '0.6rem 1.5rem', background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #eaeaea', marginBottom: '2rem', overflowX: 'auto' }}>
                    {['Overview', 'Addresses', 'Password', 'Preferences'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.toLowerCase() ? '2px solid #C9A84C' : '2px solid transparent',
                                color: activeTab === tab.toLowerCase() ? '#C9A84C' : '#888',
                                padding: '0 0 0.8rem 0',
                                fontWeight: activeTab === tab.toLowerCase() ? 700 : 500,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ minHeight: '400px' }}>
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Stats */}
                            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#eaeaea', borderRadius: '8px', border: '1px solid #eaeaea', overflow: 'hidden', marginBottom: '2.5rem' }}>
                                <div style={{ background: '#fff', padding: '2rem', textAlign: 'center' }}>
                                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Total Spent:</div>
                                    <div style={{ color: '#C9A84C', fontSize: '2rem', fontWeight: 700 }}>₱{totalSpent.toLocaleString()}</div>
                                </div>
                                <div style={{ background: '#fff', padding: '2rem', textAlign: 'center' }}>
                                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Orders:</div>
                                    <div style={{ color: '#C9A84C', fontSize: '2rem', fontWeight: 700 }}>
                                        <span style={{ marginRight: '8px' }}>📋</span>{totalOrders}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            <h3 style={{ fontSize: '1.2rem', color: '#111', fontWeight: 700, marginBottom: '1rem' }}>Recent Orders</h3>
                            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                    <thead style={{ background: '#fcfcfc', borderBottom: '1px solid #eaeaea' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#111' }}>ORDER ID</th>
                                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#111' }}>DATE</th>
                                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#111' }}>STATUS</th>
                                            <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#111' }}>TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map(o => (
                                            <tr key={o.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', color: '#555' }}>{o.ref}</td>
                                                <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', color: '#555' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', color: '#555' }}>{o.status}</td>
                                                <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', color: '#111', fontWeight: 600, textAlign: 'right' }}>₱{Number(o.total_amount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ADDRESSES TAB */}
                    {activeTab === 'addresses' && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', color: '#111', fontWeight: 700, marginBottom: '1rem' }}>Addresses</h3>
                            <div className="mobile-stack" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', padding: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.95rem', fontWeight: 700 }}>Shipping Address</h4>
                                    {!addrEdit ? (
                                        <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                            <p style={{ margin: '0 0 0.4rem 0' }}>{user?.address || 'No street address provided.'}</p>
                                            <p style={{ margin: 0 }}>
                                                {user?.city ? user.city + ', ' : ''} {user?.region || ''}
                                            </p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleAddrSubmit} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: '#555' }}>Region *</label>
                                                <select 
                                                    value={regionVal} 
                                                    onChange={e => setRegionVal(e.target.value)} 
                                                    style={{ width: '300px', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem' }}
                                                    required
                                                >
                                                    <option value="">Select Region</option>
                                                    <option value="Luzon">Luzon</option>
                                                    <option value="Visayas">Visayas</option>
                                                    <option value="Mindanao">Mindanao</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: '#555' }}>City / Province *</label>
                                                <input 
                                                    type="text"
                                                    value={cityVal} 
                                                    onChange={e => setCityVal(e.target.value)} 
                                                    style={{ width: '300px', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem' }}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: '#555' }}>Street Address *</label>
                                                <textarea 
                                                    value={addrVal} 
                                                    onChange={e => setAddrVal(e.target.value)} 
                                                    style={{ width: '300px', height: '80px', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                                                    required
                                                />
                                            </div>
                                            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                                                <button type="submit" style={{ padding: '0.4rem 1rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                                <button type="button" onClick={() => setAddrEdit(false)} style={{ padding: '0.4rem 1rem', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                                {!addrEdit && (
                                    <button 
                                        onClick={() => setAddrEdit(true)}
                                        style={{ background: '#C9A84C', color: '#000', border: 'none', borderRadius: '4px', padding: '0.4rem 1.2rem', fontWeight: 600, cursor: 'pointer', height: 'fit-content' }}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASSWORD TAB */}
                    {activeTab === 'password' && (
                        <div style={{ maxWidth: '500px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#111', fontWeight: 700, marginBottom: '1rem' }}>Change Password</h3>
                            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', padding: '2rem' }}>
                                {passError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.8rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{passError}</div>}
                                {passMsg && <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.8rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{passMsg}</div>}
                                
                                <form onSubmit={handlePasswordSubmit}>
                                    <div style={{ marginBottom: '1.2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>Current Password</label>
                                        <input type="password" value={passForm.current} onChange={e => setPassForm(f => ({...f, current: e.target.value}))} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                                    </div>
                                    <div style={{ marginBottom: '1.2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>New Password</label>
                                        <input type="password" value={passForm.new} onChange={e => setPassForm(f => ({...f, new: e.target.value}))} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>Confirm New Password</label>
                                        <input type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({...f, confirm: e.target.value}))} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                                    </div>
                                    <button type="submit" style={{ padding: '0.8rem 1.5rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>Update Password</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* PREFERENCES TAB */}
                    {activeTab === 'preferences' && (
                        <div style={{ maxWidth: '600px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#111', fontWeight: 700, marginBottom: '1rem' }}>Preferences</h3>
                            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', padding: '2rem' }}>
                                {prefMsg && <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.8rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{prefMsg}</div>}
                                
                                <form onSubmit={handlePrefSubmit}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>Email Address</label>
                                        <input 
                                            type="email" 
                                            value={prefForm.email} 
                                            onChange={e => setPrefForm(f => ({...f, email: e.target.value}))} 
                                            disabled={!prefEdit}
                                            style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', background: prefEdit ? '#fff' : '#f9f9f9', color: prefEdit ? '#111' : '#666' }} 
                                            required 
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>Contact Number</label>
                                        <input 
                                            type="tel" 
                                            value={prefForm.phone} 
                                            onChange={e => setPrefForm(f => ({...f, phone: e.target.value}))} 
                                            disabled={!prefEdit}
                                            placeholder="e.g. 09501231212"
                                            style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', background: prefEdit ? '#fff' : '#f9f9f9', color: prefEdit ? '#111' : '#666' }} 
                                        />
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#333' }}>Default Address</label>
                                        <input 
                                            type="text" 
                                            value={prefForm.address} 
                                            onChange={e => setPrefForm(f => ({...f, address: e.target.value}))} 
                                            disabled={!prefEdit}
                                            style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', background: prefEdit ? '#fff' : '#f9f9f9', color: prefEdit ? '#111' : '#666' }} 
                                        />
                                    </div>
                                    
                                    {!prefEdit ? (
                                        <button type="button" onClick={() => setPrefEdit(true)} style={{ padding: '0.7rem 1.5rem', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Edit Preferences</button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button type="submit" style={{ padding: '0.7rem 1.5rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                                            <button type="button" onClick={() => setPrefEdit(false)} style={{ padding: '0.7rem 1.5rem', background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </UserLayout>
    );
}
