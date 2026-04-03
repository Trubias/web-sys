import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';

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

const fmt = (price) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(price);

export default function UserWishlist() {
    const { user, wishlistIds, toggleWishlist, addToCart } = useAuth();
    const [fetchedProducts, setFetchedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/wishlist')
            .then(res => setFetchedProducts(res.data.map(w => w.product).filter(Boolean)))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Derived state immediately syncs visual list with the global AuthContext array
    let wishlistItems = fetchedProducts.filter(p => wishlistIds.includes(p.id));

    const [sortOption, setSortOption] = useState('Newest First');
    const [selectedItems, setSelectedItems] = useState([]);

    // Sort logic
    wishlistItems = [...wishlistItems].sort((a, b) => {
        if (sortOption === 'Price: Low to High') return Number(a.price) - Number(b.price);
        if (sortOption === 'Price: High to Low') return Number(b.price) - Number(a.price);
        if (sortOption === 'Name: A to Z') return (a.name || '').localeCompare(b.name || '');
        if (sortOption === 'Name: Z to A') return (b.name || '').localeCompare(a.name || '');
        if (sortOption === 'Oldest First') return -1;
        return 0; // Default Newest
    });

    const totalEstimatedValue = wishlistItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

    const toggleSelect = (id) => {
        if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id));
        else setSelectedItems([...selectedItems, id]);
    };

    const handleSelectAll = () => {
        if (selectedItems.length === wishlistItems.length) setSelectedItems([]);
        else setSelectedItems(wishlistItems.map(i => i.id));
    };

    const handleBulkAddToCart = async () => {
        if (selectedItems.length === 0) return;
        const itemsToMove = [...selectedItems];
        setSelectedItems([]);
        await Promise.all(itemsToMove.map(async (id) => {
            await addToCart(id);
        }));
    };

    const getImageUrl = (image) => {
        if (!image) return 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&auto=format&fit=crop';
        if (image.startsWith('http')) return image;
        return `/storage/${image}`;
    };

    return (
        <UserLayout>
            <div className="mobile-p-2" style={{ padding: '4rem 5rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

                {/* Header */}
                <div className="mobile-stack" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #C9A84C', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2.5rem', color: '#111', marginBottom: '0.4rem', fontWeight: 800 }}>
                            <span style={{ color: '#000' }}>My</span> <span style={{ color: '#C9A84C' }}>Wishlist</span>
                        </h1>
                        <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                            {wishlistItems.length} items saved — Total estimated value <span style={{ color: '#111', fontWeight: 700 }}>₱{fmt(totalEstimatedValue)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Sort by</span>
                            <select
                                value={sortOption}
                                onChange={e => setSortOption(e.target.value)}
                                style={{ padding: '0.5rem 0.8rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, fontSize: '0.88rem' }}
                            >
                                <option>Newest First</option>
                                <option>Oldest First</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                                <option>Name: A to Z</option>
                                <option>Name: Z to A</option>
                            </select>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={selectedItems.length > 0 && selectedItems.length === wishlistItems.length}
                                onChange={handleSelectAll}
                                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#C9A84C' }}
                            />
                            Select All
                        </label>

                        <button
                            onClick={handleBulkAddToCart}
                            style={{
                                padding: '0.6rem 1.4rem',
                                background: selectedItems.length > 0 ? '#C9A84C' : '#e5e7eb',
                                color: selectedItems.length > 0 ? '#000' : '#9ca3af',
                                border: 'none', borderRadius: '4px', fontWeight: 700,
                                cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s', fontSize: '0.88rem'
                            }}
                        >
                            Move to Cart
                        </button>
                    </div>
                </div>

                {/* Wishlist Grid */}
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>Loading wishlist...</div>
                ) : wishlistItems.length === 0 ? (
                    <div style={{ padding: '6rem 4rem', textAlign: 'center', background: '#fcfcfc', border: '1px dashed #ddd', borderRadius: '8px', color: '#666' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#111', fontFamily: '"Playfair Display", Georgia, serif' }}>Your wishlist is empty</h3>
                        <p>You haven't added any products to your wishlist yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        {wishlistItems.map(item => {
                            const isNew = isAutoNew(item);
                            const colors = parseColors(item.color_variants);
                            const isSelected = selectedItems.includes(item.id);

                            return (
                                <div key={item.id} style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    border: isSelected ? '1.5px solid #C9A84C' : '1px solid #eaeaea',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    opacity: item.stock === 0 ? 0.8 : 1,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Checkbox overlay */}
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(item.id)}
                                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#C9A84C' }}
                                        />
                                    </div>

                                    {/* Remove button */}
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                        <button
                                            onClick={() => toggleWishlist(item.id)}
                                            style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #eee', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                                            title="Remove from Wishlist"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>

                                    {/* Image area */}
                                    <div style={{ background: '#f8f9fa', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid #eee', position: 'relative' }}>
                                        {isNew && (
                                            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#22c55e', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', letterSpacing: '0.5px' }}>NEW</div>
                                        )}
                                        <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }} />
                                    </div>

                                    {/* Body */}
                                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Brand in gold */}
                                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>
                                            {item.brand?.name || 'Luxury Timepiece'}
                                        </div>
                                        {/* Product name */}
                                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: '0.4rem' }}>
                                            {item.name}
                                        </div>
                                        {/* Tags row */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.4rem' }}>
                                            {item.category?.name && <span style={{ fontSize: '0.65rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 5px' }}>{item.category.name}</span>}
                                            {item.gender && item.gender !== 'All' && <span style={{ fontSize: '0.65rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 5px' }}>{item.gender}</span>}
                                            {item.variant && item.variant !== 'All' && <span style={{ fontSize: '0.65rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 5px' }}>{item.variant}</span>}
                                        </div>
                                        {/* Color dots */}
                                        {colors.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '0.4rem' }}>
                                                {colors.slice(0, 6).map((c, i) => (
                                                    <span key={i} title={c} style={{ width: 10, height: 10, borderRadius: '50%', background: getColorCSS(c), border: '1px solid rgba(0,0,0,0.18)', display: 'inline-block' }} />
                                                ))}
                                            </div>
                                        )}
                                        {/* Price row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', marginTop: 'auto' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111' }}>₱{fmt(item.price)}</div>
                                            <span style={{
                                                background: item.stock > 0 ? '#dcfce7' : '#fee2e2',
                                                color: item.stock > 0 ? '#166534' : '#b91c1c',
                                                fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px'
                                            }}>
                                                {item.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                                            </span>
                                        </div>
                                        {/* Add to Cart button */}
                                        <button
                                            onClick={() => { if (item.stock > 0) addToCart(item.id); }}
                                            disabled={item.stock === 0}
                                            style={{
                                                width: '100%', padding: '0.55rem',
                                                background: item.stock > 0 ? '#111' : '#e5e7eb',
                                                color: item.stock > 0 ? '#C9A84C' : '#9ca3af',
                                                border: 'none', borderRadius: '4px', fontWeight: 700,
                                                cursor: item.stock > 0 ? 'pointer' : 'not-allowed',
                                                fontSize: '0.82rem', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { if (item.stock > 0) { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#000'; } }}
                                            onMouseLeave={e => { if (item.stock > 0) { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#C9A84C'; } }}
                                        >
                                            {item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {wishlistItems.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '2rem 0', borderTop: '1px dashed #eaeaea' }}>
                        <button style={{ padding: '0.5rem 0.8rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>{'<'}</button>
                        <button style={{ padding: '0.5rem 1rem', background: '#C9A84C', border: '1px solid #C9A84C', color: '#000', fontWeight: 700, borderRadius: '4px', cursor: 'pointer' }}>1</button>
                        <button style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>2</button>
                        <button style={{ padding: '0.5rem 0.8rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>{'>'}</button>
                    </div>
                )}

            </div>
        </UserLayout>
    );
}
