import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatCurrency, useCurrency } from '../utils/currency';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { reqStore, notificationStore, inventoryStore, productMgmtStore, supplierStockStore } from '../sharedStore';

// ─── Auth helpers — use jk_token (same key stored by AuthContext/login) ───────
const getToken  = () => localStorage.getItem('jk_token');
const authHead  = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
const IMG_BASE  = '/storage/';

function stockStatus(stock) {
    if (stock === 0)  return { bg: 'rgba(231,76,60,0.12)',  color: '#e74c3c', label: 'No Stock' };
    if (stock <= 5)   return { bg: 'rgba(201,168,76,0.15)', color: '#C9A84C', label: 'Low Stock' };
    return                   { bg: 'rgba(39,174,96,0.12)',  color: '#27ae60', label: 'Active' };
}

const parseBrands = (b) => {
    if (!b) return [];
    if (Array.isArray(b)) return b;
    try { const p = JSON.parse(b); if (Array.isArray(p)) return p; } catch (e) {}
    return typeof b === 'string' ? b.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : [];
};

// ─── Shared inline styles ─────────────────────────────────────────────────────
const S = {
    overlay:  { position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                animation: 'admin-fade-in 0.25s ease-out' },
    modal:    { background: '#1a1a1a', borderRadius: 12, width: '100%', maxWidth: 660,
                maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(201,168,76,0.2)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                animation: 'admin-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)' },
    mHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    mTitle:   { color: '#fff', fontWeight: 700, fontSize: '1.15rem', margin: 0 },
    closeBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#777', fontSize: '1.2rem',
                cursor: 'pointer', lineHeight: 1, padding: '0.25rem', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    backBtn:  { background: 'rgba(255,255,255,0.07)', border: 'none',
                color: '#C9A84C', fontSize: '1.3rem', fontWeight: 700, cursor: 'pointer',
                borderRadius: 6, padding: '0 0.6rem', lineHeight: 1.4 },
    mBody:    { padding: '1.5rem 1.75rem' },
    mFooter:  { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' },
    field:    { display: 'flex', flexDirection: 'column', marginBottom: '1.1rem' },
    grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
    label:    { fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600,
                letterSpacing: '0.03em' },
    input:    { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '0.7rem 0.85rem', color: '#fff',
                fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
    saveBtn:  { padding: '0.6rem 1.6rem', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg,#C9A84C,#a8873d)',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' },
    cancelBtn:{ padding: '0.6rem 1.4rem', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' },
    errBox:   { background: 'rgba(231,76,60,0.12)', color: '#e74c3c',
                border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.87rem' },
    thumb:    { width: 44, height: 44, borderRadius: 8, objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.1)' },
    noImg:    { width: 44, height: 44, borderRadius: 8, background: '#222',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)' },
    mTd:      { padding: '0.55rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#aaa' },
    miniThumb:{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.1)' },
    miniNoImg:{ width: 36, height: 36, borderRadius: 6, background: '#222',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)' },
    coCard: { background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
              padding: '0.9rem 1.1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '1rem' },
    companyCard: { display: 'flex', alignItems: 'center', gap: '1rem',
                   padding: '0.9rem 1.1rem', background: '#111', borderRadius: 10,
                   border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' },
    companyAvatar: { width: 44, height: 44, borderRadius: '50%',
                     background: 'linear-gradient(135deg,#C9A84C,#8a5e20)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 },
    brandChip: { background: 'rgba(201,168,76,0.18)', color: '#C9A84C',
                 border: '1px solid rgba(201,168,76,0.35)',
                 borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 },
    supplierBanner: { display: 'flex', alignItems: 'flex-start', gap: '0.9rem',
                      padding: '0.9rem 1rem',
                      background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)',
                      borderRadius: 10, marginBottom: '1rem' },
    miniTableWrap:  { background: '#111', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: '1rem' },
    miniTableTitle: { padding: '0.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: '#aaa', fontSize: '0.82rem', fontWeight: 600 },
    miniTable: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
    mTh:       { padding: '0.55rem 0.8rem', color: '#666', fontWeight: 600, textAlign: 'left',
                 fontSize: '0.75rem', letterSpacing: '0.05em',
                 borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d' },
    imgUploadWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.1rem' },
    imgBox:    { width: 120, height: 120, borderRadius: 10, border: '2px dashed rgba(201,168,76,0.4)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 cursor: 'pointer', overflow: 'hidden', backgroundSize: 'cover', backgroundPosition: 'center' },
    imgPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    removeImg: { marginTop: 4, background: 'none', border: 'none', color: '#e74c3c',
                 cursor: 'pointer', fontSize: '0.78rem' },
};

// ─── Place Order Modal ────────────────────────────────────────────────────────
function PlaceOrderModal({ supplier, products, onClose }) {
    const [order, setOrder] = useState({
        product_id:    '',
        quantity:      1,
        delivery_date: '',
        notes:         '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [error,     setError]     = useState('');

    const selProduct = products.find(p => String(p.id) === String(order.product_id));

    // min delivery date = tomorrow
    const minDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    })();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!order.product_id) return setError('Please select a product.');
        if (!order.delivery_date) return setError('Please choose a delivery date.');
        
        // Add to shared simulate store for Supplier Product Requests
        const newReq = {
            id: Date.now(),
            ref: `REQ-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            model: selProduct.name,
            brand: selProduct.brand?.name || '',
            category: selProduct.category?.name || '',
            qty: Number(order.quantity),
            price: Number(selProduct.price),
            payment: 'Bank Transfer', 
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'pending',
            image: selProduct.image ? IMG_BASE + selProduct.image : null,
            supplier: supplier.name
        };
        reqStore.add(newReq);
        notificationStore.add(supplier.name, "Admin has requested " + selProduct.name + " — " + newReq.ref + ". Please review and respond.");
        
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
                <div style={{ ...S.modal, maxWidth: 420, textAlign: 'center', padding: '2.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h2 style={{ color: '#fff', fontWeight: 800, margin: '0 0 0.5rem' }}>Order Placed!</h2>
                    <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Your order for <strong style={{ color: '#C9A84C' }}>{selProduct?.name}</strong> has been sent
                        to <strong style={{ color: '#fff' }}>{supplier.name}</strong>.
                    </p>
                    <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
                                  borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <div style={{ color: '#888' }}>Product:</div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{selProduct?.name}</div>
                            <div style={{ color: '#888' }}>Quantity:</div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{order.quantity} units</div>
                            <div style={{ color: '#888' }}>Delivery Date:</div>
                            <div style={{ color: '#C9A84C', fontWeight: 700 }}>
                                {new Date(order.delivery_date).toLocaleDateString('en-PH', { dateStyle: 'long' })}
                            </div>
                            <div style={{ color: '#888' }}>Supplier:</div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{supplier.name}</div>
                        </div>
                        {order.notes && (
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem',
                                          borderTop: '1px solid rgba(255,255,255,0.06)', color: '#aaa', fontSize: '0.83rem' }}>
                                <strong style={{ color: '#888' }}>Notes:</strong> {order.notes}
                            </div>
                        )}
                    </div>
                    <button style={S.saveBtn} onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...S.modal, maxWidth: 500 }}>
                <div style={S.mHeader}>
                    <div>
                        <h2 style={S.mTitle}>Place Order</h2>
                        <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                            Order from <span style={{ color: '#C9A84C', fontWeight: 700 }}>{supplier.name}</span>
                        </p>
                    </div>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    {error && <div style={S.errBox}>{error}</div>}

                    {/* Product Select */}
                    <div style={S.field}>
                        <label style={S.label}>Product *</label>
                        <select value={order.product_id}
                                onChange={e => setOrder(o => ({ ...o, product_id: e.target.value }))}
                                style={S.input}>
                            <option value="">— Select Product —</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — {formatCurrency(p.price)} (Stock: {p.stock})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selected product preview */}
                    {selProduct && (
                        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center',
                                      background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
                                      borderRadius: 10, padding: '0.75rem', marginBottom: '1rem' }}>
                            {selProduct.image ? (
                                <img src={IMG_BASE + selProduct.image} alt={selProduct.name}
                                     style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover',
                                              border: '1px solid rgba(255,255,255,0.1)' }}
                                     onError={e => (e.target.style.display = 'none')} />
                            ) : (
                                <div style={{ width: 56, height: 56, borderRadius: 8, background: '#222',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                        <circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>
                                    </svg>
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: 700, color: '#fff' }}>{selProduct.name}</div>
                                <div style={{ fontSize: '0.82rem', color: '#C9A84C', fontWeight: 700 }}>
                                    {formatCurrency(selProduct.price)}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#888' }}>
                                    {selProduct.brand?.name} · {selProduct.category?.name} · Stock: {selProduct.stock}
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={S.grid2}>
                        {/* Quantity */}
                        <div style={S.field}>
                            <label style={S.label}>Quantity *</label>
                            <input type="number" min="1" max={selProduct?.stock || 999}
                                   value={order.quantity}
                                   onChange={e => setOrder(o => ({ ...o, quantity: e.target.value }))}
                                   style={S.input} />
                        </div>
                        {/* Delivery Date */}
                        <div style={S.field}>
                            <label style={S.label}>📅 Delivery Date *</label>
                            <input type="date" min={minDate}
                                   value={order.delivery_date}
                                   onChange={e => setOrder(o => ({ ...o, delivery_date: e.target.value }))}
                                   style={{ ...S.input, colorScheme: 'dark' }} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={S.field}>
                        <label style={S.label}>Notes / Remarks</label>
                        <textarea rows={2} placeholder="Special delivery instructions..."
                                  value={order.notes}
                                  onChange={e => setOrder(o => ({ ...o, notes: e.target.value }))}
                                  style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>

                    {/* Total preview */}
                    {selProduct && order.quantity > 0 && (
                        <div style={{ background: '#111', borderRadius: 10, padding: '0.9rem 1rem',
                                      marginBottom: '1rem', display: 'flex', justifyContent: 'space-between',
                                      alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ color: '#888', fontSize: '0.88rem' }}>Estimated Total</span>
                            <span style={{ color: '#C9A84C', fontWeight: 800, fontSize: '1.1rem' }}>
                                {formatCurrency(Number(selProduct.price) * Number(order.quantity))}
                            </span>
                        </div>
                    )}

                    <div style={S.mFooter}>
                        <button type="button" style={S.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={S.saveBtn}>🚚 Place Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Add Product Modal — Supplier-First Flow ───────────────────────────────────
function AddProductModal({ onClose, onSaved }) {
    const fileRef = useRef(null);
    const [step, setStep]         = useState(1); // 1=company, 2=order form, 3=payment
    const [companies, setCompanies]     = useState([]);
    const [allBrands, setAllBrands]     = useState([]);
    const [suppProducts, setSuppProducts] = useState([]);
    const [selCompany, setSelCompany]   = useState(null);
    const [selProduct, setSelProduct]   = useState(null);
    const [lightbox, setLightbox]       = useState(null);
    const [loadingCo, setLoadingCo]     = useState(true);
    const [error, setError]             = useState('');

    // Order form state (no payment_method here — moved to step 3)
    const [form, setForm] = useState({
        product_id: '', quantity: 1, delivery_date: '',
    });

    useEffect(() => {
        setLoadingCo(true);
        Promise.all([
            axios.get('/api/admin/companies',  authHead()).catch(() => ({ data: [] })),
            axios.get('/api/admin/brands',     authHead()).catch(() => ({ data: [] })),
        ]).then(([c, b]) => {
            setCompanies(Array.isArray(c?.data) ? c.data : []);
            setAllBrands(Array.isArray(b?.data) ? b.data : []);
        }).catch((err) => {
            console.error("Failed to load AddProductModal dependencies", err);
            setCompanies([]);
            setAllBrands([]);
        }).finally(() => setLoadingCo(false));
    }, []);

    const handleSelectCompany = async (company) => {
        setSelCompany(company);
        
        // Auto-create missing brands for this company if they don't exist
        let currentBrands = [...allBrands];
        const names = parseBrands(company.brands);
        const lowerNames = names.map(n => n.trim().toLowerCase()).filter(Boolean);
        
        const missing = names.filter(n => {
            const ln = n.trim().toLowerCase();
            if (!ln) return false;
            return !currentBrands.some(br => br.name.toLowerCase() === ln);
        });

        for (const m of missing) {
            if (!m.trim()) continue;
            try {
                const res = await axios.post('/api/admin/brands', { name: m.trim() }, authHead());
                currentBrands.push(res.data);
            } catch (e) {
                console.error("Failed to auto-create missing brand:", m, e);
            }
        }
        
        if (missing.length > 0) {
            setAllBrands(currentBrands);
        }

        // auto-match brand (if there's exactly 1, or just picking the first match)
        const matched = currentBrands.find(b => lowerNames.includes(b.name.toLowerCase()));
        if (matched) setForm(f => ({ ...f, brand_id: matched.id }));
        
        axios.get(`/api/supplier-products?supplier_id=${company.id}`, authHead())
             .then(r => {
                 // Group duplicates (same name, brand, category) and deduct pending stock
                 const map = new Map();
                 r.data.forEach(p => {
                     const n = p.name ? p.name.trim().toLowerCase() : '';
                     const key = `${n}|${p.brand_id}|${p.category_id}`;
                     const dec = supplierStockStore.getDeducted(p.id);
                     const actualStock = Math.max(0, (Number(p.stock) || 0) - dec);
                     if (map.has(key)) {
                         map.get(key).stock += actualStock;
                     } else {
                         map.set(key, { ...p, stock: actualStock });
                     }
                 });
                 setSuppProducts(Array.from(map.values()));
             })
             .catch(() => setSuppProducts([]));
        setStep(2);
    };

    const filteredBrands = selCompany
        ? (() => {
              const names = parseBrands(selCompany.brands).map(n => n.toLowerCase());
              const f = allBrands.filter(b => names.includes(b.name.toLowerCase()));
              return f.length > 0 ? f : allBrands;
          })()
        : allBrands;

    const handleProductSelect = (e) => {
        const id = e.target.value;
        const p = suppProducts.find(x => String(x.id) === String(id));
        setSelProduct(p || null);
        setForm(f => ({ ...f, product_id: id }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
    };

    const handleSubmitOrder = async (paymentMethod) => {
        setError('');
        try {
            const qty      = Number(form.quantity);
            const refCode  = 'REQ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            const dateStr  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // 1. Add to reqStore so Supplier sees the product request
            const reqData = {
                id: Date.now(),
                ref: refCode,
                supplier_id:   selCompany?.id,
                supplier_name: selCompany?.name,
                supplier:      selCompany?.name,
                product_id:    form.product_id,
                model:         selProduct?.name,
                brand:         selProduct?.brand?.name  || '',
                category:      selProduct?.category?.name || '',
                qty,
                price:   Number(selProduct?.price),
                payment: paymentMethod,
                date:    dateStr,
                status:  'pending',
                image:   selProduct?.image ? IMG_BASE + selProduct.image : null,
                // Product snapshot for Product Management (used after delivery)
                _productSnapshot: {
                    name:        selProduct?.name,
                    brand:       selProduct?.brand,
                    brand_id:    selProduct?.brand_id,
                    category:    selProduct?.category,
                    category_id: selProduct?.category_id,
                    supplier:    selCompany,
                    supplier_id: selCompany?.id,
                    price:       Number(selProduct?.price),
                    stock:       qty,
                    image:       selProduct?.image,
                },
            };
            reqStore.add(reqData);

            // 2. Notify Supplier (use company name, never 'supplier')
            notificationStore.add(
                selCompany?.name || 'supplier',
                `New order request placed for ${selProduct?.name} (Qty: ${qty}) by the Admin. Ref: ${refCode}`
            );

            // NOTE: Stock is NOT deducted here.
            // Stock is only deducted when the supplier marks the delivery as "Delivered".

            onSaved();
        } catch (err) {
            setError(err.message || 'Failed to place order.');
        }
    };

    // ── PAYMENT MODAL (step 3) ────────────────────────────────────────────────
    if (step === 3) {
        return (
            <PaymentModal
                selProduct={selProduct}
                quantity={Number(form.quantity)}
                selCompany={selCompany}
                onBack={() => setStep(2)}
                onClose={onClose}
                onConfirm={handleSubmitOrder}
                error={error}
            />
        );
    }

    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={S.modal}>
                {/* Header */}
                <div style={{ ...S.mHeader, position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {step === 2 && (
                            <button style={S.backBtn} onClick={() => { setStep(1); setSelCompany(null); setSuppProducts([]); }}>‹</button>
                        )}
                        <h2 style={S.mTitle}>{step === 1 ? 'Select Supplier / Company' : 'Add New Product'}</h2>
                    </div>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* ── STEP 1: Choose Company ── */}
                {step === 1 && (
                    <div style={S.mBody}>
                        <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Choose the supplier company this product belongs to.
                        </p>
                        {loadingCo ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading suppliers…</div>
                        ) : companies.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                                No active suppliers found. Please confirm a supplier first.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Array.isArray(companies) && companies.map(c => (
                                    <div key={c.id} style={S.companyCard} onClick={() => handleSelectCompany(c)}>
                                        <div style={S.companyAvatar}>{c.name ? c.name.charAt(0).toUpperCase() : '?'}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{c.name || 'Unnamed Supplier'}</div>
                                            {c.address && <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 2 }}>📍 {c.address}</div>}
                                            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {parseBrands(c.brands).map(br => (
                                                    <span key={br} style={S.brandChip}>{br}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ color: '#C9A84C', fontSize: '1.3rem' }}>›</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 2: Product Details ── */}
                {step === 2 && selCompany && (
                    <div style={S.mBody}>
                        {/* Supplier Banner */}
                        <div style={S.supplierBanner}>
                            <div style={S.companyAvatar}>{selCompany.name ? selCompany.name.charAt(0).toUpperCase() : '?'}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#fff' }}>{selCompany.name || 'Unnamed Supplier'}</div>
                                {selCompany.address && <div style={{ color: '#888', fontSize: '0.78rem' }}>📍 {selCompany.address}</div>}
                                <div style={{ marginTop: 4, display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    {parseBrands(selCompany.brands).map(br => <span key={br} style={S.brandChip}>{br}</span>)}
                                </div>
                            </div>
                        </div>

                        {/* Mini products table from this supplier */}
                        {suppProducts.length > 0 && (
                            <div style={S.miniTableWrap}>
                                <div style={S.miniTableTitle}>📦 Products from {selCompany.name}</div>
                                <table style={S.miniTable}>
                                    <thead>
                                        <tr>
                                            {['Image','Product Name','Brand','Category','Unit Price','Stock'].map(h => (
                                                <th key={h} style={S.mTh}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suppProducts.map(p => (
                                            <tr key={p.id}>
                                                <td style={S.mTd}>
                                                    {p.image ? (
                                                        <img src={IMG_BASE + p.image} alt={p.name}
                                                             style={S.miniThumb}
                                                             onError={e => (e.target.style.display = 'none')} />
                                                    ) : (
                                                        <div style={S.miniNoImg}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                                                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                                                <circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ ...S.mTd, fontWeight: 600, color: '#fff' }}>{p.name}</td>
                                                <td style={{ ...S.mTd, color: '#C9A84C' }}>{p.brand?.name ?? '—'}</td>
                                                <td style={{ ...S.mTd, color: '#aaa' }}>{p.category?.name ?? '—'}</td>
                                                <td style={{ ...S.mTd, color: '#C9A84C', fontWeight: 700 }}>
                                                    {formatCurrency(p.price)}
                                                </td>
                                                <td style={S.mTd}>{p.stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Order Details form — step 2 */}
                        {error && <div style={S.errBox}>{error}</div>}
                        <form onSubmit={e => {
                            e.preventDefault();
                            setError('');
                            if (!form.product_id) return setError('Please select a product.');
                            if (!form.quantity || Number(form.quantity) < 1) return setError('Please enter a valid quantity.');
                            setStep(3);
                        }}>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                                <p style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '1rem',
                                            fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    Order Details
                                </p>

                                <div style={S.field}>
                                    <label style={S.label}>Select Product to Order *</label>
                                    <select onChange={handleProductSelect} value={form.product_id} style={S.input}>
                                        <option value="">— Select a Product —</option>
                                        {suppProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>)}
                                    </select>
                                </div>

                                {selProduct && (
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#111', padding: '1rem', borderRadius: 8, marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {selProduct.image ? (
                                            <img src={IMG_BASE + selProduct.image} alt={selProduct.name}
                                                 style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
                                                 onClick={() => setLightbox(IMG_BASE + selProduct.image)} />
                                        ) : (
                                            <div style={{ width: 64, height: 64, borderRadius: 8, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#666' }}>No Image</span>
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#fff' }}>{selProduct.name}</div>
                                            <div style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(selProduct.price)}</div>
                                            <div style={{ color: '#888', fontSize: '0.8rem' }}>Stock available: {selProduct.stock}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Quantity only — no Payment Method here */}
                                <div style={S.field}>
                                    <label style={S.label}>Quantity *</label>
                                    <input type="number" min="1" value={form.quantity}
                                           onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                                           style={S.input} />
                                </div>

                                {selProduct && form.quantity > 0 && (
                                    <div style={{ background: 'rgba(201,168,76,0.1)', padding: '1rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(201,168,76,0.3)' }}>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>Total Order Amount</span>
                                        <span style={{ color: '#C9A84C', fontWeight: 800, fontSize: '1.25rem' }}>
                                            {formatCurrency(Number(selProduct.price) * Number(form.quantity))}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={S.mFooter}>
                                <button type="button" style={S.cancelBtn} onClick={onClose}>Cancel</button>
                                <button type="submit" style={S.saveBtn}>💳 Payment</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Lightbox for full image preview */}
            {lightbox && (
                <div style={{ ...S.overlay, zIndex: 999 }} onClick={(e) => { if(e.target === e.currentTarget) setLightbox(null); }}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>✕</button>
                        <img src={lightbox} alt="Preview" style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Payment Modal (Step 3 of Add Product) ────────────────────────────────────
function PaymentModal({ selProduct, quantity, selCompany, onBack, onClose, onConfirm, error }) {
    const [paymentMethod, setPaymentMethod] = useState('');
    const [gcashNumber, setGcashNumber] = useState('');
    const [mayaNumber, setMayaNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [loading, setLoading] = useState(false);
    
    const total = Number(selProduct?.price) * Number(quantity);

    // Validation logic for the Place Order button
    const isValid = () => {
        if (!paymentMethod) return false;
        if (paymentMethod === 'GCash' && !gcashNumber.trim()) return false;
        if (paymentMethod === 'Maya' && !mayaNumber.trim()) return false;
        if (paymentMethod === 'Bank Transfer' && (!bankName.trim() || !bankAccount.trim())) return false;
        return true;
    };

    const handlePlaceOrder = async () => {
        if (!isValid()) return;
        setLoading(true);
        // Include payment details in the confirm callback
        const paymentDetails = {
            method: paymentMethod,
            gcashNumber: paymentMethod === 'GCash' ? gcashNumber : null,
            mayaNumber: paymentMethod === 'Maya' ? mayaNumber : null,
            bankName: paymentMethod === 'Bank Transfer' ? bankName : null,
            bankAccount: paymentMethod === 'Bank Transfer' ? bankAccount : null,
        };
        // Passing method as string is what the current onConfirm expects
        // But we can append the details later if needed. For now, we just pass the method string
        // but if the backend is adapted, we would pass paymentDetails.
        // For now, the existing code only expects a string `paymentMethod` up to `handleSubmitOrder`.
        await onConfirm(paymentMethod);
        setLoading(false);
    };

    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...S.modal, maxWidth: 480 }}>
                <div style={{ ...S.mHeader, position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button style={S.backBtn} onClick={onBack}>‹</button>
                        <h2 style={S.mTitle}>Order Summary &amp; Payment</h2>
                    </div>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={S.mBody}>
                    {/* Order Summary */}
                    <div style={{ background: '#111', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem' }}>Order Summary</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888', fontSize: '0.875rem' }}>Product</span>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{selProduct?.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888', fontSize: '0.875rem' }}>Brand</span>
                                <span style={{ color: '#aaa', fontWeight: 600, fontSize: '0.875rem' }}>{selProduct?.brand?.name || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888', fontSize: '0.875rem' }}>Category</span>
                                <span style={{ color: '#aaa', fontWeight: 600, fontSize: '0.875rem' }}>{selProduct?.category?.name || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888', fontSize: '0.875rem' }}>Company</span>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{selCompany?.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                <span style={{ color: '#888', fontSize: '0.875rem' }}>Unit Price</span>
                                <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.875rem' }}>{formatCurrency(selProduct?.price)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888', fontSize: '0.875rem' }}>Quantity</span>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{quantity}</span>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Total Amount</span>
                                <span style={{ color: '#C9A84C', fontWeight: 900, fontSize: '1.35rem' }}>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div style={S.field}>
                        <label style={S.label}>Payment Method *</label>
                        <select value={paymentMethod} onChange={e => {
                            setPaymentMethod(e.target.value);
                            setGcashNumber(''); setMayaNumber(''); setBankName(''); setBankAccount('');
                        }} style={S.input}>
                            <option value="">— Select Payment Method —</option>
                            <option value="Cash">Cash</option>
                            <option value="GCash">GCash</option>
                            <option value="Maya">Maya</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>

                    {/* Dynamic Fields based on Payment Method */}
                    {paymentMethod === 'Cash' && (
                        <div style={{ padding: '0.9rem 1rem', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 8, color: '#e5e5e5', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.1rem', marginRight: '6px' }}>💵</span> Please prepare the exact amount of <strong style={{ color: '#27ae60' }}>{formatCurrency(total)}</strong> in cash.
                        </div>
                    )}

                    {paymentMethod === 'GCash' && (
                        <div style={S.field}>
                            <label style={S.label}>GCash Number *</label>
                            <input type="text" value={gcashNumber} onChange={e => setGcashNumber(e.target.value)}
                                   placeholder="Enter GCash number (e.g. 09XXXXXXXXX)"
                                   style={S.input} />
                        </div>
                    )}

                    {paymentMethod === 'Maya' && (
                        <div style={S.field}>
                            <label style={S.label}>Maya Number *</label>
                            <input type="text" value={mayaNumber} onChange={e => setMayaNumber(e.target.value)}
                                   placeholder="Enter Maya number (e.g. 09XXXXXXXXX)"
                                   style={S.input} />
                        </div>
                    )}

                    {paymentMethod === 'Bank Transfer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={S.label}>Bank Name *</label>
                                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                                       placeholder="Enter bank name (e.g. BDO, BPI, Metrobank)"
                                       style={S.input} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={S.label}>Account Number *</label>
                                <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)}
                                       placeholder="Enter account number"
                                       style={S.input} />
                            </div>
                        </div>
                    )}

                    {error && <div style={{ ...S.errBox, marginTop: '0.75rem' }}>{error}</div>}

                    <div style={{ ...S.mFooter, marginTop: '1.5rem' }}>
                        <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
                        <button
                            style={{ ...S.saveBtn, opacity: isValid() ? 1 : 0.45, cursor: isValid() ? 'pointer' : 'not-allowed' }}
                            onClick={handlePlaceOrder}
                            disabled={!isValid() || loading}
                        >
                            {loading ? 'Placing Order…' : '🚚 Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Stock Modal ─────────────────────────────────────────────────────────
function EditStockModal({ product, onClose, onSaved }) {
    const [stock,   setStock]   = useState(product.stock);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`/api/admin/products/${product.id}`, { stock }, authHead());
            onSaved();
        } catch { setError('Failed to update stock.'); setLoading(false); }
    };
    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...S.modal, maxWidth: 380 }}>
                <div style={S.mHeader}>
                    <h2 style={S.mTitle}>Edit Stock</h2>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: '#aaa', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Updating stock for <strong style={{ color: '#fff' }}>{product.name}</strong>
                    </p>
                    {error && <div style={S.errBox}>{error}</div>}
                    <label style={S.label}>New Stock Quantity</label>
                    <input type="number" min="0" value={stock}
                           onChange={e => setStock(e.target.value)}
                           style={{ ...S.input, marginBottom: '1.5rem' }} />
                    <div style={S.mFooter}>
                        <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
                        <button style={S.saveBtn} onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving…' : 'Update Stock'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Modal (Product Management — admin side only, no supplier impact) ──
function DeleteModal({ product, onClose, onDeleted }) {
    const handleDelete = () => {
        // Mark the underlying reqStore entries as deleted
        if (product.reqIds) {
            product.reqIds.forEach(id => reqStore.update(id, { _deletedFromMgmt: true }));
        }
        onDeleted();
    };
    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...S.modal, maxWidth: 400 }}>
                <div style={S.mHeader}>
                    <h2 style={{ ...S.mTitle, color: '#e74c3c' }}>Delete Product</h2>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Are you sure you want to delete{' '}
                        <strong style={{ color: '#fff' }}>{product.name}</strong>?
                    </p>
                    <div style={S.mFooter}>
                        <button className="admin-btn-outline" onClick={onClose}>Cancel</button>
                        <button className="admin-btn-red" onClick={handleDelete}>
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Place In Inventory Modal ────────────────────────────────────────────────
function PlaceInInventoryModal({ product, onClose, onSaved }) {
    const [qty, setQty] = useState(product.stock);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        const moveQty = Number(qty);
        if (moveQty <= 0 || moveQty > product.stock) {
            return setError('Invalid quantity. Cannot exceed available stock.');
        }
        setLoading(true);
        try {
            // Deduct sequentially from origin requests
            let remaining = moveQty;
            const allReqs = reqStore.getAll();
            
            for (const reqId of product.reqIds) {
                if (remaining <= 0) break;
                const reqItem = allReqs.find(r => r.id === reqId);
                if (!reqItem || !reqItem._productSnapshot || reqItem._placedInInventory || reqItem._deletedFromMgmt) continue;
                
                const curStock = reqItem._productSnapshot.stock || 0;
                if (curStock <= 0) continue;
                
                const deduct = Math.min(curStock, remaining);
                remaining -= deduct;
                
                const newStock = curStock - deduct;
                const patch = {
                    _productSnapshot: { ...reqItem._productSnapshot, stock: newStock }
                };
                if (newStock === 0) patch._placedInInventory = true;
                
                reqStore.update(reqId, patch);
            }
            
            // Post to backend API
            const payload = {
                name: product.name,
                brand_id: product.brand?.id || product.reqBrandId,
                category_id: product.category?.id || product.reqCategoryId,
                supplier_id: product.supplier?.id || product.reqSupplierId,
                price: product.price,
                stock: moveQty,
                existing_image: product.image
            };
            // Fallbacks in case ID wasn't preserved perfectly
            if (!payload.brand_id) payload.brand_id = 1; 
            if (!payload.category_id) payload.category_id = 1;
            
            // Check if product strongly matches an existing inventory item
            const res = await axios.get('/api/admin/products', authHead());
            const inventoryProducts = res.data || [];
            
            const existing = inventoryProducts.find(p => 
                p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
                String(p.brand_id) === String(payload.brand_id) &&
                String(p.category_id) === String(payload.category_id)
            );

            if (existing) {
                // ADD quantity to existing product row instead of duplicating
                const newDbStock = Number(existing.stock || 0) + Number(payload.stock);
                await axios.put(`/api/admin/products/${existing.id}`, {
                    stock: newDbStock,
                    price: payload.price
                }, authHead());
            } else {
                // CREATE new product row
                await axios.post('/api/admin/products', payload, authHead());
            }

            onSaved();
        } catch (err) {
            setError(err.message || 'Failed to place in inventory');
            setLoading(false);
        }
    };

    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...S.modal, maxWidth: 420 }}>
                <div style={S.mHeader}>
                    <h2 style={{ ...S.mTitle, color: '#27ae60' }}>Place in Inventory</h2>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', marginBottom: '1rem', lineHeight: 1.6 }}>
                        Move <strong style={{ color: '#fff' }}>{product.name}</strong> to live inventory.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 8 }}>
                        <span style={{ color: '#aaa' }}>Available in Mgmt:</span>
                        <span style={{ color: '#C9A84C', fontWeight: 800 }}>{product.stock} units</span>
                    </div>
                    {error && <div style={S.errBox}>{error}</div>}
                    <div style={S.field}>
                        <label style={S.label}>Quantity to place in Inventory *</label>
                        <input type="number" min="1" max={product.stock} value={qty}
                               onChange={e => setQty(e.target.value)}
                               style={S.input} />
                    </div>
                    <div style={S.mFooter}>
                        <button className="admin-btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
                        <button className="admin-btn-gold" style={{ background: '#27ae60' }} onClick={handleConfirm} disabled={loading}>
                            {loading ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}



// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProducts() {
    useCurrency();
    const [products, setProducts] = useState([]);
    const [search,   setSearch]   = useState('');
    const [modal,    setModal]    = useState(null);


    // Group reqStore entries that reached 'completed' status, aggregating duplicate stock
    const load = () => {
        try {
            const all = reqStore.getAll() || [];
            const delivered = all.filter(r => 
                r?.status === 'completed' && 
                r?._productSnapshot &&
                !r?._placedInInventory &&
                !r?._deletedFromMgmt
            );
            
            const grouped = {};
            delivered.forEach(r => {
                const s = r._productSnapshot;
                // Group by identifying details
                const key = `${s.name}|${s.brand?.name || ''}|${s.category?.name || ''}|${s.supplier?.name || ''}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        id: 'PM-' + r.id,
                        reqIds: [], // Track all origin REQs
                        name: s.name,
                        brand: s.brand,
                        category: s.category,
                        supplier: s.supplier,
                        price: s.price,
                        stock: 0,
                        image: s.image,
                        reqBrandId: s.brand_id,
                        reqCategoryId: s.category_id,
                        reqSupplierId: s.supplier_id
                    };
                }
                grouped[key].stock += (s.stock || 0);
                grouped[key].reqIds.push(r.id);
            });
            // Keep all products including those with 0 stock (show as No Stock, not deleted)
            setProducts(Object.values(grouped));
        } catch (error) {
            console.error('Failed to load products from store:', error);
            setProducts([]); 
        }
    };

    useEffect(() => {
        load();
        const sync = () => load();
        window.addEventListener('jk_req_update', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('jk_req_update', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const filteredProducts = products.filter(p => {
        const q = search.toLowerCase();
        return (p.name ?? '').toLowerCase().includes(q) ||
               (p.brand?.name ?? '').toLowerCase().includes(q) ||
               (p.supplier?.name ?? '').toLowerCase().includes(q) ||
               (p.category?.name ?? '').toLowerCase().includes(q);
    });

    const closeModal = () => setModal(null);
    const saved      = () => { closeModal(); load(); };


    return (
        <AdminLayout>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Product Management</h1>
                <button className="admin-btn-gold" onClick={() => setModal('add')}>+ Add Product</button>
            </div>

            <div className="admin-card">
                <div className="admin-card__header">
                    <div className="admin-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input type="text" placeholder="Search products..."
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
                        {filteredProducts.length === 0 && (
                            <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                No products found.
                            </td></tr>
                        )}
                        {filteredProducts.map((p, i) => {
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
                                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                                    <circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>
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
                                            {/* Place in Inventory — upload icon */}
                                            <button
                                                title="Place in Inventory"
                                                className="admin-icon-btn admin-icon-btn--success"
                                                onClick={() => setModal({ type: 'placeInInventory', product: p })}
                                                disabled={p.stock === 0}
                                                style={{ opacity: p.stock === 0 ? 0.35 : 1, cursor: p.stock === 0 ? 'not-allowed' : 'pointer' }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                                    <polyline points="17 8 12 3 7 8"/>
                                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                                </svg>
                                            </button>
                                            {/* Delete — trash icon */}
                                            <button
                                                title="Delete"
                                                className="admin-icon-btn admin-icon-btn--delete"
                                                onClick={() => setModal({ type: 'delete', product: p })}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6"/>
                                                    <path d="M19 6l-1 14H6L5 6"/>
                                                    <path d="M10 11v6"/><path d="M14 11v6"/>
                                                    <path d="M9 6V4h6v2"/>
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

            {modal === 'add'          && <AddProductModal  onClose={closeModal} onSaved={saved} />}
            {modal?.type === 'placeInInventory' && <PlaceInInventoryModal product={modal.product} onClose={closeModal} onSaved={saved} />}
            {modal?.type === 'delete' && <DeleteModal      product={modal.product} onClose={closeModal} onDeleted={saved} />}
        </AdminLayout>
    );
}

