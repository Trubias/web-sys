import React, { useState, useEffect } from 'react';
import { reqStore, deliveryStore, notificationStore } from '../sharedStore';
import { BTN, INV_MODAL } from './supplierHelpers';

const reqStatusStyle = {
    pending: { bg: '#fef3c7', color: '#f59e0b', label: 'Pending' },
    accepted: { bg: '#dbeafe', color: '#3b82f6', label: 'Accepted' },
    preparing: { bg: '#e0f2fe', color: '#0ea5e9', label: 'Preparing' },
    transporting: { bg: '#ede9fe', color: '#8b5cf6', label: 'Transporting' },
    completed: { bg: '#d1fae5', color: '#10b981', label: 'Completed' },
    declined: { bg: '#fee2e2', color: '#ef4444', label: 'Declined' },
};

function RequestDetailModal({ req, onClose }) {
    if (!req) return null;
    const st = reqStatusStyle[req.status] || reqStatusStyle.pending;
    return (
        <div style={INV_MODAL.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...INV_MODAL.box, maxWidth: 520 }}>
                <div style={INV_MODAL.hdr}>
                    <h2 style={INV_MODAL.title}>Request Details — {req.ref}</h2>
                    <button style={INV_MODAL.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                        <div style={{ width: 90, height: 90, borderRadius: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {req.image
                                ? <img src={req.image} alt={req.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827', marginBottom: 6 }}>{req.model}</div>
                            <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '0.22rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>{st.label}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {[
                            { label: 'Brand', value: req.brand },
                            { label: 'Category', value: req.category },
                            { label: 'Quantity', value: req.qty + ' units' },
                            { label: 'Unit Price', value: '₱' + Number(req.price).toLocaleString() },
                            { label: 'Total Amount', value: '₱' + (req.qty * req.price).toLocaleString() },
                            { label: 'Payment Method', value: req.payment },
                            { label: 'Date Ordered', value: req.date },
                        ].map(row => (
                            <div key={row.label} style={{ background: '#f9fafb', borderRadius: 8, padding: '0.6rem 0.9rem', border: '1px solid #f3f4f6' }}>
                                <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductRequestsPage({ user, setActivePage }) {
    const [requests, setRequests] = useState([]);
    const [detail, setDetail] = useState(null);
    const [tab, setTab] = useState('active'); // 'active' | 'archive'

    useEffect(() => {
        const sync = () => setRequests([...reqStore.getAll()].filter(r => String(r.supplier_id) === String(user?.id)));
        sync();
        window.addEventListener('jk_req_update', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('jk_req_update', sync);
            window.removeEventListener('storage', sync);
        };
    }, [user]);

    // Active = not completed and not declined. Archive = completed.
    const activeReqs = requests.filter(r => r.status !== 'completed' && r.status !== 'declined');
    const archiveReqs = requests.filter(r => r.status === 'completed');
    const displayed = tab === 'active' ? activeReqs : archiveReqs;

    const counts = {
        pending: activeReqs.filter(r => r.status === 'pending').length,
        accepted: activeReqs.filter(r => r.status === 'accepted').length,
        transporting: activeReqs.filter(r => r.status === 'transporting').length,
        completed: archiveReqs.length,
    };

    const accept = (req) => {
        reqStore.update(req.id, { status: 'accepted' });
        const existing = deliveryStore.getAll();
        if (!existing.find(d => String(d.reqId) === String(req.id))) {
            deliveryStore.add({
                id: 'DEL-2026-' + String(existing.length + 1).padStart(3, '0'),
                reqId: req.id, ref: req.ref, model: req.model,
                brand: req.brand, category: req.category,
                qty: req.qty, price: req.price, payment: req.payment, supplier: req.supplier,
                image: req.image, date: req.date, status: 'accepted',
                supplier_id: String(user?.id),
                proof: null, deliveredAt: null,
            });
        }
        notificationStore.add('admin', `Your order ${req.ref} has been accepted by ${user?.name} and is now being prepared.`);
    };

    const decline = (req) => {
        const reason = prompt("Optional: Provide a reason for declining this request:");
        if (reason === null) return;
        reqStore.update(req.id, { status: 'declined', reason });
        notificationStore.add('admin', `Your order ${req.ref} has been declined by ${user?.name}.`);
    };

    // Tab button style helper
    const tabStyle = (active) => ({
        padding: '0.45rem 1.2rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem',
        border: 'none', cursor: 'pointer',
        background: active ? '#111827' : '#f3f4f6',
        color: active ? '#C9A84C' : '#6b7280',
        transition: 'all 0.15s',
    });

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0 }}>Product Requests</h1>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Review and manage product supply requests from J&K Watch admin</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button style={tabStyle(tab === 'active')} onClick={() => setTab('active')}>
                        Active Requests {tab === 'active' && activeReqs.length > 0 ? `(${activeReqs.length})` : ''}
                    </button>
                    <button style={tabStyle(tab === 'archive')} onClick={() => setTab('archive')}>
                        🗂 Archive {archiveReqs.length > 0 ? `(${archiveReqs.length})` : ''}
                    </button>
                </div>
            </div>

            {tab === 'active' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                        { key: 'pending', label: 'Pending', color: '#f59e0b' },
                        { key: 'accepted', label: 'Accepted', color: '#3b82f6' },
                        { key: 'transporting', label: 'Transporting', color: '#8b5cf6' },
                        { key: 'completed', label: 'Archived', color: '#10b981' },
                    ].map(s => (
                        <div key={s.key} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.75rem 1.25rem', minWidth: 110 }}>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>{s.label}:</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{counts[s.key]}</div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'archive' && archiveReqs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                    🗂 No archived (completed) requests yet.
                </div>
            )}

            {tab === 'active' && displayed.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                    No product requests yet.
                </div>
            )}

            {displayed.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: tab === 'archive' ? '#064e3b' : '#111827' }}>
                                {['Request ID', 'Order Name', 'Brand', 'Category', 'Qty', 'Price', 'Payment', 'Date', 'Status', ...(tab === 'active' ? ['Action'] : [])].map(h => (
                                    <th key={h} style={{ padding: '0.85rem 0.9rem', textAlign: 'left', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((r, i) => {
                                const st = reqStatusStyle[r.status] || reqStatusStyle.pending;
                                return (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '0.8rem 0.9rem', fontWeight: 700, color: '#b08d25', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setDetail(r)}>{r.ref}</td>
                                        <td style={{ padding: '0.8rem 0.9rem', fontWeight: 600, color: '#1f2937', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.model}</td>
                                        <td style={{ padding: '0.8rem 0.9rem', color: '#374151', fontSize: '0.85rem' }}>{r.brand}</td>
                                        <td style={{ padding: '0.8rem 0.9rem', color: '#6b7280', fontSize: '0.85rem' }}>{r.category}</td>
                                        <td style={{ padding: '0.8rem 0.9rem', color: '#374151', fontWeight: 600 }}>{r.qty}</td>
                                        <td style={{ padding: '0.8rem 0.9rem', color: '#111827', fontWeight: 700, fontSize: '0.85rem' }}>₱{Number(r.price).toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem 0.9rem', color: '#6b7280', fontSize: '0.85rem' }}>{r.payment}</td>
                                        <td style={{ padding: '0.8rem 0.9rem', color: '#6b7280', fontSize: '0.8rem' }}>{r.date}</td>
                                        <td style={{ padding: '0.8rem 0.9rem' }}>
                                            <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '0.35rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        {tab === 'active' && (
                                            <td style={{ padding: '0.8rem 0.9rem' }}>
                                                {r.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => accept(r)} style={{ ...BTN.green, padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: 6 }}>Accept</button>
                                                        <button onClick={() => decline(r)} style={{ ...BTN.red, padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: 6 }}>Decline</button>
                                                    </div>
                                                ) : r.status !== 'declined' ? (
                                                    <span style={{ fontWeight: 700, color: '#dca54c', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => {
                                                        if (setActivePage) setActivePage('deliveries');
                                                    }}>
                                                        Track in Deliveries
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic' }}>Declined</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {detail && <RequestDetailModal req={detail} onClose={() => setDetail(null)} />}
        </div>
    );
}
