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

// ─── Order Detail Modal (Change 3) ────────────────────────────────────────────
const IMG_BASE = '/storage/';
function OrderDetailModal({ order, onClose }) {
    if (!order) return null;
    const st = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
    const rows = [
        { label: 'Order ID',       value: order.id },
        { label: 'Product Name',   value: order.model || order.rawProduct },
        { label: 'Brand',          value: order.brand },
        { label: 'Category',       value: order.category },
        { label: 'Company',        value: order.supplier },
        { label: 'Orderer',        value: order.customer },
        { label: 'Quantity',       value: order.qty != null ? `${order.qty} units` : (order.quantity != null ? `${order.quantity} units` : '—') },
        { label: 'Unit Price',     value: order.unit_price != null ? `₱${Number(order.unit_price).toLocaleString()}` : '—' },
        { label: 'Total Amount',   value: order.amount },
        { label: 'Date',           value: order.date },
        { label: 'Payment Method', value: order.payment || order.payment_method || '—' },
    ];
    const imgSrc = order.image || (order.rawImage ? (order.rawImage.startsWith('http') ? order.rawImage : IMG_BASE + order.rawImage) : null);
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#1a1a1a', borderRadius: 14, width: '90%', maxWidth: 520, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 60px rgba(0,0,0,0.8)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, color: '#C9A84C', fontWeight: 700, fontSize: '1.05rem' }}>Order Details — {order.id}</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                </div>
                <div style={{ padding: '1.4rem', overflowY: 'auto' }}>
                    {/* Image + Status header */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 10, background: '#111', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {imgSrc
                                ? <img src={imgSrc} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                                : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', marginBottom: 4 }}>{order.model || order.rawProduct || '—'}</div>
                            <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>{order.status}</span>
                        </div>
                    </div>
                    {/* Detail grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        {rows.map(r => (
                            <div key={r.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem 0.9rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '0.68rem', color: '#666', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.label}</div>
                                <div style={{ fontWeight: 700, color: '#e5e5e5', fontSize: '0.88rem', wordBreak: 'break-word' }}>{r.value || '—'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ order, onCancel, onConfirm, orderType, actionLabel }) {
    const isCancel = actionLabel === 'cancel';
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
                    <span style={{ fontSize: '1.15rem' }}>{isCancel ? '🚫' : '🗑️'}</span>
                    <h3 style={{ margin: 0, color: isCancel ? '#f59e0b' : '#e74c3c', fontWeight: 700, fontSize: '1rem' }}>
                        {isCancel ? 'Cancel Order' : 'Delete Order'}
                    </h3>
                </div>
                <div style={{ padding: '1.25rem 1.4rem' }}>
                    <p style={{ color: '#ccc', margin: '0 0 0.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Are you sure you want to {isCancel ? 'cancel' : 'permanently delete'} order{' '}
                        <strong style={{ color: '#C9A84C' }}>{order.id}</strong>?
                    </p>
                    <p style={{ color: '#888', margin: '0 0 0.5rem', fontSize: '0.82rem' }}>
                        {order.product} · {order.date}
                    </p>
                    {isCancel && (
                        <p style={{ color: '#f59e0b', margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>
                            ⚠️ This will remove the request from the Supplier's Active Requests. No stock will be deducted.
                        </p>
                    )}
                    <div style={{ marginTop: '1.4rem', display: 'flex', justifyContent: 'flex-end', gap: '0.7rem' }}>
                        <button onClick={onCancel} style={{
                            padding: '0.55rem 1.2rem', background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                            color: '#aaa', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem',
                        }}>Cancel</button>
                        <button onClick={onConfirm} style={{
                            padding: '0.55rem 1.2rem', background: isCancel ? '#f59e0b' : '#e74c3c',
                            border: 'none', borderRadius: 8,
                            color: isCancel ? '#000' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                        }}>{isCancel ? 'Yes, Cancel Order' : 'Yes, Delete'}</button>
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
    const [detailOrder, setDetailOrder] = useState(null); // Change 3: order detail modal

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
            ...d,
            id: d.ref || ('REQ-' + d.id),
            keyId: d.id,
            supplier: d.supplier || d.supplier_name || d.supplier_id || 'Unknown Supplier',
            customer: 'J&K Watch Admin',
            // Change 2: expose raw fields for new columns
            model: d.model,
            rawProduct: d.model,
            rawImage: d.image || null,
            brand: d.brand || '—',
            category: d.category || '—',
            qty: d.qty,
            unit_price: d.price,
            payment: d.payment,
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
            // Change 2: expose brand/category/image for new columns
            brand: o.brand?.name || o.brand_name || '—',
            category: o.product?.category?.name || '—',
            rawImage: o.product?.image || null,
            rawProduct: o.product_name || (o.product ? o.product.name : ''),
            model: o.product_name || (o.product ? o.product.name : ''),
            qty: o.quantity,
            unit_price: o.unit_price,
            payment: o.payment_method,
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

    // Change 2: updated column spans to include Image, Brand, Category
    const colSpan = orderType === 'supplier' ? 11 : 10;

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
                {/* Problem 1: scrollable wrapper so table never squishes */}
                <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="admin-table" style={{ minWidth: 1200, tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ minWidth: 130 }} />
                        <col style={{ width: 70 }} />
                        <col style={{ minWidth: 100 }} />
                        <col style={{ minWidth: 110 }} />
                        <col style={{ minWidth: 90 }} />
                        {orderType === 'supplier' && <col style={{ minWidth: 130 }} />}
                        <col style={{ minWidth: 150 }} />
                        <col style={{ minWidth: 100 }} />
                        <col style={{ minWidth: 90 }} />
                        <col style={{ minWidth: 110 }} />
                        <col style={{ minWidth: 140 }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Image</th>
                            <th>Brand</th>
                            <th>Category</th>
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
                            // Change 2: image src logic
                            const imgSrc = o.rawImage
                                ? (o.rawImage.startsWith('http') ? o.rawImage : '/storage/' + o.rawImage)
                                : null;
                            // Change 1: action button logic based on status
                            const isPending = o.status === 'Pending';
                            const isDelivered = o.status === 'Delivered' || o.status === 'Completed';
                            const isInProgress = ['Accepted','Preparing','Transporting','Assigned','Out for Delivery','Processing'].includes(o.status);
                            return (
                                <tr key={o.keyId || o.id || idx}>
                                    {/* Change 3: Clickable Order ID */}
                                    <td style={{ fontWeight: 700, color: '#C9A84C', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                                        onClick={() => setDetailOrder(o)}>{o.id}</td>
                                    {/* Problem 3: 48×48 thumbnail — white bg for transparent PNGs */}
                                    <td>
                                        <div style={{ width: 48, height: 48, borderRadius: 6, background: '#fff', border: '1px solid #e5e7eb', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                            {imgSrc
                                                ? <img src={imgSrc} alt="" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 4 }} onError={e => e.target.style.display='none'} />
                                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>}
                                        </div>
                                    </td>
                                    {/* Change 2: Brand column */}
                                    <td className="admin-table__muted" style={{ fontSize: '0.82rem' }}>{o.brand || '—'}</td>
                                    {/* Change 2: Category column */}
                                    <td className="admin-table__muted" style={{ fontSize: '0.82rem' }}>{o.category || '—'}</td>
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
                                    </td>
                                    {/* Actions column */}
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                        {!o.isArchived && orderType === 'supplier' && isPending && (
                                            /* Problem 2: compact red-bordered Cancel Order button */
                                            <button
                                                title="Cancel Order"
                                                onClick={() => handleDeleteClick({ ...o, _actionLabel: 'cancel' })}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    height: 32, padding: '0 10px', borderRadius: 6,
                                                    background: 'transparent',
                                                    border: '1px solid #e74c3c',
                                                    color: '#e74c3c', cursor: 'pointer', fontWeight: 600, fontSize: '0.76rem',
                                                    whiteSpace: 'nowrap', lineHeight: 1,
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{ fontSize: '0.8rem' }}>✕</span> Cancel Order
                                            </button>
                                        )}
                                        {!o.isArchived && orderType === 'supplier' && isDelivered && (
                                            <button
                                                title="Delete Order"
                                                onClick={() => handleDeleteClick(o)}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 30, height: 30, borderRadius: 7,
                                                    background: 'rgba(231,76,60,0.12)',
                                                    border: '1px solid rgba(231,76,60,0.25)',
                                                    color: '#e74c3c', cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.28)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.6)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.12)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.25)'; }}
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                        {!o.isArchived && orderType === 'supplier' && isInProgress && (
                                            <span style={{ fontSize: '0.72rem', color: '#6b7280', fontStyle: 'italic' }}>In progress</span>
                                        )}
                                        {/* Customer orders: trash for non-archive only */}
                                        {!o.isArchived && orderType === 'customer' && (
                                            <button
                                                title="Delete Order"
                                                onClick={() => handleDeleteClick(o)}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 30, height: 30, borderRadius: 7,
                                                    background: 'rgba(231,76,60,0.12)',
                                                    border: '1px solid rgba(231,76,60,0.25)',
                                                    color: '#e74c3c', cursor: 'pointer',
                                                    transition: 'background 0.2s, border-color 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.28)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.6)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.12)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.25)'; }}
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                        {/* Problem 4: styled Archived badge pill */}
                                        {o.isArchived && (
                                            <span style={{ background: '#f0f0f0', color: '#888', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                Archived
                                            </span>
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
                                    </div></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>{/* end scroll wrapper */}
            </div>

            {/* Change 3: Order detail modal */}
            {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

            {/* Confirm delete/cancel modal */}
            {confirmDelete && (
                <ConfirmDeleteModal
                    order={confirmDelete}
                    orderType={orderType}
                    actionLabel={confirmDelete._actionLabel || 'delete'}
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
