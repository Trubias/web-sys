import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { reqStore, deliveryStore, supplierStockStore } from '../sharedStore';
import { formatCurrency, useCurrency } from '../utils/currency';

// ─── Format any date value to "Mar 19, 2026" ─────────────────────────────────
function fmtDate(raw) {
    if (!raw) return '—';
    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw; // already a formatted string
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return raw; }
}

// ─── Returns true if this reqStore entry is a valid Admin-placed order ────────
function isRealOrder(d) {
    // Reject internal stock-restoration records
    if (String(d.id).startsWith('RES-')) return false;
    if (d._isRestoreRecord) return false;
    // Must have a real product name and quantity
    if (!d.model || d.model === 'undefined') return false;
    if (d.qty === undefined || d.qty === null || String(d.qty) === 'undefined') return false;
    // Must have a valid price (otherwise amount would be '—')
    if (d.price === undefined || d.price === null || isNaN(Number(d.price))) return false;
    return true;
}

// Removed manual INITIAL_CUSTOMER_ORDERS

// ─── 5-stage status map ───────────────────────────────────────────────────────
const mapStatus = (raw) => {
    if (!raw) return 'Pending';
    if (raw === 'pending') return 'Pending';
    if (raw === 'accepted') return 'Accepted';
    if (raw === 'preparing') return 'Preparing';
    if (raw === 'transporting') return 'Transporting';
    if (raw === 'completed' || raw === 'delivered') return 'Delivered';
    if (raw === 'declined') return 'Declined';
    if (raw === 'out_for_delivery') return 'Out for Delivery';
    if (raw === 'assigned') return 'Assigned';
    return 'Pending';
};

const STATUS_STYLES = {
    Pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    Accepted: { bg: 'rgba(41,128,185,0.15)', color: '#2980b9' },
    Preparing: { bg: 'rgba(234,179,8,0.15)', color: '#ca8a04' },
    Transporting: { bg: 'rgba(139,92,246,0.15)', color: '#7c3aed' },
    Delivered: { bg: 'rgba(39,174,96,0.15)', color: '#27ae60' },
    Declined: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    Completed: { bg: 'rgba(39,174,96,0.12)', color: '#27ae60' },
    Processing: { bg: 'rgba(41,128,185,0.12)', color: '#2980b9' },
    'Out for Delivery': { bg: 'rgba(139,92,246,0.15)', color: '#7c3aed' },
    Assigned: { bg: 'rgba(52,152,219,0.15)', color: '#2980b9' },
};

