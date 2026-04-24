import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import UserLayout from './UserLayout';
import { useAuth } from '../../Context/AuthContext';
import ProductModal from '../utils/ProductModal';

export default function UserDashboard() {
    const { user, wishlistIds, toggleWishlist, addToCart } = useAuth();
    const [toastMsg, setToastMsg] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [recommendations, setRecommendations] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [fetchedWishlist, setFetchedWishlist] = useState([]);

    useEffect(() => {
        axios.get('/api/products?limit=3')
            .then(res => setRecommendations(res.data))
            .catch(err => console.error('Error fetching recommendations:', err));

        axios.get('/api/orders')
            .then(res => setRecentOrders(res.data.slice(0, 5)))
            .catch(err => console.error(err));

        axios.get('/api/wishlist')
            .then(res => setFetchedWishlist(res.data.map(w => w.product).filter(Boolean)))
            .catch(err => console.error(err));
    }, []);

    const handleWishlistToggle = async (item) => {
        const isAdded = !wishlistIds.some(id => Number(id) === Number(item.id));
        await toggleWishlist(item.id);
        setToastMsg(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist');
        setTimeout(() => setToastMsg(''), 3000);
    };

    const realWishlist = fetchedWishlist.filter(p => wishlistIds.includes(p.id));
    const wishlistPreviewItems = realWishlist.slice(0, 3);

    const statusColors = {
        'Completed': { bg: 'rgba(39, 174, 96, 0.1)', color: '#27ae60' },
        'Processing': { bg: 'rgba(41, 128, 185, 0.1)', color: '#2980b9' },
        'Pending': { bg: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04' }
    };

    return (
        <UserLayout>
            {/* Wishlist Toast Notification */}
            {toastMsg && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#333', color: '#fff', padding: '1rem 2rem', borderRadius: '4px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600, animation: 'fadeIn 0.3s' }}>
                    {toastMsg}
                </div>
            )}

            {/* Hero / Banner */}
            <div className="user-hero-section mobile-stack" style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, rgba(201, 168, 76, 0.6) 100%)',
                color: '#fff',
                padding: '4rem 5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative'
            }}>
                <div style={{ maxWidth: '600px', zIndex: 2 }}>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontWeight: 700,
                        color: '#C9A84C',
                        lineHeight: 1.1,
                        marginBottom: '1rem'
                    }}>
                        Welcome Back,<br />{user?.name || 'Customer'}
                    </h1>
                    <p style={{
                        fontSize: '1.1rem',
                        lineHeight: 1.6,
                        color: '#ddd',
                        marginBottom: '2.5rem',
                        fontWeight: 300
                    }}>
                        Exclusive Access to the World's Most Prestigious<br />Timepieces. Discover your next heirloom.
                    </p>
                    <div className="user-hero-btns" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/user/browse" style={{
                            flex: '1 1 auto',
                            textAlign: 'center',
                            padding: '0.8rem 2rem',
                            background: '#C9A84C',
                            color: '#000',
                            fontWeight: 700,
                            textDecoration: 'none',
                            borderRadius: '4px',
                            border: '1px solid #C9A84C',
                            transition: 'all 0.2s',
                            fontSize: '0.95rem',
                            minHeight: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>Shop New Arrivals</Link>
                        <Link to="/user/wishlist" style={{
                            flex: '1 1 auto',
                            textAlign: 'center',
                            padding: '0.8rem 2rem',
                            background: 'transparent',
                            color: '#C9A84C',
                            fontWeight: 600,
                            textDecoration: 'none',
                            borderRadius: '4px',
                            border: '1px solid #C9A84C',
                            transition: 'all 0.2s',
                            fontSize: '0.95rem',
                            minHeight: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>View Your Wishlist</Link>
                    </div>
                </div>

                {/* Hero Image Group */}
                <div className="mobile-hide" style={{ position: 'relative', width: '380px', height: '400px' }}>
                    <div style={{
                        position: 'absolute',
                        right: '25%',
                        top: '10%',
                        width: '280px',
                        height: '350px',
                        background: '#000',
                        borderRadius: '8px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                        zIndex: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Luxury watch" />
                    </div>
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        bottom: '-10%',
                        width: '240px',
                        height: '300px',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.9)',
                        zIndex: 1,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <img src="https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="Secondary background watch" />
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="user-content-area mobile-p-2" style={{ padding: '4rem 5rem', maxWidth: '1400px', margin: '0 auto' }}>

                {/* Recommended Section */}
                <div style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.8rem', color: '#111' }}>Recommended for You</h2>
                    </div>

                    <div className="user-recommended-grid mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        {recommendations.map(item => (
                            <div key={item.id} style={{
                                background: '#fff',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: '1px solid #eee',
                                textAlign: 'center',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                onClick={() => setSelectedProduct(item)}>
                                <div style={{ margin: '-1.5rem -1.5rem 1.5rem -1.5rem', background: '#fff', borderBottom: '1px solid #eee', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleWishlistToggle(item); }}
                                        style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 10 }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlistIds.some(id => Number(id) === Number(item.id)) ? '#ef4444' : 'none'} stroke={wishlistIds.some(id => Number(id) === Number(item.id)) ? '#ef4444' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </button>
                                    <img
                                        src={item.image ? (item.image.startsWith('http') ? item.image : `/storage/${item.image}`) : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&auto=format&fit=crop'}
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem', background: '#fff' }}
                                    />
                                </div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#111', lineHeight: 1.2 }}>{item.name}</h3>
                                <div style={{ fontSize: '0.7rem', color: '#C9A84C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.8rem' }}>{item.brand?.name || item.category?.name || 'Luxury Timepiece'}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>₱{Number(item.price).toLocaleString()}</div>
                                    <button style={{
                                        padding: '0.5rem 1rem',
                                        background: item.stock > 0 ? '#C9A84C' : '#e5e7eb',
                                        color: item.stock > 0 ? '#000' : '#9ca3af',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontWeight: 700,
                                        cursor: item.stock > 0 ? 'pointer' : 'not-allowed',
                                        fontSize: '0.85rem'
                                    }}
                                        disabled={item.stock === 0}
                                        onClick={(e) => { e.stopPropagation(); if (item.stock > 0) addToCart(item.id); }}
                                    >
                                        {item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                </div></div>
                        ))}
                    </div>
                </div>

                {/* Lower Section Grid */}
                <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem' }}>

                    {/* Recent Activity */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', color: '#111' }}>Recent Activity</h2>
                            <Link to="/user/orders" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>View All Orders &rarr;</Link>
                        </div>
                        <div className="user-orders-table-wrap"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingBottom: '1rem', color: '#888', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee' }}>ORDER ID</th>
                                    <th style={{ textAlign: 'left', paddingBottom: '1rem', color: '#888', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee' }}>ITEM NAME</th>
                                    <th style={{ textAlign: 'center', paddingBottom: '1rem', color: '#888', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee' }}>STATUS</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '1rem', color: '#888', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee' }}>PRICE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '3rem 0', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                                            No recent orders yet.
                                        </td>
                                    </tr>
                                ) : recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td style={{ padding: '1.2rem 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.85rem', color: '#555', fontWeight: 500 }}>{order.ref}</td>
                                        <td style={{ padding: '1.2rem 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.9rem', fontWeight: 600 }}>{order.product_name}</td>
                                        <td style={{ padding: '1.2rem 0', borderBottom: '1px solid #f5f5f5', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: (statusColors[order.status] || { bg: '#eee' }).bg,
                                                color: (statusColors[order.status] || { color: '#333' }).color
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem 0', borderBottom: '1px solid #f5f5f5', textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                                            ₱{Number(order.total_amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>

                    {/* Wishlist Preview */}
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', color: '#111' }}>Your Wishlist</h2>
                            <Link to="/user/wishlist" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>View All &rarr;</Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {wishlistPreviewItems.length === 0 ? (
                                <div style={{ padding: '2.5rem 0', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                                    No items in your wishlist yet. <Link to="/user/browse" style={{ color: '#C9A84C', fontWeight: 600, display: 'block', marginTop: '0.5rem' }}>Start adding watches you love!</Link>
                                </div>
                            ) : wishlistPreviewItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.2rem', borderBottom: '1px solid #f5f5f5' }}>
                                    <div style={{ width: '50px', height: '50px', background: '#000', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <img src={item.image ? (item.image.startsWith('http') ? item.image : `/storage/${item.image}`) : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=100&auto=format&fit=crop'} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} alt={item.name} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', color: '#111' }}>{item.name}</div>
                                        <div style={{ color: '#888', fontSize: '0.75rem' }}>{item.brand?.name || item.category?.name || 'Luxury Timepiece'}</div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>
                                        ₱{Number(item.price).toLocaleString()}
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
