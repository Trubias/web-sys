import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

export default function AdminRiders() {
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [tempDate, setTempDate] = useState('');

    useEffect(() => {
        fetchRiders();
    }, []);

    const fetchRiders = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/admin/riders');
            setRiders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch riders', error);
            setLoading(false);
        }
    };

    const handleSetInterview = async (id) => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.put(`/api/admin/riders/${id}/interview`, { interview_date: tempDate });
            setRiders(riders.map(r => r.id === id ? res.data.rider : r));
            setEditingId(null);
            setTempDate('');
        } catch (error) {
            console.error('Failed to set interview', error);
        }
    };

    const handleConfirm = async (id) => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.put(`/api/admin/riders/${id}/confirm`);
            setRiders(riders.map(r => r.id === id ? res.data.rider : r));
        } catch (error) {
            console.error('Failed to confirm rider', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const axios = (await import('axios')).default;
            await axios.delete(`/api/admin/riders/${id}`);
            setRiders(riders.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to delete rider', error);
        }
    };

    return (
        <AdminLayout>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Rider Applications</h1>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>Review applications, schedule interviews, and confirm riders</p>
                </div>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Applicant</th>
                            <th>Vehicle & Region</th>
                            <th>Status & Interview</th>
                            <th style={{ textAlign: 'right' }}>Workflow Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading algorithms...</td>
                            </tr>
                        ) : riders.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.phone}</div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{r.vehicle_type || 'N/A'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        {r.city ? r.city + ', ' : ''}{r.region || 'No Region'}
                                    </div>
                                    {r.government_id && (
                                        <div style={{ marginTop: '6px' }}>
                                            <a href={r.government_id} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2980b9', textDecoration: 'none', fontWeight: 600 }}>
                                                View ID
                                            </a>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ marginBottom: '6px' }}>
                                        {r.rider_status === 'pending' && <span className="admin-badge admin-badge--gray" style={{ textTransform: 'uppercase' }}>PENDING APPROVAL</span>}
                                        {r.rider_status === 'interview_scheduled' && <span className="admin-badge admin-badge--gold" style={{ textTransform: 'uppercase' }}>INTERVIEW SCHEDULED</span>}
                                        {r.rider_status === 'active' && <span className="admin-badge admin-badge--green" style={{ textTransform: 'uppercase' }}>ACTIVE</span>}
                                    </div>
                                    {r.rider_status === 'interview_scheduled' && r.interview_date && (
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            {new Date(r.interview_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    )}
                                    {r.rider_status === 'active' && r.updated_at && (
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                            Confirmed: {new Date(r.updated_at).toLocaleString([], { dateStyle: 'medium' })}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>

                                        {r.rider_status === 'pending' && editingId !== r.id && (
                                            <button
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                                onClick={() => setEditingId(r.id)}
                                            >
                                                Set Interview
                                            </button>
                                        )}

                                        {editingId === r.id && (
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
                                                    onClick={() => handleSetInterview(r.id)}
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

                                        {r.rider_status === 'interview_scheduled' && (
                                            <button
                                                className="admin-btn-gold"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#27ae60', color: '#fff' }}
                                                onClick={() => handleConfirm(r.id)}
                                            >
                                                Mark Done & Confirm
                                            </button>
                                        )}

                                        <button
                                            className="admin-icon-btn admin-icon-btn--delete"
                                            title="Reject / Delete"
                                            onClick={() => handleDelete(r.id)}
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
            </div>
        </AdminLayout>
    );
}
