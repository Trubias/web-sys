import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const statusStyle = {
    'Active':   { bg: 'rgba(39,174,96,0.12)',  color: '#27ae60' },
    'Inactive': { bg: 'rgba(231,76,60,0.12)',  color: '#e74c3c' },
};

export default function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/admin/users');
            setCustomers(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this customer? This will perform a soft delete.')) {
            try {
                const axios = (await import('axios')).default;
                await axios.delete(`/api/admin/users/${id}`);
                setCustomers(customers.filter(c => c.id !== id));
            } catch (error) {
                console.error('Failed to delete customer', error);
            }
        }
    };
    return (
        <AdminLayout>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Customers</h1>
                <div className="admin-search" style={{ minWidth: 240 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" placeholder="Search customers..." />
                </div>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Region</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                                    Loading customers...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                                    No customers registered yet.
                                </td>
                            </tr>
                        ) : (
                            customers.map((c, i) => (
                                <tr key={c.id}>
                                    <td className="admin-table__muted">{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            {c.avatar ? (
                                                <img 
                                                    src={c.avatar} 
                                                    alt="Avatar" 
                                                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eaeaea' }} 
                                                />
                                            ) : (
                                                <div className="admin-avatar-sm">{c.name.charAt(0).toUpperCase()}</div>
                                            )}
                                            {c.name}
                                        </div>
                                    </td>
                                    <td className="admin-table__muted">{c.email}</td>
                                    <td className="admin-table__muted">{c.phone || '-'}</td>
                                    <td className="admin-table__muted">{c.address || '-'}</td>
                                    <td className="admin-table__muted" style={{ fontWeight: 600, color: '#111' }}>{c.region || '-'}</td>
                                    <td>
                                        <span className="admin-badge" style={statusStyle['Active']}>Active</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            className="admin-icon-btn admin-icon-btn--delete" 
                                            title="Delete User"
                                            onClick={() => handleDelete(c.id)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
