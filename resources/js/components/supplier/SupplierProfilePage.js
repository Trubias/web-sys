import React, { useState } from 'react';
import axios from 'axios';
import { suppHead, BTN, INV_MODAL } from './supplierHelpers';

export default function SupplierProfilePage({ user, onUserUpdated }) {
    // Determine Year Established based on approval or creation date — PERMANENT, never editable
    const establishedDate = user?.approved_at ? new Date(user.approved_at) : (user?.created_at ? new Date(user.created_at) : new Date());
    const yearEstablished = establishedDate.getFullYear();

    // Auto-gen registration number if empty from DB — PERMANENT, never editable
    const regNo = user?.registration_no || ('REG-' + yearEstablished + '-' + String(user?.id || '99').padStart(4, '0'));

    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    const openEdit = () => {
        setEditForm({
            name: user?.name || '',
            brands: user?.brands || '',
            phone: user?.phone || user?.phone_number || '',
            address: user?.address || '',
        });
        setEditError('');
        setEditSuccess('');
        setEditOpen(true);
    };

    const handleEditChange = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleEditSave = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError('');
        setEditSuccess('');
        try {
            await axios.put('/api/supplier/profile', {
                name: editForm.name,
                brands: editForm.brands,
                phone: editForm.phone,
                address: editForm.address,
            }, suppHead());
            setEditSuccess('Profile updated successfully!');
            if (onUserUpdated) onUserUpdated();
            setTimeout(() => setEditOpen(false), 1200);
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setEditLoading(false);
        }
    };

    // Locked field style — visually indicates the field cannot be changed
    const lockedInp = {
        width: '100%', padding: '0.6rem 1rem', borderRadius: 8,
        border: '1px solid #e5e7eb', background: '#f3f4f6',
        color: '#9ca3af', boxSizing: 'border-box', cursor: 'not-allowed',
    };
    const editInp = {
        width: '100%', padding: '0.6rem 1rem', borderRadius: 8,
        border: '1px solid #d1d5db', background: '#fff',
        color: '#1f2937', boxSizing: 'border-box',
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0 }}>Supplier Profile</h1>
                <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Manage your company information and credentials</p>
            </div>

            {/* Profile Header Card */}
            <div style={{ background: '#111827', borderRadius: 16, padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b08d25', margin: '0 0 0.5rem 0' }}>{user?.company_name || user?.name || 'Company Name'}</h2>
                    <div style={{ color: '#d1d5db', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Authorized Watches Distributor</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Partner since {yearEstablished}</div>
                </div>
                <button onClick={openEdit} style={{ ...BTN.gold, padding: '0.6rem 1.5rem', borderRadius: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Profile
                </button>
            </div>

            {/* Company Info */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Company Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Company Name</label>
                        <input type="text" readOnly value={user?.company_name || user?.name || ''} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Year Established</label>
                        <input type="text" readOnly value={yearEstablished} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Registration No.</label>
                        <input type="text" readOnly value={regNo} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Brands Carried</label>
                        <input type="text" readOnly value={user?.brands || 'Seiko, Casio, etc'} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Contact Person</label>
                        <input type="text" readOnly value={user?.contact_person || user?.name || ''} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Contact Number</label>
                        <input type="text" readOnly value={user?.phone_number || user?.phone || user?.mobile || user?.contact_number || '+63 900 000 0000'} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Email</label>
                        <input type="email" readOnly value={user?.email || ''} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Office Address</label>
                        <input type="text" readOnly value={user?.address || 'Manila, Philippines'} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
                    </div>
                </div>
            </div>

            {/* ── Edit Profile Modal ──────────────────────────────────────────── */}
            {editOpen && (
                <div style={INV_MODAL.overlay} onClick={e => e.target === e.currentTarget && setEditOpen(false)}>
                    <div style={{ ...INV_MODAL.box, maxWidth: 560 }}>
                        <div style={INV_MODAL.hdr}>
                            <h2 style={INV_MODAL.title}>Edit Profile</h2>
                            <button style={INV_MODAL.closeBtn} onClick={() => setEditOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleEditSave} style={{ padding: '1.5rem' }}>
                            {editError && <div style={INV_MODAL.errBox}>{editError}</div>}
                            {editSuccess && (
                                <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {editSuccess}
                                </div>
                            )}

                            {/* Editable fields */}
                            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '1rem', marginTop: 0 }}>Fields marked with 🔒 are permanent and cannot be changed.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                {/* Company Name — editable */}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={INV_MODAL.lbl}>Company Name</label>
                                    <input
                                        name="name" value={editForm.name}
                                        onChange={handleEditChange}
                                        style={editInp}
                                        placeholder="Your company name"
                                    />
                                </div>

                                {/* Brands Carried — editable */}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={INV_MODAL.lbl}>Brands Carried</label>
                                    <input
                                        name="brands" value={editForm.brands}
                                        onChange={handleEditChange}
                                        style={editInp}
                                        placeholder="e.g. Seiko, Casio, Citizen"
                                    />
                                </div>

                                {/* Phone — editable */}
                                <div>
                                    <label style={INV_MODAL.lbl}>Contact Number</label>
                                    <input
                                        name="phone" value={editForm.phone}
                                        onChange={handleEditChange}
                                        style={editInp}
                                        placeholder="+63 900 000 0000"
                                    />
                                </div>

                                {/* Address — editable */}
                                <div>
                                    <label style={INV_MODAL.lbl}>Office Address</label>
                                    <input
                                        name="address" value={editForm.address}
                                        onChange={handleEditChange}
                                        style={editInp}
                                        placeholder="Manila, Philippines"
                                    />
                                </div>

                                {/* Year Established — LOCKED */}
                                <div>
                                    <label style={{ ...INV_MODAL.lbl, color: '#9ca3af' }}>🔒 Year Established</label>
                                    <input
                                        type="text" disabled value={yearEstablished}
                                        style={lockedInp}
                                        title="Year Established cannot be changed after registration"
                                    />
                                </div>

                                {/* Registration No. — LOCKED */}
                                <div>
                                    <label style={{ ...INV_MODAL.lbl, color: '#9ca3af' }}>🔒 Registration No.</label>
                                    <input
                                        type="text" disabled value={regNo}
                                        style={lockedInp}
                                        title="Registration No. is a system-assigned permanent ID"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" style={INV_MODAL.cancelBtn} onClick={() => setEditOpen(false)}>Cancel</button>
                                <button type="submit" style={INV_MODAL.saveBtn} disabled={editLoading}>
                                    {editLoading ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
