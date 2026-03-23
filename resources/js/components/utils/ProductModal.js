import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function ProductModal({ selectedProduct, closeModal, setToastMsg }) {
    const [modalQty, setModalQty] = useState(1);
    const { addToCart, user } = useAuth();
    const navigate = useNavigate();

    if (!selectedProduct) return null;

    const getImageUrl = (img) => img ? (img.startsWith('http') ? img : `/storage/${img}`) : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&auto=format&fit=crop';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }} onClick={closeModal}>
            <div style={{
                background: '#fff', width: '900px', maxWidth: '95%',
                borderRadius: '12px', overflow: 'hidden', display: 'flex',
                position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>
                
                <button onClick={closeModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}>×</button>
                
                {/* Left Side: Images */}
                <div style={{ flex: '1', background: '#000', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                </div>
                
                {/* Right Side: Details */}
                <div style={{ flex: '1.2', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {selectedProduct.brand?.name} • {selectedProduct.category?.name}
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontFamily: '"Playfair Display", serif', fontWeight: 800, marginBottom: '1rem', color: '#111', lineHeight: '1.2' }}>
                        {selectedProduct.name}
                    </h2>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C9A84C', marginBottom: '1.5rem' }}>
                        ₱{Number(selectedProduct.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <span style={{ padding: '0.3rem 0.6rem', background: selectedProduct.stock > 0 ? (selectedProduct.stock <= 5 ? '#fef08a' : '#dcfce7') : '#fee2e2', color: selectedProduct.stock > 0 ? (selectedProduct.stock <= 5 ? '#854d0e' : '#166534') : '#b91c1c', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                            {selectedProduct.stock === 0 ? 'Out of Stock' : (selectedProduct.stock <= 5 ? `Low Stock (${selectedProduct.stock} items left)` : `In Stock (${selectedProduct.stock} items left)`)}
                        </span>
                    </div>

                    {/* Secure Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '2rem' }}>
                        <span style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 100% Secure Checkout</span>
                        <span style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>🚚 Cash on Delivery Available</span>
                        <span style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>🛡️ Authorized Retailer</span>
                    </div>

                    {/* Payment Icons */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem', fontWeight: 600 }}>Accepted Payments:</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: '#0052E0', fontSize: '0.9rem' }}>GCash</span>
                            <span style={{ fontWeight: 800, color: '#62D9A2', fontSize: '0.9rem' }}>Maya</span>
                            <span style={{ fontWeight: 800, color: '#333', fontSize: '0.9rem' }}>Bank Transfer</span>
                            <span style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem' }}>Cash on Delivery</span>
                        </div>
                    </div>

                    {/* Actions */}
                    {selectedProduct.stock > 0 && (
                        <div style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', height: '48px' }}>
                                <button onClick={() => setModalQty(q => Math.max(1, q - 1))} style={{ padding: '0 1rem', background: '#f9f9f9', border: 'none', cursor: 'pointer', fontWeight: 600, height: '100%' }}>−</button>
                                <div style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{modalQty}</div>
                                <button onClick={() => setModalQty(q => Math.min(selectedProduct.stock, q + 1))} style={{ padding: '0 1rem', background: '#f9f9f9', border: 'none', cursor: 'pointer', fontWeight: 600, height: '100%' }}>+</button>
                            </div>
                            <button 
                                onClick={async () => {
                                    if (selectedProduct.stock > 0) {
                                        await addToCart(selectedProduct.id, modalQty);
                                        setToastMsg?.(`Added ${modalQty} item(s) to Cart`);
                                        setTimeout(() => setToastMsg?.(''), 3000);
                                        closeModal();
                                    }
                                }}
                                style={{ flex: 1, background: '#fff', border: '2px solid #C9A84C', color: '#C9A84C', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s', height: '48px', borderRadius: '4px' }}
                                onMouseEnter={e => e.target.style.background = '#fefdf8'}
                                onMouseLeave={e => e.target.style.background = '#fff'}
                            >
                                Add to Cart
                            </button>
                            <button 
                                onClick={() => {
                                    if (selectedProduct.stock > 0) {
                                        closeModal();
                                        navigate('/user/checkout', {
                                            state: { directPurchase: { product: selectedProduct, quantity: modalQty } }
                                        });
                                    }
                                }}
                                style={{ flex: 1, background: '#000', border: '2px solid #000', color: '#C9A84C', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s', height: '48px', borderRadius: '4px' }}
                                onMouseEnter={e => e.target.style.background = '#111'}
                                onMouseLeave={e => e.target.style.background = '#000'}
                            >
                                Buy It Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
