import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { reqStore } from '../sharedStore';
import { formatCurrency, useCurrency } from '../utils/currency';

// ─── Auth helpers — use jk_token ─────────────────────
const getToken = () => localStorage.getItem('jk_token');
const authHead = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
const IMG_BASE = '/storage/';

const INV_COLOR_CSS = { black:'#111', white:'#e0e0e0', silver:'#C0C0C0', gold:'#FFD700', 'rose gold':'#B76E79', blue:'#3B82F6', navy:'#1E3A5F', green:'#22C55E', red:'#EF4444', orange:'#F97316', yellow:'#EAB308', purple:'#A855F7', pink:'#EC4899', brown:'#92400E', gray:'#6B7280', grey:'#6B7280', titanium:'#878681', champagne:'#F7E7CE' };
const getInvColorCSS = (name) => INV_COLOR_CSS[name?.toLowerCase()?.trim()] || '#888';
const parseInvColors = (raw) => { if (!raw) return []; if (Array.isArray(raw)) return raw; try { return JSON.parse(raw); } catch { return []; } };

function stockStatus(stock) {
    if (stock === 0) return { bg: 'rgba(231,76,60,0.12)', color: '#e74c3c', label: 'Out of Stock' };
    if (stock <= 5) return { bg: 'rgba(201,168,76,0.15)', color: '#C9A84C', label: 'Low Stock' };
    return { bg: 'rgba(39,174,96,0.12)', color: '#27ae60', label: 'In Stock' };
}

const S = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'admin-fade-in 0.25s ease-out' },
    modal: { background: '#1a1a1a', borderRadius: 12, width: '100%', maxWidth: 450, padding: 0, border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)', overflow: 'hidden', animation: 'admin-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)' },
    mHeader: { padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    mTitle: { margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 700 },
    closeBtn: { background: 'rgba(231,76,60,0.1)', border: 'none', color: '#e74c3c', fontSize: '1.2rem', cursor: 'pointer', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    label: { display: 'block', marginBottom: '0.4rem', color: '#aaa', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' },
    input: { width: '100%', padding: '0.7rem 0.85rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box', transition: 'all 0.2s ease' },
    mFooter: { padding: '1.5rem 1.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#1a1a1a' },
    cancelBtn: { padding: '0.6rem 1.25rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
    saveBtn: { padding: '0.6rem 1.5rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
    thumb: { width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' },
    noImg: { width: 44, height: 44, borderRadius: 8, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ product, onClose, onDeleted }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await axios.delete(`/api/admin/products/${product.id}`, authHead());
            const all = reqStore.getAll() || [];
            all.forEach(r => {
                if (!r?._productSnapshot) return;
                const s = r._productSnapshot;
                const nameMatch = s.name?.trim().toLowerCase() === product.name?.trim().toLowerCase();
                const brandMatch = String(s.brand_id || s.brand?.id || '') === String(product.brand_id || '');
                const catMatch = String(s.category_id || s.category?.id || '') === String(product.category_id || '');
                if (nameMatch && brandMatch && catMatch) {
                    reqStore.update(r.id, { _deletedFromMgmt: true });
                }
            });
            onDeleted();
        } catch (err) {
            console.error('Failed to delete', err);
            setLoading(false);
        }
    };
    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...S.modal, maxWidth: 420 }}>
                <div style={S.mHeader}>
                    <h2 style={{ ...S.mTitle, color: '#e74c3c' }}>Delete Product Inventory</h2>
                    <button style={S.closeBtn} onClick={onClose} disabled={loading}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        Are you sure you want to remove <strong style={{ color: '#fff' }}>{product.name}</strong> from inventory?
                    </p>
                    <div style={S.mFooter}>
                        <button type="button" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: '#444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={onClose} disabled={loading}>Cancel</button>
                        <button className="admin-btn-red" onClick={handleDelete} disabled={loading}>
                            {loading ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminInventory() {
    useCurrency();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // { type: 'edit' | 'delete', product }

    const load = () => {
        axios.get('/api/admin/products', authHead())
            .then(r => setProducts(r.data))
            .catch(err => console.error("Failed to load inventory:", err));
    };

    useEffect(() => {
        load();
        window.addEventListener('jk_inventory_update', load);
        return () => window.removeEventListener('jk_inventory_update', load);
    }, []);

    const filtered = products.filter(p => {
        const q = search.toLowerCase();
        return (p.name ?? '').toLowerCase().includes(q) ||
            (p.brand?.name ?? '').toLowerCase().includes(q) ||
            (p.supplier?.name ?? '').toLowerCase().includes(q) ||
            (p.category?.name ?? '').toLowerCase().includes(q);
    });

    const closeModal = () => setModal(null);
    const saved = () => {
        closeModal();
        load();
        window.dispatchEvent(new Event('jk_inventory_update'));
        window.dispatchEvent(new Event('jk_req_update')); // Ensure Product Management table updates immediately
    };

    return (
        <AdminLayout>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Inventory Management</h1>
            </div>

            <div className="admin-card">
                <div className="admin-card__header">
                    <div className="admin-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input type="text" placeholder="Search inventory..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="admin-table" style={{ minWidth: 1100 }}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Image</th>
                            <th>Product Name</th>
                            <th>Brand</th>
                            <th>Company</th>
                            <th>Category</th>
                            <th>Unit Price</th>
                            <th>Stock</th>
                            <th>Gender</th>
                            <th>Age Group</th>
                            <th>Color Variant</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan="13" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                No items in inventory. Products will appear here automatically when added in Product Management.
                            </td></tr>
                        )}
                        {filtered.map((p, i) => {
                            const st = stockStatus(p.stock);
                            return (
                                <tr key={p.id}>
                                    <td className="admin-table__muted">{i + 1}</td>
                                    <td>
                                        {p.image ? (
                                            <img src={IMG_BASE + p.image} alt={p.name} style={S.thumb}
                                                onError={e => (e.target.style.display = 'none')} />
                                        ) : (
                                            <div style={S.noImg}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" />
                                                </svg>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td className="admin-table__muted">{p.brand?.name ?? '—'}</td>
                                    <td className="admin-table__muted">{p.supplier?.name ?? '—'}</td>
                                    <td className="admin-table__muted">{p.category?.name ?? '—'}</td>
                                    <td style={{ color: '#111', fontWeight: 700 }}>
                                        {formatCurrency(p.price)}
                                    </td>
                                    <td style={{ fontWeight: 600, color: p.stock === 0 ? '#e74c3c' : 'inherit' }}>{p.stock}</td>
                                    <td className="admin-table__muted">{p.gender || 'All'}</td>
                                    <td className="admin-table__muted">{p.variant || 'All'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {parseInvColors(p.color_variants).length === 0
                                                ? <span style={{ color: '#111', fontSize: '0.82rem' }}>—</span>
                                                : parseInvColors(p.color_variants).map((c, i) => (
                                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', color: '#111', whiteSpace: 'nowrap' }}>
                                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: getInvColorCSS(c), border: '1px solid rgba(0,0,0,0.18)', display: 'inline-block', flexShrink: 0 }} />{c}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    </td>
                                    <td>
                                        <span className="admin-badge" style={{ background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button title="Remove" className="admin-icon-btn admin-icon-btn--delete"
                                                onClick={() => setModal({ type: 'delete', product: p })}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6" /><path d="M14 11v6" />
                                                    <path d="M9 6V4h6v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            </div>

            {modal?.type === 'delete' && <DeleteModal product={modal.product} onClose={closeModal} onDeleted={saved} />}
        </AdminLayout>
    );
}
