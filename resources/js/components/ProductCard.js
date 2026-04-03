import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const fmt = (price) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(price);

const COLOR_CSS = { black:'#111', white:'#e5e5e5', silver:'#C0C0C0', gold:'#FFD700', 'rose gold':'#B76E79', blue:'#3B82F6', navy:'#1E3A5F', green:'#22C55E', red:'#EF4444', orange:'#F97316', yellow:'#EAB308', purple:'#A855F7', pink:'#EC4899', brown:'#92400E', gray:'#6B7280', grey:'#6B7280', titanium:'#878681', champagne:'#F7E7CE' };
const getColorCSS = (name) => COLOR_CSS[name?.toLowerCase()?.trim()] || '#888';

function parseColors(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
}

const isAutoNew = (p) => {
    if (!p?.created_at) return false;
    return (Date.now() - new Date(p.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
};

export default function ProductCard({ product, onClick }) {
    const { user, wishlistIds, toggleWishlist, addToCart } = useAuth();
    const navigate = useNavigate();
    const isWishlisted = wishlistIds.includes(product.id);

    const handleWishlist = async (e) => {
        e.stopPropagation();
        if (!user) { navigate('/login'); return; }
        try { await toggleWishlist(product.id); } catch { }
    };

    const handleCart = async (e) => {
        e.stopPropagation();
        if (!user) { navigate('/login'); return; }
        try { await addToCart(product.id); } catch { }
    };

    return (
        <div className="product-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            {isAutoNew(product) && <div className="product-card__badge">NEW</div>}
            {!isAutoNew(product) && product.stock > 0 && (
                <div className="product-card__badge" style={{ background: '#27ae60' }}>IN STOCK</div>
            )}

            <button
                className={`product-card__wishlist${isWishlisted ? ' active' : ''}`}
                onClick={handleWishlist}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <svg viewBox="0 0 24 24" fill={isWishlisted ? '#e74c3c' : 'none'} stroke={isWishlisted ? '#e74c3c' : '#777'} strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
            </button>

            <div className="product-card__image">
                {product.image
                    ? <img src={`/storage/${product.image}`} alt={product.name} />
                    : <div className="product-card__image-placeholder">⌚</div>
                }
            </div>

            <div className="product-card__body">
                <div className="product-card__brand">{product.brand?.name}</div>
                <div className="product-card__name">{product.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0 2px' }}>
                    {product.category?.name && <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 6px' }}>{product.category.name}</span>}
                    {product.gender && product.gender !== 'All' && <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 6px' }}>{product.gender}</span>}
                    {product.variant && product.variant !== 'All' && <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 6px' }}>{product.variant}</span>}
                </div>
                {parseColors(product.color_variants).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '5px 0 2px' }}>
                        {parseColors(product.color_variants).slice(0, 8).map((c, i) => (
                            <span
                                key={i}
                                title={c}
                                style={{
                                    width: 12, height: 12, borderRadius: '50%',
                                    background: getColorCSS(c),
                                    border: '1.5px solid rgba(0,0,0,0.18)',
                                    display: 'inline-block', flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                )}
                <div className="product-card__footer">
                    <div className="product-card__price">₱{fmt(product.price)}</div>
                    <button className="product-card__cart-btn" onClick={handleCart} title="Add to Cart">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
