import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';
import ProductModal from '../utils/ProductModal';

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

export default function UserBrowse() {
    const { user, wishlistIds, toggleWishlist, addToCart } = useAuth();
    const navigate = useNavigate();
    const [toastMsg, setToastMsg] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/products')
            .then(res => setAllProducts(res.data))
            .catch(err => console.error('Error fetching inventory:', err))
            .finally(() => setLoading(false));
    }, []);

    // Filter States
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    // Smart URL ?search= handler:
    // If it matches a brand name → activate brand pill, clear text, clean URL.
    // Otherwise → fall through to normal name-based text filtering.
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const searchParam = queryParams.get('search');

        // Nothing in the URL — reset text search, leave brand as-is
        if (searchParam === null) {
            setSearchQuery('');
            return;
        }

        // Wait until products have loaded before checking brands
        if (allProducts.length === 0) {
            setSearchQuery(searchParam); // temporary fallback while loading
            return;
        }

        // Check if the term exactly matches a brand name (case-insensitive)
        const uniqueBrands = [...new Set(allProducts.map(p => p.brand?.name).filter(Boolean))];
        const matchedBrand = uniqueBrands.find(
            b => b.toLowerCase() === searchParam.trim().toLowerCase()
        );

        if (matchedBrand) {
            // Brand match: activate the pill, clear the text box, clean the URL
            setBrandFilter(matchedBrand);
            setSearchQuery('');
            navigate('/user/browse', { replace: true });
        } else {
            // No brand match: normal product name filter
            setBrandFilter('All Brands');
            setSearchQuery(searchParam);
        }
    }, [allProducts, location.search]);

    const [brandFilter, setBrandFilter] = useState('All Brands');
    const [priceSort, setPriceSort] = useState('All Prices');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [genderFilter, setGenderFilter] = useState('All Genders');
    const [variantFilter, setVariantFilter] = useState('All Age Groups');
    const [colorSearch, setColorSearch] = useState('');
    const [colorFilter, setColorFilter] = useState('');
    const [colorSearchOpen, setColorSearchOpen] = useState(false);
    const colorRef = useRef(null);

    useEffect(() => {
        const onOut = (e) => { if (colorRef.current && !colorRef.current.contains(e.target)) setColorSearchOpen(false); };
        document.addEventListener('mousedown', onOut);
        return () => document.removeEventListener('mousedown', onOut);
    }, []);

    // Dynamic Filter Options based strictly on the live Admin Inventory
    const availableBrands = useMemo(() => {
        const brands = allProducts.map(p => p.brand?.name).filter(Boolean);
        return ['All Brands', ...new Set(brands)].sort();
    }, [allProducts]);

    const availableCategories = useMemo(() => {
        const cats = allProducts.map(p => p.category?.name).filter(Boolean);
        return ['All Categories', ...new Set(cats)].sort();
    }, [allProducts]);

    const availableColors = useMemo(() => {
        const set = new Set();
        allProducts.forEach(p => {
            const cv = parseColors(p.color_variants);
            cv.forEach(c => { if (c) String(c).split(',').map(s => s.trim()).filter(Boolean).forEach(s => set.add(s)); });
        });
        return [...set].sort();
    }, [allProducts]);

    const colorSuggestions = useMemo(() => {
        if (!colorSearch.trim()) return availableColors;
        return availableColors.filter(c => c.toLowerCase().includes(colorSearch.toLowerCase()));
    }, [availableColors, colorSearch]);

    // Featured Sidebar (Real live products instead of mock data)
    const featuredWatches = useMemo(() => {
        return allProducts.slice(0, 4);
    }, [allProducts]);

    const getImageUrl = (img) => img ? (img.startsWith('http') ? img : `/storage/${img}`) : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&auto=format&fit=crop';

    // Derived Display Logic combining ALL filters seamlessly
    const displayedProducts = useMemo(() => {
        let filtered = allProducts.filter(p => {
            const safeName = p.name || '';
            const safeBrand = p.brand?.name || '';
            const safeCategory = p.category?.name || '';
            const q = searchQuery.toLowerCase();
            const matchSearch = safeName.toLowerCase().includes(q) ||
                                safeBrand.toLowerCase().includes(q) ||
                                safeCategory.toLowerCase().includes(q);
            const matchBrand = brandFilter === 'All Brands' || p.brand?.name === brandFilter;
            const matchCategory = categoryFilter === 'All Categories' || p.category?.name === categoryFilter;
            const matchGender = genderFilter === 'All Genders' || !p.gender || p.gender === 'All' || p.gender === genderFilter;
            const matchVariant = variantFilter === 'All Age Groups' || !p.variant || p.variant === 'All' || p.variant === variantFilter;
            const pColors = parseColors(p.color_variants);
            const flatColors = [];
            pColors.forEach(c => String(c).split(',').map(s => s.trim()).filter(Boolean).forEach(s => flatColors.push(s)));
            const matchColor = !colorFilter || flatColors.some(c => c.toLowerCase() === colorFilter.toLowerCase());
            return matchSearch && matchBrand && matchCategory && matchGender && matchVariant && matchColor;
        });

        if (priceSort === 'Low to High') {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (priceSort === 'High to Low') {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        }

        return filtered;
    }, [allProducts, searchQuery, brandFilter, categoryFilter, priceSort, genderFilter, variantFilter, colorFilter]);

    const handleWishlistToggle = async (item) => {
        const isAdded = !wishlistIds.some(id => Number(id) === Number(item.id));
        await toggleWishlist(item.id);
        setToastMsg(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist');
        setTimeout(() => setToastMsg(''), 3000);
    };

    if (loading) {
        return (
            <UserLayout>
                <div style={{ padding: '8rem', textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>
                    Loading exclusive catalogue...
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            {/* Wishlist Toast Notification */}
            {toastMsg && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#333', color: '#fff', padding: '1rem 2rem', borderRadius: '4px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600, animation: 'fadeIn 0.3s' }}>
                    {toastMsg}
                </div>
            )}

            <div className="user-content-area mobile-p-2" style={{ padding: '4rem 5rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

                {/* Header Logic */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '3rem', color: '#111', marginBottom: '0.4rem', fontWeight: 800 }}>
                        <span style={{ color: '#C9A84C' }}>Browse</span> <span style={{ color: '#000' }}>Our Collection</span>
                    </h1>
                    <div style={{ color: '#666', fontSize: '1rem', fontWeight: 500 }}>
                        Discover Exclusive Luxury Timepieces – <span style={{ color: '#C9A84C', fontWeight: 700 }}>{displayedProducts.length} items found</span>
                    </div>
                </div>

                {/* Brand Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {availableBrands.map(b => (
                        <button
                            key={b}
                            onClick={() => setBrandFilter(b)}
                            style={{
                                padding: '0.5rem 1.2rem',
                                background: brandFilter === b ? '#C9A84C' : '#fff',
                                color: brandFilter === b ? '#000' : '#555',
                                border: brandFilter === b ? '1px solid #C9A84C' : '1px solid #ddd',
                                borderRadius: '30px',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: brandFilter === b ? '0 4px 12px rgba(201,168,76,0.3)' : 'none'
                            }}
                            onMouseEnter={e => { if (brandFilter !== b) { e.target.style.background = '#f9f6ee'; e.target.style.borderColor = '#C9A84C'; } }}
                            onMouseLeave={e => { if (brandFilter !== b) { e.target.style.background = '#fff'; e.target.style.borderColor = '#ddd'; } }}
                        >
                            {b}
                        </button>
                    ))}
                </div>

                {/* Unified Control Bar */}
                <div className="user-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: '#fcfcfc', padding: '1rem', border: '1px dashed #C9A84C', borderRadius: '8px', marginBottom: '2.5rem' }}>

                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', border: '1px solid #ddd', borderRadius: '4px', outline: 'none', fontSize: '0.95rem' }}
                        />
                        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>

                    <select value={priceSort} onChange={e => setPriceSort(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '130px' }}>
                        <option value="All Prices">Prices</option>
                        <option value="Low to High">Low to High</option>
                        <option value="High to Low">High to Low</option>
                    </select>

                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '130px' }}>
                        <option value="All Categories">Categories</option>
                        {availableCategories.filter(c => c !== 'All Categories').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '120px' }}>
                        <option value="All Genders">Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>

                    <select value={variantFilter} onChange={e => setVariantFilter(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '130px' }}>
                        <option value="All Age Groups">Age Group</option>
                        <option value="Adult">Adult</option>
                        <option value="Kids">Kids</option>
                    </select>

                    <div ref={colorRef} style={{ position: 'relative' }}>
                        <div
                            onClick={() => setColorSearchOpen(o => !o)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.8rem 1rem', border: colorFilter ? '1px solid #C9A84C' : '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer', color: colorFilter ? '#C9A84C' : '#555', fontWeight: colorFilter ? 700 : 500, minWidth: '130px', fontSize: '0.93rem', userSelect: 'none' }}
                        >
                            {colorFilter ? (
                                <>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: getColorCSS(colorFilter), border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0, display: 'inline-block' }} />
                                    <span style={{ flex: 1 }}>{colorFilter}</span>
                                    <span style={{ color: '#aaa', fontSize: '0.8rem', lineHeight: 1 }} onClick={e => { e.stopPropagation(); setColorFilter(''); setColorSearch(''); }}>✕</span>
                                </>
                            ) : 'Color Variant ▾'}
                        </div>
                        {colorSearchOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200, background: '#fff', border: '1px solid #ddd', borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '210px', padding: '0.5rem' }}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={colorSearch}
                                    onChange={e => setColorSearch(e.target.value)}
                                    placeholder="Search color..."
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '4px', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box', marginBottom: '0.4rem' }}
                                />
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    {!colorSearch.trim()
                                        ? <div style={{ color: '#bbb', fontSize: '0.82rem', padding: '0.4rem 0.5rem', fontStyle: 'italic' }}>Type a color name to search...</div>
                                        : colorSuggestions.length === 0
                                            ? <div style={{ color: '#aaa', fontSize: '0.83rem', padding: '0.4rem 0.5rem' }}>No colors found</div>
                                            : colorSuggestions.map(c => (
                                            <div key={c}
                                                onClick={() => { setColorFilter(c); setColorSearch(''); setColorSearchOpen(false); }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', cursor: 'pointer', borderRadius: '4px', background: colorFilter === c ? '#fef9ed' : 'transparent' }}
                                                onMouseEnter={e => { if (colorFilter !== c) e.currentTarget.style.background = '#f3f4f6'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = colorFilter === c ? '#fef9ed' : 'transparent'; }}
                                            >
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: getColorCSS(c), border: '1px solid rgba(0,0,0,0.18)', flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.88rem', color: '#333' }}>{c}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Main Layout Grid */}
                <div className="mobile-stack" style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>

                    {/* Left Column: Interactive Product Grid */}
                    <div style={{ flex: 1 }}>
                        {displayedProducts.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', background: '#fcfcfc', border: '1px dashed #ddd', borderRadius: '8px', color: '#666' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#111' }}>No products found</h3>
                                <p>Try adjusting your search criteria or modifying the active filters.</p>
                            </div>
                        ) : (
                            <div className="user-browse-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                {displayedProducts.map(item => {
                                    const isNew = isAutoNew(item);
                                    const colors = parseColors(item.color_variants);
                                    const isWishlisted = wishlistIds.some(id => Number(id) === Number(item.id));

                                    return (
                                        <div key={item.id} style={{
                                            background: '#fff',
                                            borderRadius: '8px',
                                            border: '1px solid #eaeaea',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                            onClick={() => setSelectedProduct(item)}>

                                            {/* Image Area */}
                                            <div style={{ background: '#fff', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                                {/* NEW badge */}
                                                {isNew && (
                                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#22c55e', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', letterSpacing: '0.5px', zIndex: 5 }}>NEW</div>
                                                )}
                                                {/* Wishlist Heart */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleWishlistToggle(item); }}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: '1px solid #eee', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : '#666'} strokeWidth="2">
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                </button>
                                                <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem', background: '#fff' }} />
                                            </div>

                                            {/* Body */}
                                            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                {/* Brand in gold */}
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                                    {item.brand?.name}
                                                </div>
                                                {/* Product Name */}
                                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                                                    {item.name}
                                                </div>
                                                {/* Tags row */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.5rem' }}>
                                                    {item.category?.name && <span style={{ fontSize: '0.68rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 6px' }}>{item.category.name}</span>}
                                                    {item.gender && item.gender !== 'All' && <span style={{ fontSize: '0.68rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 6px' }}>{item.gender}</span>}
                                                    {item.variant && item.variant !== 'All' && <span style={{ fontSize: '0.68rem', background: '#f3f4f6', color: '#555', borderRadius: 4, padding: '1px 6px' }}>{item.variant}</span>}
                                                </div>
                                                {/* Color dots */}
                                                {colors.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.5rem' }}>
                                                        {colors.slice(0, 8).map((c, i) => (
                                                            <span key={i} title={c} style={{ width: 12, height: 12, borderRadius: '50%', background: getColorCSS(c), border: '1.5px solid rgba(0,0,0,0.18)', display: 'inline-block', flexShrink: 0 }} />
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Footer: Price + Cart */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>₱{Number(item.price).toLocaleString()}</div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (item.stock > 0) addToCart(item.id); }}
                                                        disabled={item.stock === 0}
                                                        style={{
                                                            width: '34px', height: '34px',
                                                            background: item.stock > 0 ? '#111' : '#e5e7eb',
                                                            color: item.stock > 0 ? '#C9A84C' : '#9ca3af',
                                                            border: 'none', borderRadius: '50%',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: item.stock > 0 ? 'pointer' : 'not-allowed',
                                                            transition: 'background 0.2s',
                                                            flexShrink: 0
                                                        }}
                                                        onMouseEnter={e => { if (item.stock > 0) e.currentTarget.style.background = '#C9A84C'; if (item.stock > 0) e.currentTarget.style.color = '#000'; }}
                                                        onMouseLeave={e => { if (item.stock > 0) e.currentTarget.style.background = '#111'; if (item.stock > 0) e.currentTarget.style.color = '#C9A84C'; }}
                                                        title="Add to Cart"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination Bottom Spacer */}
                        {displayedProducts.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', padding: '2rem 0', borderTop: '1px dashed #eaeaea' }}>
                                <button style={{ padding: '0.5rem 0.8rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>{'<'}</button>
                                <button style={{ padding: '0.5rem 1rem', background: '#C9A84C', border: '1px solid #C9A84C', color: '#000', fontWeight: 700, borderRadius: '4px', cursor: 'pointer' }}>1</button>
                                <button style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>2</button>
                                <button style={{ padding: '0.5rem 0.8rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>{'>'}</button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Featured Sidebar fed by Live Items */}
                    <div className="mobile-w-full" style={{ width: '280px', background: '#fcfcfc', border: '1px solid #eaeaea', borderRadius: '8px', padding: '1.5rem', flexShrink: 0 }}>
                        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.2rem', color: '#111', marginBottom: '1.5rem', fontWeight: 700, borderBottom: '2px solid #C9A84C', paddingBottom: '0.5rem', display: 'inline-block' }}>Featured This Month</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {featuredWatches.length === 0 ? <p style={{ color: '#888', fontSize: '0.9rem' }}>No featured items</p> : null}
                            {featuredWatches.map(watch => (
                                <div key={watch.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedProduct(watch)}>
                                    <div style={{ background: '#111', borderRadius: '4px', width: '56px', height: '56px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <img src={getImageUrl(watch.image)} alt={watch.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C9A84C', marginBottom: '0.1rem' }}>{watch.brand?.name}</div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333', marginBottom: '0.2rem', lineHeight: 1.2 }}>{watch.name}</div>
                                        <div style={{ fontSize: '0.88rem', color: '#111', fontWeight: 800 }}>₱{Number(watch.price).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            <ProductModal
                selectedProduct={selectedProduct}
                closeModal={() => setSelectedProduct(null)}
                setToastMsg={setToastMsg}
            />

        </UserLayout>
    );
}
