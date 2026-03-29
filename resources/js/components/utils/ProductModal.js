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
        <div className="jk-modal-overlay" onClick={closeModal}>
            <div className="jk-modal-container" onClick={e => e.stopPropagation()}>

                {/* Drag Handle (Mobile Only, via CSS) */}
                <div className="jk-modal-drag-handle" onClick={closeModal}></div>

                {/* Close Button (Desktop) */}
                <button className="jk-modal-close" onClick={closeModal}>&times;</button>

                <div className="jk-modal-content">
                    {/* Left Side: Images (40% width on Desktop, full on Mobile) */}
                    <div className="jk-modal-image-col">
                        <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} className="jk-modal-image" />
                    </div>

                    {/* Right Side: Details (60% width on Desktop, full on Mobile) */}
                    <div className="jk-modal-info-col">
                        <div style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {selectedProduct.brand?.name} &bull; {selectedProduct.category?.name}
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontFamily: '"Playfair Display", serif', fontWeight: 800, marginBottom: '1rem', color: '#111', lineHeight: '1.2' }}>
                            {selectedProduct.name}
                        </h2>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C9A84C', marginBottom: '1.5rem' }}>
                            &#8369;{Number(selectedProduct.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{
                                padding: '0.3rem 0.6rem',
                                background: selectedProduct.stock > 0 ? (selectedProduct.stock <= 5 ? '#fef08a' : '#dcfce7') : '#fee2e2',
                                color: selectedProduct.stock > 0 ? (selectedProduct.stock <= 5 ? '#854d0e' : '#166534') : '#b91c1c',
                                borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700
                            }}>
                                {selectedProduct.stock === 0 ? 'Out of Stock' : (selectedProduct.stock <= 5 ? `Low Stock (${selectedProduct.stock} items left)` : `In Stock (${selectedProduct.stock} items left)`)}
                            </span>
                        </div>

                        {/* Secure Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '2rem' }}>
                            <span style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>&#128274; 100% Secure Checkout</span>
                            <span style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>&#128666; Cash on Delivery Available</span>
                            <span style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>&#128737; Authorized Retailer</span>
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
                            <div className="jk-modal-actions">
                                <div className="jk-modal-stepper">
                                    <button onClick={() => setModalQty(q => Math.max(1, q - 1))} className="jk-stepper-btn">&#8722;</button>
                                    <input type="text" value={modalQty} readOnly className="jk-stepper-input" />
                                    <button onClick={() => setModalQty(q => Math.min(selectedProduct.stock, q + 1))} className="jk-stepper-btn">&#43;</button>
                                </div>

                                <div className="jk-modal-btn-group">
                                    <button
                                        onClick={async () => {
                                            if (selectedProduct.stock > 0) {
                                                await addToCart(selectedProduct.id, modalQty);
                                                setToastMsg?.(`Added ${modalQty} item(s) to Cart`);
                                                setTimeout(() => setToastMsg?.(''), 3000);
                                                closeModal();
                                            }
                                        }}
                                        className="jk-btn-add"
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
                                        className="jk-btn-buy"
                                    >
                                        Buy It Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
