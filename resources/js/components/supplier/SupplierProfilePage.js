import React, { useState, useRef } from 'react';
import axios from 'axios';
import { suppHead, BTN, INV_MODAL } from './supplierHelpers';

const IMG_BASE = '';  // logo paths already include /storage/ prefix

export default function SupplierProfilePage({ user, onUserUpdated }) {
    // Determine Year Established based on approval or creation date — PERMANENT, never editable
    const establishedDate = user?.approved_at ? new Date(user.approved_at) : (user?.created_at ? new Date(user.created_at) : new Date());
    const yearEstablished = establishedDate.getFullYear();

    // Auto-gen registration number if empty from DB — PERMANENT, never editable
    const regNo = user?.registration_no || ('REG-' + yearEstablished + '-' + String(user?.id || '99').padStart(4, '0'));

    const [editOpen, setEditOpen]       = useState(false);
    const [editForm, setEditForm]       = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError]     = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    // Logo upload state
    const [logoFile, setLogoFile]             = useState(null);
    const [logoPreview, setLogoPreview]       = useState(null);
    const [logoUploading, setLogoUploading]   = useState(false);
    const [removeAvatar, setRemoveAvatar]     = useState(false);
    const logoInputRef = useRef(null);

    const openEdit = () => {
        setEditForm({
            name:    user?.name || '',
            brands:  user?.brands || '',
            phone:   user?.phone || user?.phone_number || '',
            address: user?.address || '',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setRemoveAvatar(false);
        setEditError('');
        setEditSuccess('');
        setEditOpen(true);
    };

    const handleEditChange = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleLogoChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoFile(file);
        setRemoveAvatar(false); // picking a new image cancels any pending removal
        const reader = new FileReader();
        reader.onload = ev => setLogoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setRemoveAvatar(true);
        setLogoFile(null);
        setLogoPreview(null);
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError('');
        setEditSuccess('');
        try {
            // 1. Remove avatar if requested
            if (removeAvatar) {
                await axios.delete('/api/supplier/logo', suppHead());
            }
            // 2. Upload new logo if a file was selected
            else if (logoFile) {
                setLogoUploading(true);
                const fd = new FormData();
                fd.append('logo', logoFile);
                await axios.post('/api/supplier/logo', fd, {
                    headers: {
                        Authorization: suppHead().headers.Authorization,
                        'Content-Type': 'multipart/form-data',
                    },
                });
                setLogoUploading(false);
            }

            // 2. Save text fields
            await axios.put('/api/supplier/profile', {
                name:    editForm.name,
                brands:  editForm.brands,
                phone:   editForm.phone,
                address: editForm.address,
            }, suppHead());

            setEditSuccess('Profile updated successfully!');
            if (onUserUpdated) onUserUpdated();
            setTimeout(() => setEditOpen(false), 1200);
        } catch (err) {
            setLogoUploading(false);
            setEditError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setEditLoading(false);
        }
    };

    // Resolve the current avatar: new preview > (not removing && saved) > null = show initials
    const displayName = user?.company_name || user?.name || 'S';
    const initials    = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const savedLogo   = user?.logo || null;
    const avatarSrc   = logoPreview || (removeAvatar ? null : savedLogo) || null;

    // Locked field style
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Avatar */}
                    <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '3px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', background: avatarSrc ? 'transparent' : '#1f2937' }}>
                        {avatarSrc
                            ? <img src={avatarSrc} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C9A84C', letterSpacing: 1 }}>{initials}</span>
                        }
                    </div>
                    {/* Info */}
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b08d25', margin: '0 0 0.5rem 0' }}>{displayName}</h2>
                        <div style={{ color: '#d1d5db', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Authorized Watches Distributor</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Partner since {yearEstablished}</div>
                    </div>
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
                            {editError   && <div style={INV_MODAL.errBox}>{editError}</div>}
                            {editSuccess && (
                                <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {editSuccess}
                                </div>
                            )}

                            {/* ── Profile Picture Upload ── */}
                            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                                <label style={{ ...INV_MODAL.lbl, marginBottom: '0.75rem', display: 'block' }}>Profile Avatar</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {/* Preview circle */}
                                    <div style={{ width: 72, height: 72, borderRadius: '50%', border: `2px dashed ${avatarSrc ? '#C9A84C' : '#374151'}`, overflow: 'hidden', flexShrink: 0, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        onClick={() => logoInputRef.current?.click()}>
                                        {avatarSrc
                                            ? <img src={avatarSrc} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C9A84C' }}>{initials}</span>
                                        }
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {/* Hidden file input */}
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                            style={{ display: 'none' }}
                                            onChange={handleLogoChange}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => logoInputRef.current?.click()}
                                                style={{ background: '#111827', color: '#C9A84C', border: '1.5px solid #C9A84C', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                                </svg>
                                                {logoFile ? 'Change Image' : 'Upload Avatar'}
                                            </button>
                                            {/* Remove Avatar — only visible when there is an avatar */}
                                            {(savedLogo && !removeAvatar) || logoFile ? (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveAvatar}
                                                    style={{ background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"/>
                                                        <path d="M19 6l-1 14H6L5 6"/>
                                                        <path d="M10 11v6"/><path d="M14 11v6"/>
                                                        <path d="M9 6V4h6v2"/>
                                                    </svg>
                                                    Remove Avatar
                                                </button>
                                            ) : null}
                                        </div>
                                        <p style={{ fontSize: '0.73rem', color: '#9ca3af', margin: 0 }}>
                                            {logoFile ? `Selected: ${logoFile.name}` : 'JPG, PNG, GIF or WEBP · max 3 MB'}
                                        </p>
                                    </div>
                                </div>
                            </div>

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
                                    {logoUploading ? 'Uploading logo…' : editLoading ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
