import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { reqStore } from '../sharedStore';
import { formatCurrency, useCurrency } from '../utils/currency';

// ─── Auth helpers — use jk_token ─────────────────────
const getToken = () => localStorage.getItem('jk_token');
const authHead = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
const IMG_BASE = '/storage/';


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
    closeBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#777', fontSize: '1.2rem', cursor: 'pointer', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    label: { display: 'block', marginBottom: '0.4rem', color: '#aaa', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' },
    input: { width: '100%', padding: '0.7rem 0.85rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box', transition: 'all 0.2s ease' },
    mFooter: { padding: '1.5rem 1.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#1a1a1a' },
    cancelBtn: { padding: '0.6rem 1.25rem', background: 'transparent', color: '#aaa', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },
    saveBtn: { padding: '0.6rem 1.5rem', background: '#C9A84C', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
    thumb: { width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' },
    noImg: { width: 44, height: 44, borderRadius: 8, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// ─── Edit Stock & Price Modal ────────────────────────────────────────────────
function EditModal({ product, onClose, onSaved }) {
    const [newStock, setNewStock] = useState(product.stock || 0);
    const [price, setPrice] = useState(product.price || 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Compute available stock in Product Management
    const allReqs = reqStore.getAll() || [];
    const delivered = allReqs.filter(r =>
        r?.status === 'completed' &&
        r?._productSnapshot &&
        !r?._placedInInventory &&
        !r?._deletedFromMgmt
    );

    const pKey = `${product.name}|${product.brand?.name || ''}|${product.category?.name || ''}|${product.supplier?.name || ''}`;
    let availableStock = 0;
    const matchingReqs = [];
    delivered.forEach(r => {
        const s = r._productSnapshot;
        const key = `${s.name}|${s.brand?.name || ''}|${s.category?.name || ''}|${s.supplier?.name || ''}`;
        if (key === pKey) {
            availableStock += (s.stock || 0);
            matchingReqs.push(r);
        }
    });

    // Live preview: projected available stock after the edit
    const newStockNum = Number(newStock);
    const diff = newStockNum - product.stock; // positive = taking from PM, negative = returning to PM
    const projectedAvailable = availableStock - diff;
    const notEnoughStock = diff > 0 && diff > availableStock;

    const handleSave = async () => {
        setError('');
        const newStockNum = Number(newStock);
        if (newStockNum < 0) return setError('Stock cannot be negative.');
        if (notEnoughStock) return setError('Not enough stock in Product Management.');

        setLoading(true);
        try {
            await axios.put(`/api/admin/products/${product.id}`, {
                stock: newStockNum,
                price: Number(price)
            }, authHead());

            if (diff < 0) {
                // Return stock to PM (Inventory stock decreased)
                reqStore.add({
                    id: 'RES-' + Date.now(),
                    _isRestoreRecord: true,
                    status: 'completed',
                    date: new Date().toISOString(),
                    _productSnapshot: { ...product, stock: Math.abs(diff) }
                });
            } else if (diff > 0) {
                // Deduct stock from PM (Inventory stock increased)
                let remainingToDeduct = diff;
                for (const reqItem of [...matchingReqs].sort((a, b) => new Date(a.date) - new Date(b.date))) {
                    if (remainingToDeduct <= 0) break;
                    const curStock = reqItem._productSnapshot?.stock || 0;
                    if (curStock <= 0) continue;

                    const deductAmount = Math.min(curStock, remainingToDeduct);
                    remainingToDeduct -= deductAmount;
                    const newCurStock = curStock - deductAmount;

                    const patch = {
                        _productSnapshot: { ...reqItem._productSnapshot, stock: newCurStock }
                    };
                    if (newCurStock === 0) patch._placedInInventory = true;

                    reqStore.update(reqItem.id, patch);
                }
            }

            onSaved();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update inventory.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={S.modal}>
                <div style={S.mHeader}>
                    <h2 style={S.mTitle}>Edit Product</h2>
                    <button style={S.closeBtn} onClick={onClose} disabled={loading}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {/* Product image + name header */}
                    <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.9rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 58, height: 58, borderRadius: 8, background: '#111', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {product.image
                                ? <img src={IMG_BASE + product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: 3 }}>{product.name}</div>
                            <div style={{ color: '#888', fontSize: '0.8rem' }}>{product.brand?.name ?? '—'} &bull; {product.category?.name ?? '—'}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem', background: notEnoughStock ? 'rgba(231,76,60,0.08)' : 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 8, border: notEnoughStock ? '1px solid rgba(231,76,60,0.3)' : '1px solid transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: notEnoughStock ? '0.4rem' : 0 }}>
                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Available stock in Product Management:</span>
                            <span style={{ color: notEnoughStock ? '#e74c3c' : '#C9A84C', fontWeight: 800 }}>
                                {newStockNum === product.stock ? availableStock : projectedAvailable}
                            </span>
                        </div>
                        {notEnoughStock && (
                            <div style={{ color: '#e74c3c', fontSize: '0.78rem', fontWeight: 600 }}>Not enough stock in Product Management</div>
                        )}
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 500, border: '1px solid rgba(231,76,60,0.3)' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={S.label}>Current Stock in Inventory</label>
                            <input type="text" value={product.stock} readOnly style={{ ...S.input, background: '#222', color: '#888', cursor: 'not-allowed' }} />
                        </div>
                        <div>
                            <label style={S.label}>New Stock Quantity</label>
                            <input type="number" min="0" value={newStock}
                                onChange={e => setNewStock(e.target.value)}
                                style={S.input} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={S.label}>New Unit Price</label>
                        <input type="number" min="0" value={price}
                            onChange={e => setPrice(e.target.value)}
                            style={S.input} />
                    </div>

                    <div style={S.mFooter}>
                        <button className="admin-btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
                        <button className="admin-btn-gold" onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onDeleted }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await axios.delete(`/api/admin/products/${product.id}`, authHead());
            reqStore.add({
                id: 'RES-' + Date.now(),
                _isRestoreRecord: true,
                status: 'completed',
                // Keep minimal request properties that might be needed
                date: new Date().toISOString(),
                _productSnapshot: {
                    name: product.name,
                    brand: product.brand,
                    brand_id: product.brand_id,
                    category: product.category,
                    category_id: product.category_id,
                    supplier: product.supplier,
                    supplier_id: product.supplier_id,
                    price: product.price,
                    stock: product.stock,
                    image: product.image
                }
            });
            onDeleted();
        } catch (err) {
            console.error("Failed to delete and restore", err);
            setLoading(false);
        }
    };
    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...S.modal, maxWidth: 420 }}>
                <div style={S.mHeader}>
                    <h2 style={{ ...S.mTitle, color: '#e74c3c' }}>Remove from Inventory</h2>
                    <button style={S.closeBtn} onClick={onClose} disabled={loading}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', marginBottom: '1rem', lineHeight: 1.5 }}>
                        Are you sure you want to remove <strong style={{ color: '#fff' }}>{product.name}</strong> from inventory?
                    </p>
                    <p style={{ color: '#f59e0b', fontSize: '0.88rem', marginBottom: '1.5rem', background: 'rgba(245,158,11,0.1)', padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                        The stock ({product.stock} units) will be returned to Product Management.
                    </p>
                    <div style={S.mFooter}>
                        <button className="admin-btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
                        <button className="admin-btn-red" onClick={handleDelete} disabled={loading}>
                            {loading ? 'Removing...' : 'Yes, Remove & Restore'}
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

                <table className="admin-table">
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
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                No items in inventory. Add products from Product Management.
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
                                    <td style={{ color: '#C9A84C', fontWeight: 700 }}>
                                        {formatCurrency(p.price)}
                                    </td>
                                    <td style={{ fontWeight: 600, color: p.stock === 0 ? '#e74c3c' : 'inherit' }}>{p.stock}</td>
                                    <td>
                                        <span className="admin-badge" style={{ background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button title="Edit Item" className="admin-icon-btn admin-icon-btn--success"
                                                onClick={() => setModal({ type: 'edit', product: p })}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                                    <polyline points="17 8 12 3 7 8"/>
                                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                                </svg>
                                            </button>
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

            {modal?.type === 'edit' && <EditModal product={modal.product} onClose={closeModal} onSaved={saved} />}
            {modal?.type === 'delete' && <DeleteModal product={modal.product} onClose={closeModal} onDeleted={saved} />}
        </AdminLayout>
    );
}
