import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { suppHead, IMG_BASE, INV_MODAL, getSuppToken } from './supplierHelpers';

function EditStockModal({ product, onClose, onSaved }) {
    const [stock, setStock] = useState(product?.stock || 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const diff = Number(stock) - Number(product.stock);
            const newDbStock = Number(product._dbStock || 0) + diff;

            const payload = {
                name: product.name,
                brand_id: product.brand_id,
                category_id: product.category_id,
                price: product.price,
                stock: newDbStock,
            };
            await axios.put('/api/supplier-products/' + product.id, payload, suppHead());
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update stock.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={INV_MODAL.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...INV_MODAL.box, maxWidth: 400 }}>
                <div style={INV_MODAL.hdr}>
                    <h2 style={INV_MODAL.title}>Edit Stock</h2>
                    <button style={INV_MODAL.closeBtn} onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
                    {error && <div style={INV_MODAL.errBox}>{error}</div>}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={INV_MODAL.lbl}>Stock Quantity</label>
                        <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} style={INV_MODAL.inp} required />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" style={INV_MODAL.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={INV_MODAL.saveBtn} disabled={loading}>
                            {loading ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddProductModal({ user, products, onClose, onSaved }) {
    const fileRef = useRef(null);
    const [form, setForm] = useState({
        name: '', price: '', stock: '',
        brand_id: '', category_id: '', image: null,
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);

    const FIXED_CATEGORIES = ['Automatic', 'Chronograph', 'Diver', 'Dress'];

    const parseBrands = (b) => {
        if (!b) return [];
        if (Array.isArray(b)) return b;
        try {
            const p = JSON.parse(b);
            if (Array.isArray(p)) return p;
        } catch (e) { }
        return typeof b === 'string' ? b.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
    };

    useEffect(() => {
        Promise.all([
            axios.get('/api/admin/brands', suppHead()),
            axios.get('/api/admin/categories', suppHead()),
        ]).then(async ([b, c]) => {
            let allBrands = b.data;
            const names = parseBrands(user?.brands);
            const lowerNames = names.map(n => n.trim().toLowerCase()).filter(Boolean);

            const missing = names.filter(n => {
                const ln = n.trim().toLowerCase();
                if (!ln) return false;
                return !allBrands.some(br => br.name.toLowerCase() === ln);
            });
            for (const m of missing) {
                if (!m.trim()) continue;
                try {
                    const res = await axios.post('/api/admin/brands', { name: m.trim() }, suppHead());
                    allBrands = [...allBrands, res.data];
                } catch (e) {
                    console.error('Failed to auto-create brand:', m, e);
                }
            }

            const supplierBrands = lowerNames.length > 0
                ? allBrands.filter(br => lowerNames.includes(br.name.toLowerCase()))
                : [];

            setBrands(supplierBrands);
            setForm(f => ({
                ...f,
                brand_id: supplierBrands.length === 1 ? supplierBrands[0].id : '',
            }));

            let allCats = c.data;
            const resolvedCats = [];
            for (const catName of FIXED_CATEGORIES) {
                let cat = allCats.find(ct => ct.name.toLowerCase() === catName.toLowerCase());
                if (!cat) {
                    try {
                        const res = await axios.post('/api/admin/categories', { name: catName }, suppHead());
                        cat = res.data;
                        allCats = [...allCats, cat];
                    } catch (e) {
                        console.error('Failed to auto-create category:', catName, e);
                        continue;
                    }
                }
                resolvedCats.push(cat);
            }
            setCategories(resolvedCats);
        }).catch(err => console.error('Error loading specs', err));
    }, [user]);

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;

        if (!ALLOWED_TYPES.includes(f.type)) {
            setError('Only JPG, PNG, and WEBP images are allowed.');
            e.target.value = '';
            return;
        }

        if (f.size > MAX_SIZE_BYTES) {
            setError('Image file size must not exceed 2MB.');
            e.target.value = '';
            return;
        }

        setError('');
        setForm(p => ({ ...p, image: f }));
        setPreview(URL.createObjectURL(f));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.brand_id || !form.category_id || !form.price || form.stock === '') {
            return setError('Product Name, Brand, Category, Price and Stock are required.');
        }

        setLoading(true);
        try {
            const existing = (products || []).find(p =>
                p.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
                String(p.brand_id) === String(form.brand_id) &&
                String(p.category_id) === String(form.category_id)
            );

            if (existing) {
                const newDbStock = Number(existing._dbStock || 0) + Number(form.stock);

                if (form.image) {
                    const fd2 = new FormData();
                    fd2.append('name', existing.name);
                    fd2.append('price', form.price);
                    fd2.append('stock', newDbStock);
                    fd2.append('brand_id', existing.brand_id);
                    fd2.append('category_id', existing.category_id);
                    fd2.append('image', form.image);
                    fd2.append('_method', 'PUT');

                    await axios.post('/api/supplier-products/' + existing.id, fd2, {
                        headers: { Authorization: "Bearer " + getSuppToken(), 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    const payload = {
                        name: existing.name,
                        brand_id: existing.brand_id,
                        category_id: existing.category_id,
                        price: form.price,
                        stock: newDbStock,
                        existing_image: existing.image
                    };
                    await axios.put('/api/supplier-products/' + existing.id, payload, suppHead());
                }
                onSaved();
                return;
            }

            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('price', form.price);
            fd.append('stock', form.stock);
            fd.append('brand_id', form.brand_id);
            fd.append('category_id', form.category_id);
            fd.append('supplier_id', user.id);
            if (form.image) fd.append('image', form.image);

            await axios.post('/api/supplier-products', fd, {
                headers: {
                    Authorization: "Bearer " + getSuppToken(),
                    'Content-Type': 'multipart/form-data',
                },
            });
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create product.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={INV_MODAL.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={INV_MODAL.box}>
                <div style={INV_MODAL.hdr}>
                    <h2 style={INV_MODAL.title}>Add New Product</h2>
                    <button style={INV_MODAL.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
                    {error && <div style={INV_MODAL.errBox}>{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div
                            style={{
                                width: 130, height: 130, borderRadius: 12,
                                border: '2px dashed #dca54c',
                                backgroundImage: preview ? "url('" + preview + "')" : 'none',
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', overflow: 'hidden',
                            }}
                            onClick={() => fileRef.current.click()}
                        >
                            {!preview && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                    <span style={{ color: '#aaa', fontSize: '0.75rem' }}>Upload image</span>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />
                        {preview && (
                            <button type="button" style={{ marginTop: 6, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}
                                onClick={() => { setPreview(null); setForm(f => ({ ...f, image: null })); }}>
                                Remove Image
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={INV_MODAL.lbl}>Product Name *</label>
                            <input name="name" value={form.name} onChange={handleChange} style={INV_MODAL.inp} placeholder="e.g. Rolex Submariner" />
                        </div>
                        <div>
                            <label style={INV_MODAL.lbl}>Brand *</label>
                            <select name="brand_id" value={form.brand_id} onChange={handleChange} style={INV_MODAL.inp}>
                                <option value="">— Select Brand —</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={INV_MODAL.lbl}>Category *</label>
                            <select name="category_id" value={form.category_id} onChange={handleChange} style={INV_MODAL.inp}>
                                <option value="">— Select Category —</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={INV_MODAL.lbl}>Unit Price (₱) *</label>
                            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} style={INV_MODAL.inp} placeholder="0.00" />
                        </div>
                        <div>
                            <label style={INV_MODAL.lbl}>Stock Quantity *</label>
                            <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} style={INV_MODAL.inp} placeholder="0" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" style={INV_MODAL.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={INV_MODAL.saveBtn} disabled={loading}>
                            {loading ? 'Saving…' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function InventorySuppliedPage({ user }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [adding, setAdding] = useState(false);

    const load = () => {
        setLoading(true);
        axios.get('/api/supplier-products', suppHead())
            .then(r => {
                const mine = r.data.filter(p => p.supplier_id === user.id || !p.supplier_id);
                const adjusted = mine.map(p => {
                    return { ...p, stock: p.stock || 0, _dbStock: p.stock || 0 };
                });
                setProducts(adjusted);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        const syncStock = () => load();
        window.addEventListener('jk_supplier_stock_update', syncStock);
        return () => window.removeEventListener('jk_supplier_stock_update', syncStock);
    }, []);

    const totalUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
    const totalValue = products.reduce((s, p) => s + Number(p.price || 0) * (p.stock || 0), 0);
    const activeCount = products.filter(p => p.stock > 0).length;

    const fmtCurrency = (n) => {
        if (n >= 1000000) return '₱' + (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return '₱' + (n / 1000).toFixed(0) + 'K';
        return '₱' + n.toLocaleString();
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                        My Supplied Inventory
                    </h1>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        All products you have supplied to J&K Watch
                    </p>
                </div>
                <button onClick={() => setAdding(true)} style={{
                    background: '#111827', color: '#fff', border: 'none',
                    padding: '0.6rem 1.2rem', borderRadius: 8, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Product
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Products', value: products.length, icon: '📦', color: '#dca54c' },
                    { label: 'Total Units Supplied', value: totalUnits, icon: '📊', color: '#10b981' },
                    { label: 'Total Supply Value', value: fmtCurrency(totalValue), icon: '💰', color: '#C9A84C', up: true },
                    { label: 'Active Products', value: activeCount, icon: '✅', color: '#6b7280' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: 12, padding: '1.1rem 1.2rem',
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.4rem' }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', fontWeight: 700, color: '#111827' }}>
                    Supplied Products Breakdown
                </div>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading inventory…</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                {['Image', 'Product', 'Brand', 'Category', 'Unit Price', 'Stock', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '0.75rem 1rem', textAlign: 'left',
                                        color: '#6b7280', fontWeight: 600, fontSize: '0.75rem',
                                        letterSpacing: '0.05em'
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                        No products found for your account.
                                    </td>
                                </tr>
                            )}
                            {products.map((p, i) => {
                                const isActive = p.stock > 5;
                                const isLow = p.stock > 0 && p.stock <= 5;
                                const stLabel = isActive ? 'Active' : isLow ? 'Low Stock' : 'Out of Stock';
                                const stColor = isActive ? '#10b981' : isLow ? '#f59e0b' : '#ef4444';
                                const stBg = isActive ? '#d1fae5' : isLow ? '#fef3c7' : '#fee2e2';
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '0.7rem 1rem' }}>
                                            {p.image ? (
                                                <img src={IMG_BASE + p.image} alt={p.name}
                                                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }}
                                                    onError={e => (e.target.style.display = 'none')} />
                                            ) : (
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 8, background: '#f3f4f6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <circle cx="9" cy="9" r="2" />
                                                        <path d="M21 15l-5-5L5 21" />
                                                    </svg>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.7rem 1rem' }}>
                                            <div style={{ fontWeight: 700, color: '#111827' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{p.slug}</div>
                                        </td>
                                        <td style={{ padding: '0.7rem 1rem', color: '#374151', fontWeight: 500 }}>{p.brand?.name ?? '—'}</td>
                                        <td style={{ padding: '0.7rem 1rem', color: '#6b7280' }}>{p.category?.name ?? '—'}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: '#111827' }}>
                                            ₱{Number(p.price).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{p.stock}</td>
                                        <td style={{ padding: '0.7rem 1rem' }}>
                                            <span style={{
                                                background: stBg, color: stColor, borderRadius: 20,
                                                padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700
                                            }}>
                                                {stLabel}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.7rem 1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => setEditing(p)}
                                                    style={{
                                                        background: '#fef3c7', border: '1px solid #fbbf24',
                                                        color: '#92400e', borderRadius: 8,
                                                        padding: '0.35rem 0.75rem', cursor: 'pointer',
                                                        fontSize: '0.78rem', fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    }}>
                                                    Edit Stock
                                                </button>
                                                <button onClick={async () => {
                                                    if (!window.confirm("Are you sure you want to delete this product?")) return;
                                                    try {
                                                        await axios.delete('/api/supplier-products/' + p.id, suppHead());
                                                        load();
                                                    } catch (err) {
                                                        alert("Failed to delete product.");
                                                    }
                                                }}
                                                    style={{
                                                        background: '#fee2e2', border: '1px solid #f87171',
                                                        color: '#b91c1c', borderRadius: 8,
                                                        padding: '0.35rem 0.75rem', cursor: 'pointer',
                                                        fontSize: '0.78rem', fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {adding && (
                <AddProductModal user={user} products={products} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />
            )}
            {editing && (
                <EditStockModal
                    product={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); load(); }}
                />
            )}
        </div>
    );
}
