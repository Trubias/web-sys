import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const fmt = (price) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(price);

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
            {product.is_new && <div className="product-card__badge">NEW</div>}
            {!product.is_new && product.stock > 0 && (
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
