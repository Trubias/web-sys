import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../Footer';
import ProductCard from '../ProductCard';
import ProductModal from '../ProductModal';

export default function Browse() {
    const navigate = useNavigate();
    const location = useLocation();
    // Graceful fallback if useAuth throws because user is guests, etc.
    const auth = useAuth() || {};
    const wishlistIds = auth.wishlistIds || [];
    const toggleWishlist = auth.toggleWishlist || (() => alert('Please login to use Wishlist!'));
    const addToCart = auth.addToCart || (() => alert('Please login to add to Cart!'));

    const [toastMsg, setToastMsg] = useState('');
    
    // Feature 1: Product Modal State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalQty, setModalQty] = useState(1);
    
    // Close modal gracefully
    const closeModal = () => {
        setSelectedProduct(null);
        setModalQty(1);
    };

    // Derived states
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/products')
            .then(res => setAllProducts(res.data))
            .catch(err => console.error('Error fetching inventory:', err))
            .finally(() => setLoading(false));
    }, []);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
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
            const matchSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase());
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
        if (!auth.user) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
            return;
        }
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
            <div style={{ background: '#f9f9f9', minHeight: '80vh' }}>
                <div style={{ padding: '8rem', textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>
                    Loading exclusive catalogue...
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ background: '#f9f9f9', minHeight: '100vh' }}>
            {/* Wishlist Toast Notification */}
            {toastMsg && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#333', color: '#fff', padding: '1rem 2rem', borderRadius: '4px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600, animation: 'fadeIn 0.3s' }}>
                    {toastMsg}
                </div>
            )}

            {/* Hero Banner Area - Extracted for edge-to-edge full width */}
            <div style={{ 
                background: '#111', 
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8rem 2rem 5rem 2rem', 
                textAlign: 'center', 
                position: 'relative' 
            }}>
                {/* Dark gradient overlay for a premium look */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, rgba(34,34,34,1) 0%, rgba(10,10,10,1) 100%)', zIndex: 0 }}></div>
                <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '4rem', color: '#fff', marginBottom: '1rem', fontWeight: 800 }}>
                        <span style={{ color: '#C9A84C' }}>Browse</span> Collection
                    </h1>
                    <p style={{ color: '#ccc', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
                        Discover Exclusive Luxury Timepieces – <span style={{ color: '#C9A84C', fontWeight: 700 }}>{displayedProducts.length} items found</span>
                    </p>
                    
                    {/* Brand Filter Tabs */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: '1rem' }}>
                        {availableBrands.map(b => (
                            <button 
                                key={b} 
                                onClick={() => setBrandFilter(b)}
                                style={{ 
                                    padding: '0.6rem 1.4rem', 
                                    background: brandFilter === b ? '#C9A84C' : 'rgba(255,255,255,0.1)', 
                                    color: brandFilter === b ? '#000' : '#fff',
                                    border: brandFilter === b ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '30px', 
                                    fontWeight: 600, 
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: brandFilter === b ? '0 4px 12px rgba(201, 168, 76, 0.4)' : 'none'
                                }}
                                onMouseEnter={e => { if (brandFilter !== b) e.target.style.background = 'rgba(255,255,255,0.2)'; }}
                                onMouseLeave={e => { if (brandFilter !== b) e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mobile-p-2" style={{ padding: '3rem 5rem 4rem 5rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
                
                {/* Unified Control Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: '#fcfcfc', padding: '1rem', border: '1px dashed #ddd', borderRadius: '8px', marginBottom: '2.5rem' }}>
                    
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <input 
                            type="text" 
                            placeholder="Search by name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', border: '1px solid #ddd', borderRadius: '4px', outline: 'none', fontSize: '0.95rem' }}
                        />
                        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>

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
                            <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                {displayedProducts.map(item => (
                                    <ProductCard 
                                        key={item.id} 
                                        product={item} 
                                        onClick={() => setSelectedProduct(item)} 
                                    />
                                ))}
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
                                    <div style={{ background: '#111', borderRadius: '4px', width: '60px', height: '60px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={getImageUrl(watch.image)} alt={watch.name} style={{ maxWidth: '90%', maxHeight: '90%' }} />
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
            
            {/* PRODUCT DETAIL MODAL */}
            <ProductModal 
                product={selectedProduct} 
                onClose={closeModal} 
                onAddToCart={(prod, qty) => {
                    addToCart(prod.id, qty);
                    setToastMsg(`Added ${qty} item(s) to Cart`);
                    setTimeout(() => setToastMsg(''), 3000);
                    closeModal();
                }} 
            />

            <Footer />
        </div>
    );
}
