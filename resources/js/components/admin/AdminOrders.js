import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { reqStore, deliveryStore } from '../sharedStore';
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

// ─── Order Detail Modal ───────────────────────────────────────────────────────
const IMG_BASE = '/storage/';
function OrderDetailModal({ order, onClose, isCustomer }) {
    if (!order) return null;
    const st = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;

    // Build rows — exclude Company for customer orders
    const rows = [
        { label: 'Order ID', value: order.id },
        { label: 'Product Name', value: order.model || order.rawProduct || '—' },
        { label: 'Brand', value: order.brand || '—' },
        { label: 'Category', value: order.category || '—' },
        ...(isCustomer ? [] : [{ label: 'Company', value: order.supplier || '—' }]),
        { label: isCustomer ? 'Customer' : 'Orderer', value: order.customer || '—' },
        { label: 'Quantity', value: order.qty != null ? `${order.qty} units` : (order.quantity != null ? `${order.quantity} units` : '—') },
        { label: 'Unit Price', value: order.unit_price != null ? `₱${Number(order.unit_price).toLocaleString()}` : '—' },
        { label: 'Total Amount', value: order.amount || '—' },
        { label: 'Date', value: order.date || '—' },
        { label: 'Payment Method', value: order.payment || order.payment_method || '—' },
        { label: 'Status', value: order.status || '—', isStatus: true },
    ];

    const imgSrc = order.image || (order.rawImage
        ? (order.rawImage.startsWith('http') ? order.rawImage : IMG_BASE + order.rawImage)
        : null);

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: '#111', borderRadius: 18, width: '100%', maxWidth: 540, border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 32px 80px rgba(0,0,0,0.85)', overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header bar */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#161616' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: '#C9A84C', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>Order Details</div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.2px' }}>{order.id}</div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#aaa'; }}
                    >✕</button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {/* Hero: product image + name + status */}
                    <div style={{ padding: '1.4rem 1.5rem 1.2rem', display: 'flex', gap: '1.1rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#151515' }}>
                        <div style={{ width: 78, height: 78, borderRadius: 12, background: '#fff', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                            {imgSrc
                                ? <img src={imgSrc} alt="product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                                : <span style={{ fontSize: '2rem' }}>⌚</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', lineHeight: 1.35, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.model || order.rawProduct || '—'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 8 }}>{order.brand || ''}{order.brand && order.category ? ' · ' : ''}{order.category || ''}</div>
                            <span style={{
                                display: 'inline-block',
                                background: st.bg, color: st.color,
                                borderRadius: 999, padding: '0.25rem 0.9rem',
                                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
                                border: `1px solid ${st.color}33`,
                            }}>{order.status}</span>
                        </div>
                    </div>

                    {/* Detail grid */}
                    <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        {rows.filter(r => !r.isStatus).map(r => (
                            <div key={r.label} style={{
                                background: 'rgba(255,255,255,0.035)',
                                borderRadius: 10, padding: '0.7rem 1rem',
                                border: '1px solid rgba(255,255,255,0.06)',
                                transition: 'background 0.15s',
                            }}>
                                <div style={{ fontSize: '0.63rem', color: '#555', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</div>
                                <div style={{ fontWeight: 700, color: '#e0e0e0', fontSize: '0.875rem', wordBreak: 'break-word', lineHeight: 1.4 }}>{r.value}</div>
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
                        <button type="button" onClick={onCancel} style={{
                            padding: '0.55rem 1.2rem', background: '#e74c3c',
                            border: 'none', borderRadius: 8,
                            color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOrders() {
    useCurrency();
    const [orderType, setOrderType] = useState('customer');
    const [filter, setFilter] = useState('All');
    const [deliveries, setDeliveries] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);
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
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoadingCustomerOrders(false);
        }
    };

    const fetchRiders = async () => {
        try {
            const axios = (await import('axios')).default;
            const res = await axios.get('/api/admin/riders');
            setRiders(res.data.filter(r => r.rider_status === 'active'));
        } catch (error) {
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
        // Pull gender/age-group/color_variants from the related product record
        const pGender   = o.product?.gender        || '—';
        const pVariant  = o.product?.variant       || '—';
        const pColors   = o.product?.color_variants || [];
        return {
            ...o,
            id: o.ref,
            keyId: o.id,
            customer: o.customer_name || o.user?.name || 'Unknown',
            // brand / category / image
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
            isArchived: o.admin_archived || o.isArchived,
            // New product-attribute columns
            gender: pGender,
            ageGroup: pVariant,
            colorVariants: Array.isArray(pColors) ? pColors : [],
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
                setCustomerOrders(prev => prev.map(o => o.id === confirmDelete.keyId ? { ...o, admin_archived: 1 } : o));
                showToast('Order archived successfully.');
            } catch (err) {
                showToast('Failed to delete order.');
            }
        } else {
            // Supplier/admin order: archive the request by updating reqStore.
            const isDelivered = confirmDelete.status === 'Delivered';

            // Archive in reqStore (moves to Archive tab, supplier remains unaffected)
            reqStore.update(confirmDelete.keyId, { isArchived: true });

            if (isDelivered) {
                showToast('Order archived. Supplier delivery archive preserved.');
            } else {
                showToast('Order archived. Supplier will still process this request.');
            }
        }
        setConfirmDelete(null);
    };



    // Column count: customer=13 cols, supplier=14 cols (extra Company/Orderer)
    const colSpan = orderType === 'supplier' ? 14 : 13;

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
                {/* Scrollable wrapper — never squishes columns */}
                <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <table className="admin-table" style={{ minWidth: 1600, tableLayout: 'auto' }}>
                        <colgroup>
                            <col style={{ minWidth: 130 }} />
                            <col style={{ width: 70 }} />
                            <col style={{ minWidth: 100 }} />
                            <col style={{ minWidth: 110 }} />
                            <col style={{ minWidth: 110 }} />
                            {orderType === 'supplier' && <col style={{ minWidth: 130 }} />}
                            <col style={{ minWidth: 160 }} />
                            <col style={{ minWidth: 100 }} />
                            <col style={{ minWidth: 90 }} />
                            {/* New columns */}
                            <col style={{ minWidth: 80 }} />
                            <col style={{ minWidth: 80 }} />
                            <col style={{ minWidth: 140 }} />
                            <col style={{ minWidth: 110 }} />
                            <col style={{ minWidth: 150 }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Image</th>
                                <th>Brand</th>
                                <th>Category</th>
                                {orderType === 'supplier' ? <th>Company</th> : <th>Customer</th>}
                                {orderType === 'supplier' && <th>Orderer</th>}
                                <th>Product Details</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Gender</th>
                                <th>Age Group</th>
                                <th>Color Variant</th>
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
                                const isInProgress = ['Accepted', 'Preparing', 'Transporting', 'Assigned', 'Out for Delivery', 'Processing'].includes(o.status);
                                return (
                                    <tr key={o.keyId || o.id || idx}>
                                        {/* Change 3: Clickable Order ID */}
                                        <td style={{ fontWeight: 700, color: '#C9A84C', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                                            onClick={() => setDetailOrder(o)}>{o.id}</td>
                                        {/* Problem 3: 48×48 thumbnail — white bg for transparent PNGs */}
                                        <td>
                                            <div style={{ width: 48, height: 48, borderRadius: 6, background: '#fff', border: '1px solid #e5e7eb', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                {imgSrc
                                                    ? <img src={imgSrc} alt="" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 4 }} onError={e => e.target.style.display = 'none'} />
                                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>}
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
                                        {/* Gender column */}
                                        <td className="admin-table__muted" style={{ fontSize: '0.82rem' }}>
                                            {orderType === 'customer' ? (o.gender || '—') : '—'}
                                        </td>
                                        {/* Age Group column */}
                                        <td className="admin-table__muted" style={{ fontSize: '0.82rem' }}>
                                            {orderType === 'customer' ? (o.ageGroup || '—') : '—'}
                                        </td>
                                        {/* Color Variant column */}
                                        <td>
                                            {orderType === 'customer' && Array.isArray(o.colorVariants) && o.colorVariants.length > 0
                                                ? <span style={{ fontSize: '0.82rem', color: '#111' }}>
                                                    {o.colorVariants.join(', ')}
                                                  </span>
                                                : <span style={{ color: '#111', fontSize: '0.82rem' }}>—</span>
                                            }
                                        </td>
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
                                                {orderType === 'customer' && !o.rider_id && o.status === 'Pending' && !o.isArchived && (
                                                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>
                                                        Pending Broadcast
                                                    </div>
                                                )}
                                                {orderType === 'customer' && o.rider_id && !o.isArchived && (
                                                    <div style={{ fontSize: '0.75rem', color: '#3498db', fontWeight: 'bold' }}>
                                                        {o.rider?.name ? `Accepted by ${o.rider.name}` : 'Accepted by Rider'}
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

            {/* Order detail modal */}
            {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} isCustomer={orderType === 'customer'} />}

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


        </AdminLayout>
    );
}
