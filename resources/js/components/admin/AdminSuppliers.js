import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

export default function AdminSuppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [tempDate, setTempDate] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Auth context or axios setup assumed globally via window.axios 
    // or standard axios config with Sanctum.

    const fetchSuppliers = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/admin/suppliers');
            setSuppliers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSetInterview = async (id) => {
        try {
            const axios = (await import('axios')).default;
            await axios.put(`/api/admin/suppliers/${id}/interview`, { interview_date: tempDate });
            fetchSuppliers();
            setEditingId(null);
        } catch (err) {
            console.error('Failed to set interview', err);
            alert('Failed to set interview date.');
        }
    };

    const handleConfirm = async (id) => {
        try {
            const axios = (await import('axios')).default;
            await axios.put(`/api/admin/suppliers/${id}/confirm`);
            fetchSuppliers();
        } catch(err) {
            console.error('Failed to confirm', err);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to remove this supplier?')) {
            try {
                const axios = (await import('axios')).default;
                await axios.delete(`/api/admin/suppliers/${id}`);
                fetchSuppliers();
            } catch(err) {
                console.error('Failed to delete', err);
            }
        }
    };

    return (
        <AdminLayout>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Supplier Approvals</h1>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>Manage and verify new supplier accounts</p>
                </div>
            </div>
            
            <div className="admin-card">
                {loading ? <p style={{padding: '1rem'}}>Loading suppliers...</p> : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Company & Address</th>
                            <th>Contact</th>
                            <th>Brands Output</th>
                            <th>Status & Interview</th>
                            <th style={{ textAlign: 'right' }}>Workflow Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>No suppliers found.</td></tr>
                        ) : suppliers.map(s => (
                            <tr key={s.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: SUP-{1000 + s.id}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>{s.address || 'No Address provided'}</div>
                                </td>
                                <td>
                                    <div>{s.phone || 'No Contact'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.email}</div>
                                </td>
                                <td><span style={{ color: '#b08d25', fontWeight: 500 }}>{s.brands || 'None provided'}</span></td>
                                <td>
                                    <div style={{ marginBottom: '6px' }}>
                                        {s.supplier_status === 'pending' && <span className="admin-badge admin-badge--gray">Pending Approval</span>}
                                        {s.supplier_status === 'interview_set' && <span className="admin-badge admin-badge--gold">Interview Scheduled</span>}
                                        {s.supplier_status === 'active' && <span className="admin-badge admin-badge--green">Active</span>}
                                    </div>
                                    {s.interview_date && (
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                            {new Date(s.interview_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        
                                        {s.supplier_status === 'pending' && editingId !== s.id && (
                                            <button 
                                                className="admin-btn-gold" 
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                                onClick={() => setEditingId(s.id)}
                                            >
                                                Set Interview
                                            </button>
                                        )}

                                        {editingId === s.id && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input 
                                                    type="datetime-local" 
                                                    className="admin-select"
                                                    value={tempDate}
                                                    onChange={e => setTempDate(e.target.value)}
                                                    style={{ padding: '0.3rem', fontSize: '0.75rem' }}
                                                />
                                                <button 
                                                    className="admin-icon-btn admin-icon-btn--success"
                                                    onClick={() => handleSetInterview(s.id)}
                                                    disabled={!tempDate}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    className="admin-icon-btn admin-icon-btn--neutral"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

                                        {s.supplier_status === 'interview_set' && (
                                            <button 
                                                className="admin-btn-gold" 
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#27ae60', color: '#fff' }}
                                                onClick={() => handleConfirm(s.id)}
                                            >
                                                Mark Done & Confirm
                                            </button>
                                        )}

                                        <button 
                                            className="admin-icon-btn admin-icon-btn--delete" 
                                            title="Reject / Delete"
                                            onClick={() => handleDelete(s.id)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
        </AdminLayout>
    );
}
