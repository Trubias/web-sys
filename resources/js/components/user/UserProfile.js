import React, { useState } from 'react';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';

// ─── AddressesTab ─────────────────────────────────────────────────────────────
// Reads from the same /api/delivery-addresses endpoint as Checkout.
// Any address added, edited, deleted, or set-as-default here is instantly
// reflected in the Checkout Saved Addresses list (Rule 5).
function AddressesTab() {
    const { user } = useAuth();
    const [addresses,   setAddresses]   = React.useState([]);
    const [loading,     setLoading]     = React.useState(true);
    const [mode,        setMode]        = React.useState(null); // null | 'add' | 'edit'
    const [editTarget,  setEditTarget]  = React.useState(null);
    const [saving,      setSaving]      = React.useState(false);
    const [msg,         setMsg]         = React.useState('');
    const EMPTY_FORM = { full_name: '', address: '', city: '', region: 'Luzon', phone: '', is_default: false };
    const [form, setForm] = React.useState(EMPTY_FORM);

    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // Load all saved addresses
    React.useEffect(() => {
        if (!user) return;
        import('axios').then(({ default: axios }) => {
            axios.get('/api/delivery-addresses')
                .then(res => setAddresses(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        });
    }, [user]);

    const openAdd = () => {
        setForm({ ...EMPTY_FORM, full_name: user?.name || '', phone: user?.phone || '' });
        setEditTarget(null);
        setMode('add');
        setMsg('');
    };

    const openEdit = (addr) => {
        setForm({ full_name: addr.full_name, address: addr.address, city: addr.city, region: addr.region || 'Luzon', phone: addr.phone || '', is_default: addr.is_default });
        setEditTarget(addr);
        setMode('edit');
        setMsg('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.full_name.trim() || !form.address.trim() || !form.city.trim()) {
            setMsg('Full Name, Address, and City are required.');
            return;
        }
        setSaving(true);
        setMsg('');
        try {
            const { default: axios } = await import('axios');
            if (mode === 'add') {
                const res = await axios.post('/api/delivery-addresses', form);
                setAddresses(prev => [...prev, res.data]);
                setMsg('Address added successfully.');
            } else {
                const res = await axios.put(`/api/delivery-addresses/${editTarget.id}`, form);
                setAddresses(prev => prev.map(a => a.id === editTarget.id ? res.data : a));
                setMsg('Address updated successfully.');
            }
            // Re-fetch to get updated is_default flags
            const fresh = await axios.get('/api/delivery-addresses');
            setAddresses(fresh.data);
            setMode(null);
            setEditTarget(null);
        } catch {
            setMsg('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this address?')) return;
        try {
            const { default: axios } = await import('axios');
            await axios.delete(`/api/delivery-addresses/${id}`);
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch {
            alert('Failed to delete address.');
        }
    };

    const handleSetDefault = async (addr) => {
        if (addr.is_default) return;
        try {
            const { default: axios } = await import('axios');
            await axios.put(`/api/delivery-addresses/${addr.id}`, { ...addr, is_default: true });
            const fresh = await axios.get('/api/delivery-addresses');
            setAddresses(fresh.data);
        } catch {
            alert('Failed to set default.');
        }
    };

    const inputStyle = { width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: '#555' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#111', fontWeight: 700, margin: 0 }}>Saved Addresses</h3>
                {mode === null && (
                    <button onClick={openAdd} style={{ background: '#C9A84C', color: '#000', border: 'none', borderRadius: '4px', padding: '0.5rem 1.2rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                        + Add Address
                    </button>
                )}
            </div>

            {msg && <div style={{ padding: '0.7rem 1rem', marginBottom: '1rem', borderRadius: '4px', fontSize: '0.85rem', background: msg.startsWith('Failed') ? '#fef2f2' : '#f0fdf4', color: msg.startsWith('Failed') ? '#b91c1c' : '#166534', border: msg.startsWith('Failed') ? '1px solid #fca5a5' : '1px solid #86efac' }}>{msg}</div>}

            {/* Address Card List */}
            {loading ? (
                <p style={{ color: '#aaa' }}>Loading addresses...</p>
            ) : addresses.length === 0 && mode === null ? (
                <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: '#888' }}>
                    No saved addresses yet. Click <strong>+ Add Address</strong> to add one.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: mode ? '1.5rem' : 0 }}>
                    {addresses.map(addr => (
                        <div key={addr.id} style={{ background: '#fff', border: addr.is_default ? '2px solid #C9A84C' : '1px solid #eaeaea', borderRadius: '8px', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{addr.full_name}</span>
                                    {addr.is_default && <span style={{ background: '#C9A84C', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default</span>}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
                                    <div>{addr.address}</div>
                                    <div>{addr.city}{addr.city && addr.region ? ', ' : ''}{addr.region}</div>
                                    {addr.phone && <div>📞 {addr.phone}</div>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                                {!addr.is_default && (
                                    <button onClick={() => handleSetDefault(addr)} style={{ background: '#f8f9fa', color: '#555', border: '1px solid #ddd', borderRadius: '4px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                        Set Default
                                    </button>
                                )}
                                <button onClick={() => openEdit(addr)} style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd', borderRadius: '4px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(addr.id)} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '4px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Form */}
            {mode !== null && (
                <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '1.5rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: 700 }}>{mode === 'add' ? 'Add New Address' : 'Edit Address'}</h4>
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Full Name *</label>
                            <input type="text" value={form.full_name} onChange={e => setF('full_name', e.target.value)} required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input type="text" value={form.phone} onChange={e => setF('phone', e.target.value)} style={inputStyle} placeholder="e.g. 09501231212" />
                        </div>
                        <div>
                            <label style={labelStyle}>Region *</label>
                            <select value={form.region} onChange={e => setF('region', e.target.value)} required style={inputStyle}>
                                <option value="Luzon">Luzon</option>
                                <option value="Visayas">Visayas</option>
                                <option value="Mindanao">Mindanao</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>City *</label>
                            <input type="text" value={form.city} onChange={e => setF('city', e.target.value)} required style={inputStyle} placeholder="e.g. Butuan City" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Street Address *</label>
                            <textarea value={form.address} onChange={e => setF('address', e.target.value)} required rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="e.g. Golden Ribbon, Ambago" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.is_default} onChange={e => setF('is_default', e.target.checked)} />
                                Set as default address
                            </label>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                            <button type="submit" disabled={saving} style={{ padding: '0.6rem 1.5rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                {saving ? 'Saving...' : 'Save Address'}
                            </button>
                            <button type="button" onClick={() => { setMode(null); setEditTarget(null); setMsg(''); }} style={{ padding: '0.6rem 1.5rem', background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

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
            axios.default.get('/api/orders/stats').then(res => {
                setTotalOrders(res.data.total_orders || 0);
                setTotalSpent(res.data.total_spent || 0);
            }).catch(console.error);
            // Fetch recent orders for the table (visible orders only)
            axios.default.get('/api/orders').then(res => {
                setRecentOrders(res.data.slice(0, 5));
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

                    {/* ADDRESSES TAB — reads from same /api/delivery-addresses as Checkout */}
                    {activeTab === 'addresses' && (
                        <AddressesTab />
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
