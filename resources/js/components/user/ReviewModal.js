import React, { useState, useRef } from 'react';
import axios from 'axios';

// ── Helpers ────────────────────────────────────────────────────────────────────
const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

function getImgSrc(image) {
    if (!image) return 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=200&auto=format&fit=crop';
    return image.startsWith('http') ? image : `/storage/${image}`;
}

// ── ReviewModal ───────────────────────────────────────────────────────────────
export default function ReviewModal({ order, onClose, onSuccess }) {
    const [rating, setRating]           = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment]         = useState('');
    const [photos, setPhotos]           = useState([]);     // { file, preview }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError]             = useState('');
    const fileInputRef = useRef(null);

    if (!order) return null;

    const imgSrc = getImgSrc(order.product_image);

    // ── Photo handling ─────────────────────────────────────────────────────────
    const handleFilePick = (e) => {
        const incoming = Array.from(e.target.files || []);
        const remaining = 5 - photos.length;
        const toAdd = incoming.slice(0, remaining).map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setPhotos(prev => [...prev, ...toAdd]);
        e.target.value = '';   // reset so same file can be re-selected
    };

    const removePhoto = (index) => {
        setPhotos(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError('');
        if (rating < 1) { setError('Please select a star rating.'); return; }
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('order_id', order.id);
            formData.append('rating', rating);
            if (comment.trim()) formData.append('comment', comment.trim());
            photos.forEach(p => formData.append('images[]', p.file));

            await axios.post('/api/reviews', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onSuccess?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    const activeRating = hoverRating || rating;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem', fontFamily: 'Inter, sans-serif',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden',
            }}>

                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ color: '#C9A84C', fontWeight: 800, fontSize: '1.05rem' }}>
                            Write a Review
                        </div>
                        <div style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                            Share your experience with this product
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                            width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                            fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >✕</button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                    {/* ── Product card ── */}
                    <div style={{
                        background: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px',
                        padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
                    }}>
                        <img
                            src={imgSrc}
                            alt={order.product_name}
                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=200&auto=format&fit=crop'; }}
                            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.product_name}
                            </div>
                            {order.brand_name && (
                                <div style={{ fontSize: '0.76rem', color: '#888', marginTop: '0.1rem' }}>{order.brand_name}</div>
                            )}
                        </div>
                    </div>

                    {/* ── Star selector ── */}
                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.55rem' }}>
                            Overall Rating
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        fontSize: '2rem', color: activeRating >= star ? '#C9A84C' : '#ddd',
                                        lineHeight: 1, transition: 'color 0.15s, transform 0.1s',
                                        transform: activeRating >= star ? 'scale(1.15)' : 'scale(1)',
                                    }}
                                >★</button>
            ))}
                            {rating > 0 && (
                                <span style={{ fontSize: '0.82rem', color: '#C9A84C', fontWeight: 700, marginLeft: '0.4rem' }}>
                                    {RATING_LABELS[activeRating] || RATING_LABELS[rating]}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Comment ── */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Your Review
                            </div>
                            <div style={{ fontSize: '0.72rem', color: comment.length > 900 ? '#ef4444' : '#aaa' }}>
                                {comment.length}/1000
                            </div>
                        </div>
                        <textarea
                            rows={3}
                            maxLength={1000}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '0.7rem 0.85rem', border: '1px solid #ddd',
                                borderRadius: '6px', fontSize: '0.88rem', resize: 'vertical',
                                fontFamily: 'Inter, sans-serif', color: '#333', outline: 'none',
                                lineHeight: 1.5,
                            }}
                            onFocus={e => e.target.style.borderColor = '#C9A84C'}
                            onBlur={e => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    {/* ── Photo upload ── */}
                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.55rem' }}>
                            Add Photos <span style={{ textTransform: 'none', fontWeight: 400, color: '#bbb' }}>(max 5)</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-start' }}>
                            {/* Thumbnails */}
                            {photos.map((p, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    <img
                                        src={p.preview}
                                        alt=""
                                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        style={{
                                            position: 'absolute', top: -6, right: -6,
                                            width: 18, height: 18, borderRadius: '50%',
                                            background: '#dc2626', color: '#fff', border: 'none',
                                            fontSize: '0.6rem', cursor: 'pointer', lineHeight: 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >✕</button>
                                </div>
                            ))}

                            {/* Upload button */}
                            {photos.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: 60, height: 60, border: '1.5px dashed #C9A84C',
                                        borderRadius: '6px', background: '#fffdf5',
                                        color: '#C9A84C', fontSize: '1.4rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >+</button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFilePick}
                        />
                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '6px', padding: '0.7rem 0.85rem',
                            color: '#b91c1c', fontSize: '0.84rem', fontWeight: 500,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* ── Actions ── */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, height: '42px', background: '#dc2626',
                                border: '1px solid #dc2626', borderRadius: '6px',
                                color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#b91c1c'; e.currentTarget.style.borderColor = '#b91c1c'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; }}
                        >Cancel</button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || rating === 0}
                            style={{
                                flex: 2, height: '42px', borderRadius: '6px', border: 'none',
                                background: rating > 0 && !isSubmitting ? '#C9A84C' : '#e5e7eb',
                                color: rating > 0 && !isSubmitting ? '#000' : '#9ca3af',
                                fontWeight: 700, fontSize: '0.9rem',
                                cursor: rating > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                                transition: 'background 0.2s',
                            }}
                        >
                            {isSubmitting ? 'Submitting…' : 'Submit Review'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
