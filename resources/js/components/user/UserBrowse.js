import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';
import ProductModal from '../utils/ProductModal';

export default function UserBrowse() {
    const { user, wishlistIds, toggleWishlist, addToCart } = useAuth();
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

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const searchParam = queryParams.get('search');
        if (searchParam !== null) {
            setSearchQuery(searchParam);
        }
    }, [location.search]);
    const [brandFilter, setBrandFilter] = useState('All Brands');
    const [priceSort, setPriceSort] = useState('All Prices');
    const [conditionFilter, setConditionFilter] = useState('All Conditions');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');

    // Dynamic Filter Options based strictly on the live Admin Inventory
    const availableBrands = useMemo(() => {
        const brands = allProducts.map(p => p.brand?.name).filter(Boolean);
        return ['All Brands', ...new Set(brands)].sort();
    }, [allProducts]);

    const availableCategories = useMemo(() => {
        const cats = allProducts.map(p => p.category?.name).filter(Boolean);
        return ['All Categories', ...new Set(cats)].sort();
    }, [allProducts]);

    const availableConditions = ['All Conditions', 'New', 'Pre-owned', 'Limited'];

    // Utility mapping Admin booleans to Customer Condition strings visually
    const getCondition = (p) => {
        if (p.is_new) return 'New';
        if (p.is_featured || p.status === 'Low Stock' || (p.stock > 0 && p.stock <= 5)) return 'Limited';
        return 'Pre-owned';
    };

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
            const itemCond = getCondition(p);
            const matchCondition = conditionFilter === 'All Conditions' || itemCond === conditionFilter;
            const matchCategory = categoryFilter === 'All Categories' || p.category?.name === categoryFilter;

            return matchSearch && matchBrand && matchCondition && matchCategory;
        });

        if (priceSort === 'Low to High') {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (priceSort === 'High to Low') {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        }

        return filtered;
    }, [allProducts, searchQuery, brandFilter, conditionFilter, categoryFilter, priceSort]);

    const handleWishlistToggle = async (item) => {
        const isAdded = !wishlistIds.some(id => Number(id) === Number(item.id));
        await toggleWishlist(item.id);
        setToastMsg(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist');
        setTimeout(() => setToastMsg(''), 3000);
    };

    const getConditionBadgeStyle = (cond) => {
        if (cond === 'New') return { bg: '#dcfce7', color: '#166534' };
        if (cond === 'Limited') return { bg: '#fef08a', color: '#854d0e' };
        return { bg: '#f3f4f6', color: '#4b5563' }; // Pre-owned or other
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

                {/* Unified Control Bar */}
                <div className="user-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: '#fcfcfc', padding: '1rem', border: '1px dashed #C9A84C', borderRadius: '8px', marginBottom: '2.5rem' }}>

                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', border: '1px solid #ddd', borderRadius: '4px', outline: 'none', fontSize: '0.95rem' }}
                        />
                        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>

                    <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '150px' }}>
                        {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select value={priceSort} onChange={e => setPriceSort(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '150px' }}>
                        <option>All Prices</option>
                        <option>Low to High</option>
                        <option>High to Low</option>
                    </select>

                    <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '150px' }}>
                        {availableConditions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500, minWidth: '150px' }}>
                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

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
                                    const conditionString = getCondition(item);
                                    let badgeStyle = getConditionBadgeStyle(conditionString);
                                    // Override visual style strictly if Out of Stock logically
                                    if (item.stock === 0 || item.status === 'Out of Stock') {
                                        badgeStyle = { bg: '#fee2e2', color: '#b91c1c' };
                                    }

                                    return (
                                        <div key={item.id} style={{
                                            background: '#fff',
                                            borderRadius: '8px',
                                            padding: '1.2rem',
                                            border: '1px solid #eaeaea',
                                            transition: 'transform 0.2s',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            opacity: item.stock === 0 ? 0.75 : 1,
                                            cursor: 'pointer'
                                        }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                            onClick={() => setSelectedProduct(item)}>

                                            <div style={{ margin: '-1.2rem -1.2rem 1.5rem -1.2rem', background: '#f8f9fa', borderBottom: '1px solid #eee', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                                                {/* Dynamic Wishlist Heart Hooked contextually */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleWishlistToggle(item); }}
                                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', border: '1px solid #eee', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 10 }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlistIds.some(id => Number(id) === Number(item.id)) ? '#ef4444' : 'none'} stroke={wishlistIds.some(id => Number(id) === Number(item.id)) ? '#ef4444' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                </button>

                                                <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '1rem', marginBottom: '0.6rem', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{item.name}</h3>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111' }}>${Number(item.price).toLocaleString()}</div>
                                                    <span style={{
                                                        background: badgeStyle.bg,
                                                        color: badgeStyle.color,
                                                        fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.05)', letterSpacing: '0.5px'
                                                    }}>
                                                        {item.stock === 0 ? 'OUT OF STOCK' : conditionString}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (item.stock > 0) addToCart(item.id); }}
                                                disabled={item.stock === 0}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.6rem',
                                                    background: item.stock > 0 ? '#C9A84C' : '#e5e7eb',
                                                    color: item.stock > 0 ? '#000' : '#9ca3af',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontWeight: 700,
                                                    cursor: item.stock > 0 ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.85rem',
                                                    transition: 'background 0.2s',
                                                }}
                                                onMouseEnter={e => { if (item.stock > 0) e.target.style.background = '#d4b761'; }}
                                                onMouseLeave={e => { if (item.stock > 0) e.target.style.background = '#C9A84C'; }}
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    )
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
                    <div className="mobile-w-full" style={{ width: '300px', background: '#fcfcfc', border: '1px solid #eaeaea', borderRadius: '8px', padding: '2rem' }}>
                        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.3rem', color: '#111', marginBottom: '1.5rem', fontWeight: 700, borderBottom: '2px solid #C9A84C', paddingBottom: '0.5rem', display: 'inline-block' }}>Featured This Month</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {featuredWatches.length === 0 ? <p style={{ color: '#888', fontSize: '0.9rem' }}>No featured items</p> : null}
                            {featuredWatches.map(watch => (
                                <div key={watch.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '60px', height: '60px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                                        <img src={getImageUrl(watch.image)} alt={watch.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333', marginBottom: '0.2rem', lineHeight: 1.2 }}>{watch.name}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 800 }}>${Number(watch.price).toLocaleString()}</div>
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
