import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';

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
    wishlistItems = [...wishlistItems].sort((a,b) => {
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
        setSelectedItems([]); // Clear UI selection right away
        
        // Execute transfers safely
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
                
                {/* Header Logic */}
                <div className="mobile-stack" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px dashed #C9A84C', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2.5rem', color: '#111', marginBottom: '0.4rem', fontWeight: 800 }}>
                            <span style={{ color: '#000' }}>My</span> <span style={{ color: '#C9A84C' }}>Wishlist</span>
                        </h1>
                        <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                            {wishlistItems.length} items saved — Total estimated value <span style={{ color: '#111', fontWeight: 700 }}>${totalEstimatedValue.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Sort by</span>
                            <select 
                                value={sortOption} 
                                onChange={e => setSortOption(e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333', fontWeight: 500 }}
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
                            style={{ padding: '0.6rem 1.5rem', background: selectedItems.length > 0 ? '#C9A84C' : '#ccc', color: selectedItems.length > 0 ? '#000' : '#666', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s', fontSize: '0.9rem' }}
                        >
                            Move Selected to Cart
                        </button>
                    </div>
                </div>

                {/* Wishlist Grid */}
                <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                    
                    {wishlistItems.length === 0 && !loading && (
                        <div style={{ padding: '6rem 4rem', textAlign: 'center', background: '#fcfcfc', border: '1px dashed #ddd', borderRadius: '8px', color: '#666', gridColumn: '1 / -1' }}>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#111', fontFamily: '"Playfair Display", Georgia, serif' }}>Your wishlist is empty</h3>
                            <p>You haven't added any products to your wishlist yet.</p>
                        </div>
                    )}

                    {loading && (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#666', gridColumn: '1 / -1' }}>
                            Loading wishlist...
                        </div>
                    )}

                    {!loading && wishlistItems.map(item => (
                        <div key={item.id} style={{
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            border: '1px solid #eaeaea',
                            transition: 'all 0.2s',
                            position: 'relative',
                            opacity: item.stock === 0 ? 0.75 : 1
                        }}>
                            
                            {/* Card Header interactions */}
                            <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                                <button 
                                    onClick={() => toggleWishlist(item.id)}
                                    style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888' }}
                                    title="Remove from Wishlist"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            
                            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => toggleSelect(item.id)}
                                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#C9A84C' }} 
                                />
                            </div>

                            {/* Image layout matching design */}
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                                    <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.6rem', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{item.name}</h3>
                                    
                                    <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {item.brand?.name || item.category?.name || 'Luxury Timepiece'}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111' }}>${Number(item.price).toLocaleString()}</div>
                                        <span style={{ 
                                            background: item.stock > 0 ? '#dcfce7' : '#fee2e2', color: item.stock > 0 ? '#166534' : '#b91c1c', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.05)'
                                        }}>
                                            {item.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (item.stock > 0) {
                                                addToCart(item.id);
                                            }
                                        }}
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
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '2rem 0', borderTop: '1px dashed #eaeaea' }}>
                    <button style={{ padding: '0.5rem 0.8rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>{'<'}</button>
                    <button style={{ padding: '0.5rem 1rem', background: '#C9A84C', border: '1px solid #C9A84C', color: '#000', fontWeight: 700, borderRadius: '4px', cursor: 'pointer' }}>1</button>
                    <button style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>2</button>
                    <button style={{ padding: '0.5rem 0.8rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>{'>'}</button>
                    <button style={{ padding: '0.5rem 0.8rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}>{'»'}</button>
                </div>
                
            </div>
        </UserLayout>
    );
}
