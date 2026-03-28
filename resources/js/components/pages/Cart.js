import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import UserLayout from '../user/UserLayout';

const fmt = (p) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(p);

export default function Cart() {
    const { user, refreshCart } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderNote, setOrderNote] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        axios.get('/api/cart')
            .then(r => setItems(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    const removeItem = async (id) => {
        await axios.delete(`/api/cart/${id}`);
        setItems(items => items.filter(i => i.id !== id));
        refreshCart();
    };

    const updateQty = async (id, qty) => {
        try {
            await axios.put(`/api/cart/${id}`, { quantity: qty });
            setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
        } catch { }
    };

    const clearCart = async () => {
        await axios.delete('/api/cart');
        setItems([]);
        setSelectedItems([]);
        refreshCart();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedItems(items.map(i => i.id));
        else setSelectedItems([]);
    };

    const clearSelected = async () => {
        if (selectedItems.length === 0) return;
        await Promise.all(selectedItems.map(id => axios.delete(`/api/cart/${id}`)));
        setItems(items => items.filter(i => !selectedItems.includes(i.id)));
        setSelectedItems([]);
        refreshCart();
    };

    const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

    if (loading) return <div className="loading"><div className="loading__spinner" /></div>;

    return (
        <UserLayout>
            <div className="container mobile-p-2" style={{ padding: '4rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2.5rem', color: '#111' }}>Shopping Cart</h1>
                    <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
                </div>

                {items.length === 0 ? (
                    <div className="empty-state" style={{ background: '#fff', padding: '4rem', textAlign: 'center', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                        <div className="empty-state__icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.8rem', color: '#111', marginBottom: '0.5rem' }}>Your cart is empty</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Discover our luxury timepiece collection.</p>
                        <button style={{ padding: '0.8rem 2rem', background: '#C9A84C', color: '#000', fontWeight: 800, border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => navigate('/user/browse')}>Browse Watches</button>
                    </div>
                ) : (
                    <div className="cart-grid">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eaeaea' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItems.length > 0 && selectedItems.length === items.length}
                                        onChange={handleSelectAll}
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#C9A84C' }} 
                                    />
                                    Select All
                                </label>
                                <button 
                                    onClick={clearSelected}
                                    style={{ padding: '0.4rem 1rem', background: selectedItems.length > 0 ? 'red' : '#ccc', color: selectedItems.length > 0 ? '#fff' : '#666', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s', fontSize: '0.85rem' }}
                                >
                                    Clear Selected
                                </button>
                            </div>
                            <div className="cart-items">
                                {items.map(item => (
                                    <div key={item.id} className="cart-item" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eaeaea' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => {
                                                if (selectedItems.includes(item.id)) setSelectedItems(selectedItems.filter(i => i !== item.id));
                                                else setSelectedItems([...selectedItems, item.id]);
                                            }}
                                            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#C9A84C' }} 
                                        />
                                        <div className="cart-item__img" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                                            <img src={(item.product?.image && item.product.image.startsWith('http')) ? item.product.image : `/storage/${item.product?.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.product?.name} />
                                        </div>
                                        <div className="cart-item__info" style={{ flex: 1 }}>
                                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>{item.product?.name}</h3>
                                            <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>{item.product?.brand?.name}</p>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                            <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))} style={{ padding: '0.3rem 0.8rem', background: '#f9f9f9', border: 'none', cursor: 'pointer', fontWeight: 600 }}>-</button>
                                            <span style={{ padding: '0 0.8rem', fontWeight: 600, fontSize: '0.9rem' }}>{item.quantity}</span>
                                            <button onClick={() => updateQty(item.id, Math.min(item.product?.stock || 999, item.quantity + 1))} style={{ padding: '0.3rem 0.8rem', background: '#f9f9f9', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+</button>
                                        </div>

                                        <div className="cart-item__price" style={{ fontWeight: 800, width: '100px', textAlign: 'right' }}>₱{fmt(item.product?.price)}</div>
                                        <button className="cart-item__remove" onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0.5rem' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button style={{ padding: '0.6rem 1rem', background: 'red', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }} onClick={clearCart}>Clear Cart</button>
                                <button style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/user/browse')}>← Continue Shopping</button>
                            </div>
                        </div>

                        <div className="cart-summary">
                            <h2>Order Summary</h2>
                            <div className="cart-summary__row"><span>Subtotal</span><span>₱{fmt(total)}</span></div>
                            <div className="cart-summary__row"><span>Shipping</span><span>Free</span></div>
                            <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>₱{fmt(total)}</span></div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.5rem', display: 'block' }}>Order Note (Optional)</label>
                                <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Notes about your order, e.g. special notes for delivery."></textarea>
                            </div>
                            <button style={{ width: '100%', padding: '1rem', marginTop: '1rem', background: '#000', color: '#C9A84C', fontWeight: 800, textTransform: 'uppercase', fontSize: '1.1rem', border: '1px solid #000', borderRadius: '4px', cursor: 'pointer' }} onClick={() => navigate('/user/checkout', { state: { orderNote } })}>Proceed to Checkout</button>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