// ─── Trash icon ───────────────────────────────────────────────────────────────
const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ order, onCancel, onConfirm, orderType }) {
    const isSupplierOrder = orderType === 'supplier';
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: '#1a1a1a', borderRadius: 14, width: '90%', maxWidth: 400,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)', overflow: 'hidden',
            }}>
                <div style={{
                    padding: '1.1rem 1.4rem',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                }}>
                    <span style={{ fontSize: '1.15rem' }}>🗑️</span>
                    <h3 style={{ margin: 0, color: '#e74c3c', fontWeight: 700, fontSize: '1rem' }}>
                        Delete Order
                    </h3>
                </div>
                <div style={{ padding: '1.25rem 1.4rem' }}>
                    <p style={{ color: '#ccc', margin: '0 0 0.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Are you sure you want to permanently delete order{' '}
                        <strong style={{ color: '#C9A84C' }}>{order.id}</strong>?
                    </p>
                    <p style={{ color: '#888', margin: '0 0 0.5rem', fontSize: '0.82rem' }}>
                        {order.product} · {order.date}
                    </p>
                    {isSupplierOrder && (
                        <p style={{ color: '#f59e0b', margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>
                            ⚠️ This will remove the request from the Supplier's Active Requests. Stock will NOT be changed.
                        </p>
                    )}
                    <div style={{ marginTop: '1.4rem', display: 'flex', justifyContent: 'flex-end', gap: '0.7rem' }}>
                        <button onClick={onCancel} style={{
                            padding: '0.55rem 1.2rem', background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                            color: '#aaa', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem',
                        }}>Cancel</button>
                        <button onClick={onConfirm} style={{
                            padding: '0.55rem 1.2rem', background: '#e74c3c',
                            border: 'none', borderRadius: 8,
                            color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                        }}>Yes, Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Assign Rider Modal ───────────────────────────────────────────────────────
function AssignRiderModal({ order, riders, onCancel, onConfirm, isSubmitting, errorMsg, successMsg }) {
    const matchRiders = riders.filter(r => r.region === order.region);
    const otherRiders = riders.filter(r => r.region !== order.region);
    
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: '#1a1a1a', borderRadius: 14, width: '90%', maxWidth: 500,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', maxHeight: '80vh'
            }}>
                <div style={{
                    padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <h3 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                        Assign Rider to Order {order.id}
                    </h3>
                    <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                {/* Inline feedback */}
                {errorMsg && (
                    <div style={{ margin: '0.75rem 1.5rem 0', padding: '0.7rem 1rem', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, color: '#e74c3c', fontSize: '0.88rem', fontWeight: 600 }}>
                        ❌ {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div style={{ margin: '0.75rem 1.5rem 0', padding: '0.7rem 1rem', background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.4)', borderRadius: 8, color: '#27ae60', fontSize: '0.88rem', fontWeight: 600 }}>
                        ✅ {successMsg}
                    </div>
                )}

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    <p style={{ color: '#aaa', margin: '0 0 1rem', fontSize: '0.95rem' }}>
                        Customer Region: <strong style={{ color: '#C9A84C' }}>{order.region || 'Unknown'}</strong>
                    </p>
                    
                    <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Matched Riders (Same Region)</h4>
                    {matchRiders.length === 0 ? (
                        <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>No riders available in this region.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {matchRiders.map(r => (
                                <button key={r.id} onClick={() => onConfirm(r.id)} disabled={isSubmitting} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1rem', background: '#222', border: '1px solid currentColor', borderColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', color: '#fff',
                                    textAlign: 'left', transition: 'background 0.2s'
                                }} onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'} onMouseLeave={e => e.currentTarget.style.background = '#222'}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{r.name}</div>
                                        <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '4px' }}>{r.city}, {r.region}</div>
                                    </div>
                                    {isSubmitting ? <span style={{ color: '#888', fontSize: '0.85rem' }}>Assigning...</span> : <span style={{ color: '#3498db', fontWeight: 'bold' }}>Select</span>}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {otherRiders.length > 0 && (
                        <>
                            <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Other Active Riders</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {otherRiders.map(r => (
                                    <button key={r.id} onClick={() => onConfirm(r.id)} disabled={isSubmitting} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.8rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', color: '#ccc',
                                        textAlign: 'left', transition: 'background 0.2s'
                                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{r.name}</div>
                                            <div style={{ color: '#888', fontSize: '0.8rem' }}>{r.city}, {r.region}</div>
                                        </div>
                                        {!isSubmitting && <span style={{ color: '#666', fontSize: '0.85rem' }}>Select</span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOrders() {
    useCurrency();
    const [orderType, setOrderType] = useState('customer');
    const [filter, setFilter] = useState('All');
    const [deliveries, setDeliveries] = useState([]);
    const [deletedCustomerIds, setDeletedCustomerIds] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [assignModal, setAssignModal] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [assignSuccess, setAssignSuccess] = useState('');
    const [toast, setToast] = useState('');
    const [customerOrders, setCustomerOrders] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(true);

    const showToast = (msg, duration = 3000) => {
        setToast(msg);
        setTimeout(() => setToast(''), duration);
    };

    const fetchCustomerOrders = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/admin/orders');
            setCustomerOrders(res.data);
            setLoadingCustomerOrders(false);
        } catch(error) {
            console.error('Error fetching orders:', error);
            setLoadingCustomerOrders(false);
        }
    };

    const fetchRiders = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/admin/riders');
            setRiders(res.data.filter(r => r.rider_status === 'active'));
        } catch(error) {
            console.error('Error fetching riders:', error);
        }
    };

    useEffect(() => {
        fetchCustomerOrders();
        fetchRiders();
    }, []);

    // Purge ghost rows on mount
    useEffect(() => {
        const all = reqStore.getAll();
        const cleaned = all.filter(isRealOrder);
        if (cleaned.length !== all.length) reqStore.save(cleaned);
    }, []);

    // Live sync with reqStore
    useEffect(() => {
        const sync = () => setDeliveries(reqStore.getAll().filter(isRealOrder));
        sync();
        window.addEventListener('jk_req_update', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('jk_req_update', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const [viewMode, setViewMode] = useState('active'); // 'active' | 'archive'

    const mappedSupplierOrders = deliveries.map(d => {
        const mappedStatus = mapStatus(d.status);
        let displayDate = fmtDate(d.date);

        if (mappedStatus === 'Preparing') {
            displayDate = 'Awaiting delivery date';
        } else if (mappedStatus === 'Transporting') {
            displayDate = d.expectedDeliveryDate ? fmtDate(d.expectedDeliveryDate) : 'Pending Expected Date';
        } else if (mappedStatus === 'Delivered') {
            displayDate = d.deliveredAt ? fmtDate(d.deliveredAt) : fmtDate(d.date);
        }

        return {
            ...d, // Preserve all properties like isArchived
            id: d.ref || ('REQ-' + d.id),
            keyId: d.id,
            supplier: d.supplier || d.supplier_name || d.supplier_id || 'Unknown Supplier',
            customer: 'J&K Watch Admin',
            product: `${d.model} (Restock ×${d.qty})`,
            date: displayDate,
            amount: (d.price != null && d.qty != null)
                ? formatCurrency(Number(d.price) * Number(d.qty))
                : '—',
            status: mappedStatus,
            expectedDeliveryDate: d.expectedDeliveryDate || null,
        };
    });

    const allStatuses = ['All', 'Pending', 'Accepted', 'Preparing', 'Transporting', 'Delivered'];
    const customerStatusFilters = ['All', 'Completed', 'Pending', 'Processing', 'Out for Delivery'];

    const visibleCustomerOrders = customerOrders.map(o => {
        const mappedStatus = mapStatus(o.status);
        return {
            ...o,
            id: o.ref,
            keyId: o.id,
            customer: o.customer_name || o.user?.name || 'Unknown',
            product: `${o.product_name || (o.product ? o.product.name : 'Unknown Product')} (x${o.quantity})`,
            rawValue: o.total_amount,
            amount: formatCurrency(o.total_amount),
            date: fmtDate(o.created_at),
            status: mappedStatus,
            region: o.region || o.user?.region || '',
            isArchived: deletedCustomerIds.includes(o.ref) || deletedCustomerIds.includes(o.id)
        };
    });

    const currentBaseData = orderType === 'customer'
        ? visibleCustomerOrders
        : mappedSupplierOrders.filter(o => o.status !== 'Declined');
        
    const currentData = currentBaseData.filter(o => viewMode === 'archive' ? o.isArchived : !o.isArchived);
        
    const filterList = orderType === 'customer' ? customerStatusFilters : allStatuses;
    const filtered = filter === 'All' ? currentData : currentData.filter(o => o.status === filter);

    // ── Delete handlers ───────────────────────────────────────────────────────
    const handleDeleteClick = (o) => setConfirmDelete(o);

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        if (orderType === 'customer') {
            // Customer order: delete from DB via API
            try {
                const axios = (await import('axios')).default;
                await axios.delete(`/api/admin/orders/${confirmDelete.keyId}`);
                setCustomerOrders(prev => prev.filter(o => o.id !== confirmDelete.keyId));
                showToast('Order deleted successfully.');
            } catch (err) {
                showToast('Failed to delete order.');
            }
        } else {
            // Supplier/admin order: remove from reqStore so supplier no longer sees this request.
            const isDelivered = confirmDelete.status === 'Delivered';
            
            // Always remove from reqStore (admin view clears regardless)
            reqStore.remove(confirmDelete.keyId);
            
            if (isDelivered) {
                // Delivered: keep supplier's delivery archive intact.
                // Stock was already deducted on delivery — do NOT reverse it.
                showToast('Order record removed. Supplier delivery archive preserved.');
            } else {
                // Not yet delivered: remove from supplier delivery queue too,
                // and restore any stock that was previously deducted (defensive).
                deliveryStore.removeByReqId(confirmDelete.keyId);
                if (confirmDelete.product_id) {
                    supplierStockStore.restore(confirmDelete.product_id, Number(confirmDelete.qty));
                }
                showToast('Order removed. Supplier will no longer see this request.');
            }
        }
        setConfirmDelete(null);
    };

    const handleAssignRider = async (riderId) => {
        if (!assignModal || !riderId) return;
        setIsAssigning(true);
        setAssignError('');
        setAssignSuccess('');
        try {
            const axios = (await import('axios')).default;
            const res = await axios.put(`/api/admin/orders/${assignModal.keyId}/assign-rider`, { rider_id: riderId });
            // Update in-state with returned order (which has rider loaded)
            setCustomerOrders(prev => prev.map(o => o.id === assignModal.keyId ? res.data : o));
            setAssignSuccess('Rider assigned successfully!');
            setTimeout(() => setAssignModal(null), 1200);
        } catch (error) {
            const msg = error?.response?.data?.message || 'Failed to assign rider. Please try again.';
            setAssignError(msg);
        } finally {
            setIsAssigning(false);
        }
    };

    const colSpan = orderType === 'supplier' ? 8 : 7;

    return (
        <AdminLayout>
            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
                    background: '#27ae60', color: '#fff', padding: '0.9rem 1.5rem',
                    borderRadius: 10, fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', animation: 'fadeIn 0.3s'
                }}>
                    {toast}
                </div>
            )}
            <div className="admin-page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="admin-page-title">Orders Management</h1>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '12px' }}>
                        <button
                            className={`admin-filter-btn ${orderType === 'customer' ? 'active' : ''}`}
                            onClick={() => { setOrderType('customer'); setFilter('All'); }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            Customer Orders
                        </button>
                        <button
                            className={`admin-filter-btn ${orderType === 'supplier' ? 'active' : ''}`}
                            onClick={() => { setOrderType('supplier'); setFilter('All'); }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                            Admin Orders
                        </button>
                    </div>
                </div>

                {/* Status filters and View Mode */}
                <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-end', paddingBottom: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {filterList.map(f => (
                            <button
                                key={f}
                                className={`admin-filter-btn${filter === f ? ' active' : ''}`}
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}
                                onClick={() => setFilter(f)}
                            >{f}</button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: 10, gap: '4px' }}>
                        <button
                            onClick={() => setViewMode('active')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '0.45rem 1.1rem', background: viewMode === 'active' ? '#27ae60' : 'transparent',
                                border: 'none', borderRadius: 8, fontWeight: viewMode === 'active' ? 800 : 600,
                                color: viewMode === 'active' ? '#fff' : '#aaa', cursor: 'pointer', fontSize: '0.85rem',
                                transition: 'all 0.2s', boxShadow: viewMode === 'active' ? '0 2px 8px rgba(39,174,96,0.3)' : 'none'
                            }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            Active
                        </button>
                        <button
                            onClick={() => setViewMode('archive')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '0.45rem 1.1rem', background: viewMode === 'archive' ? '#C9A84C' : 'transparent',
                                border: 'none', borderRadius: 8, fontWeight: viewMode === 'archive' ? 800 : 600,
                                color: viewMode === 'archive' ? '#111827' : '#aaa', cursor: 'pointer', fontSize: '0.85rem',
                                transition: 'all 0.2s', boxShadow: viewMode === 'archive' ? '0 2px 8px rgba(201,168,76,0.3)' : 'none'
                            }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={viewMode === 'archive' ? '#111827' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                            Archive
                        </button>
                    </div>

                </div>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>{orderType === 'customer' ? 'Customer' : 'Company'}</th>
                            {orderType === 'supplier' && <th>Orderer</th>}
                            <th>Product Details</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No {viewMode === 'archive' ? 'archived' : 'active'} {orderType} orders found for this status.
                                </td>
                            </tr>
                        ) : filtered.map((o, idx) => {
                            const st = STATUS_STYLES[o.status] || STATUS_STYLES.Pending;
                            return (
                                <tr key={o.keyId || o.id || idx}>
                                    <td style={{ fontWeight: 700, color: '#C9A84C' }}>{o.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {orderType === 'customer' ? o.customer : o.supplier}
                                        </div>
                                    </td>
                                    {orderType === 'supplier' && (
                                        <td><div style={{ fontWeight: 600 }}>{o.customer}</div></td>
                                    )}
                                    <td>
                                        <span style={{ color: orderType === 'supplier' ? '#2980b9' : 'inherit' }}>
                                            {o.product}
                                        </span>
                                    </td>
                                    <td className="admin-table__muted">{o.date}</td>
                                    <td style={{ fontWeight: 700 }}>{o.amount}</td>
                                    <td>
                                        <span className="admin-badge" style={{ background: st.bg, color: st.color, fontWeight: 700 }}>
                                            {o.status}
                                        </span>
                                        {/* Status is 'Delivered' check moved to actions column since prompt requested 'ACTIONS column or above status badge' but actions column is more standard. Or below the status badge, wait, I will render it inside the Actions table data cell below. */}
                                    </td>
                                    <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {!o.isArchived && (
                                            <button
                                                title="Move to Archive"
                                                onClick={() => handleDeleteClick(o)}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 30, height: 30, borderRadius: 7,
                                                    background: 'rgba(231,76,60,0.12)',
                                                    border: '1px solid rgba(231,76,60,0.25)',
                                                    color: '#e74c3c', cursor: 'pointer',
                                                    transition: 'background 0.2s, border-color 0.2s',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'rgba(231,76,60,0.28)';
                                                    e.currentTarget.style.borderColor = 'rgba(231,76,60,0.6)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(231,76,60,0.12)';
                                                    e.currentTarget.style.borderColor = 'rgba(231,76,60,0.25)';
                                                }}
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                        {o.isArchived && (
                                            <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4, display: 'inline-block' }}>
                                                Archived
                                            </div>
                                        )}
                                        {orderType === 'customer' && !o.rider_id && o.status !== 'Out for Delivery' && o.status !== 'Delivered' && o.status !== 'Assigned' && !o.isArchived && (
                                            <button onClick={() => setAssignModal(o)} style={{
                                                padding: '0.35rem 0.6rem', borderRadius: '4px', background: 'transparent', border: '1px solid #3498db',
                                                color: '#3498db', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer'
                                            }}>
                                                Assign Rider
                                            </button>
                                        )}
                                        {orderType === 'customer' && o.rider_id && !o.isArchived && (
                                            <div style={{ fontSize: '0.75rem', color: '#27ae60', fontWeight: 'bold' }}>
                                                {o.rider?.name || 'Rider Assigned'}
                                            </div>
                                        )}
                                        {orderType === 'customer' && o.status === 'Delivered' && o.proof_of_delivery && !o.isArchived && (
                                            <a href={o.proof_of_delivery.startsWith('http') ? o.proof_of_delivery : (o.proof_of_delivery.startsWith('/storage') ? o.proof_of_delivery : `/storage/${o.proof_of_delivery}`)} target="_blank" rel="noopener noreferrer" style={{
                                                marginTop: 4, display: 'block', color: '#3498db', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none'
                                            }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                                View Proof of Delivery
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Confirm delete modal */}
            {confirmDelete && (
                <ConfirmDeleteModal
                    order={confirmDelete}
                    orderType={orderType}
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}

            
            {/* Assign Rider modal */}
            {assignModal && (
                <AssignRiderModal
                    order={assignModal}
                    riders={riders}
                    onCancel={() => { setAssignModal(null); setAssignError(''); setAssignSuccess(''); }}
                    onConfirm={handleAssignRider}
                    isSubmitting={isAssigning}
                    errorMsg={assignError}
                    successMsg={assignSuccess}
                />
            )}
        </AdminLayout>
    );
}
