import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
const COLOR_CSS = {
    black: '#111', white: '#e5e5e5', silver: '#C0C0C0', gold: '#FFD700',
    'rose gold': '#B76E79', blue: '#3B82F6', navy: '#1E3A5F', green: '#22C55E',
    red: '#EF4444', orange: '#F97316', yellow: '#EAB308', purple: '#A855F7',
    pink: '#EC4899', brown: '#92400E', gray: '#6B7280', grey: '#6B7280',
    titanium: '#878681', champagne: '#F7E7CE'
};
const getColorCSS = (n) => COLOR_CSS[n?.toLowerCase()?.trim()] || '#888';

function parseColors(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
}

const getImageUrl = (img) =>
    img ? (img.startsWith('http') ? img : `/storage/${img}`)
        : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&auto=format&fit=crop';

// ─── component ────────────────────────────────────────────────────────────────
export default function ProductModal({ selectedProduct, closeModal, setToastMsg }) {
    const [qty, setQty] = useState(1);
    const { addToCart } = useAuth();
    const navigate = useNavigate();

    if (!selectedProduct) return null;

    const p = selectedProduct;
    const colors = parseColors(p.color_variants);
    const stockLabel =
        p.stock === 0
            ? 'Out of Stock'
            : p.stock <= 5
                ? `Low Stock (${p.stock} items left)`
                : `In Stock (${p.stock} items left)`;
    const stockBg   = p.stock === 0 ? '#fee2e2' : p.stock <= 5 ? '#fef08a' : '#dcfce7';
    const stockColor= p.stock === 0 ? '#b91c1c' : p.stock <= 5 ? '#854d0e' : '#166534';

    const handleAddToCart = async () => {
        if (p.stock > 0) {
            await addToCart(p.id, qty);
            setToastMsg?.(`Added ${qty} item(s) to Cart`);
            setTimeout(() => setToastMsg?.(''), 3000);
            closeModal();
        }
    };

    const handleBuyNow = () => {
        if (p.stock > 0) {
            closeModal();
            navigate('/user/checkout', {
                state: { directPurchase: { product: p, quantity: qty } }
            });
        }
    };

    // ─── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div className="jk-modal-overlay" onClick={closeModal}>
            <div className="jk-modal-container" onClick={e => e.stopPropagation()}>

                {/* Mobile drag handle */}
                <div className="jk-modal-drag-handle" onClick={closeModal} />

                {/* Close button */}
                <button className="jk-modal-close" onClick={closeModal} aria-label="Close">×</button>

                {/* ── Two-column content ── */}
                <div className="jk-modal-content">

                    {/* LEFT — image */}
                    <div className="jk-modal-image-col">
                        <img
                            src={getImageUrl(p.image)}
                            alt={p.name}
                            className="jk-modal-image"
                        />
                    </div>

                    {/* RIGHT — details */}
                    <div className="jk-modal-info-col">

                        {/* Brand · Category */}
                        <div style={{
                            fontSize: '0.78rem', color: '#888', textTransform: 'uppercase',
                            letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem'
                        }}>
                            {p.brand?.name}{p.brand?.name && p.category?.name ? ' • ' : ''}{p.category?.name}
                        </div>

                        {/* Product name */}
                        <h2 style={{
                            fontSize: '1.7rem', fontFamily: '"Playfair Display", serif',
                            fontWeight: 800, margin: '0 0 0.75rem', color: '#111', lineHeight: 1.2
                        }}>
                            {p.name}
                        </h2>

                        {/* Price */}
                        <div style={{
                            fontSize: '1.5rem', fontWeight: 800, color: '#C9A84C', marginBottom: '1rem'
                        }}>
                            ₱{Number(p.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>

                        {/* Stock badge */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.3rem 0.7rem',
                                background: stockBg,
                                color: stockColor,
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                            }}>
                                {stockLabel}
                            </span>
                        </div>

                        {/* ── PRODUCT DETAILS CARD ── */}
                        <div style={{
                            background: '#f9f9f9',
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            padding: '1rem 1.1rem',
                            marginBottom: '1.25rem',
                        }}>
                            <div style={{
                                fontSize: '0.68rem', fontWeight: 700, color: '#aaa',
                                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem'
                            }}>
                                PRODUCT DETAILS
                            </div>

                            {/* 2×2 grid: Brand / Category / Gender / Age Group */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.6rem 1rem',
                                marginBottom: colors.length > 0 ? '0.75rem' : 0
                            }}>
                                {[
                                    { label: 'Brand',     value: p.brand?.name },
                                    { label: 'Category',  value: p.category?.name },
                                    { label: 'Gender',    value: p.gender || 'All' },
                                    { label: 'Age Group', value: p.variant || 'All' },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <div style={{ fontSize: '0.68rem', color: '#bbb', fontWeight: 600, marginBottom: '2px' }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: '0.88rem', color: '#222', fontWeight: 700 }}>
                                            {value || '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Color variants */}
                            {colors.length > 0 && (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '0.7rem' }}>
                                    <div style={{ fontSize: '0.68rem', color: '#bbb', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        Color Variant
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {colors.map((c, i) => (
                                            <span key={i} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                background: '#fff', border: '1px solid #e5e7eb',
                                                borderRadius: 20, padding: '3px 10px 3px 6px',
                                                fontSize: '0.8rem', color: '#333', fontWeight: 500
                                            }}>
                                                <span style={{
                                                    width: 10, height: 10, borderRadius: '50%',
                                                    background: getColorCSS(c),
                                                    border: '1.5px solid rgba(0,0,0,0.15)',
                                                    display: 'inline-block', flexShrink: 0
                                                }} />
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── TRUST BADGES ── */}
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem'
                        }}>
                            {[
                                { icon: '🔒', label: '100% Secure Checkout' },
                                { icon: '🚚', label: 'Cash on Delivery Available' },
                                { icon: '🛡️', label: 'Authorized Retailer' },
                            ].map(({ icon, label }) => (
                                <span key={label} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    fontSize: '0.72rem', background: '#f3f4f6',
                                    padding: '4px 9px', borderRadius: '4px',
                                    color: '#374151', fontWeight: 600, whiteSpace: 'nowrap'
                                }}>
                                    {icon} {label}
                                </span>
                            ))}
                        </div>

                        {/* ── ACCEPTED PAYMENTS ── */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '0.72rem', color: '#aaa', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem'
                            }}>
                                Accepted Payments:
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {[
                                    { name: 'GCash',           color: '#0052E0' },
                                    { name: 'Maya',            color: '#00A651' },
                                    { name: 'Bank Transfer',   color: '#374151' },
                                    { name: 'Cash on Delivery',color: '#374151' },
                                ].map(({ name, color }) => (
                                    <span key={name} style={{
                                        fontWeight: 800, color, fontSize: '0.85rem', whiteSpace: 'nowrap'
                                    }}>
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* ── QUANTITY + BUTTONS ── */}
                        {p.stock > 0 ? (
                            <div className="jk-modal-actions">
                                {/* Quantity stepper */}
                                <div className="jk-modal-stepper">
                                    <button
                                        className="jk-stepper-btn"
                                        onClick={() => setQty(q => Math.max(1, q - 1))}
                                    >−</button>
                                    <input
                                        type="text"
                                        value={qty}
                                        readOnly
                                        className="jk-stepper-input"
                                    />
                                    <button
                                        className="jk-stepper-btn"
                                        onClick={() => setQty(q => Math.min(p.stock, q + 1))}
                                    >+</button>
                                </div>

                                {/* CTA buttons */}
                                <div className="jk-modal-btn-group">
                                    <button className="jk-btn-add" onClick={handleAddToCart}>
                                        ADD TO CART
                                    </button>
                                    <button className="jk-btn-buy" onClick={handleBuyNow}>
                                        BUY IT NOW
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                padding: '1rem',
                                background: '#fee2e2',
                                borderRadius: '6px',
                                color: '#b91c1c',
                                fontWeight: 700,
                                textAlign: 'center',
                                fontSize: '0.9rem'
                            }}>
                                This product is currently out of stock.
                            </div>
                        )}

                    </div>{/* end info-col */}
                </div>{/* end content */}
            </div>{/* end container */}
        </div>
    );
}
