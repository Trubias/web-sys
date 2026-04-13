import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';


// ── Star display ───────────────────────────────────────────────────────────────
function StarDisplay({ rating, size }) {
    const sz = size || '1rem';
    const filled = Math.round(rating || 0);
    return (
        <span style={{ color: '#C9A84C', fontSize: sz, letterSpacing: '1px', lineHeight: 1 }}>
            {'★'.repeat(filled)}
            <span style={{ color: '#ddd' }}>{'★'.repeat(5 - filled)}</span>
        </span>
    );
}

const getImageUrl = (img) =>
    img ? (img.startsWith('http') ? img : `/storage/${img}`)
        : 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&auto=format&fit=crop';

export default function ProductReviews() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // The product might be passed via state; otherwise we fetch it
    const [product, setProduct] = useState(location.state?.product || null);
    
    const [data, setData]             = useState(null);
    const [loadingReviews, setLoading]= useState(true);
    const [page, setPage]             = useState(1);
    const [lightbox, setLightbox]     = useState(null);
    const [helpfulMap, setHelpfulMap] = useState({});

    // Fetch product if not available in state
    useEffect(() => {
        if (!product) {
            axios.get(`/api/products/${id}`)
                .then(res => setProduct(res.data))
                .catch(() => {}); // If fails, we just don't have product details
        }
    }, [id, product]);

    // Fetch reviews
    useEffect(() => {
        setLoading(true);
        axios.get(`/api/products/${id}/reviews`, { params: { page } })
            .then(res => {
                if (page > 1) {
                    setData(prev => {
                        if (!prev) return res.data;
                        return {
                            ...res.data,
                            reviews: {
                                ...res.data.reviews,
                                data: [...prev.reviews.data, ...res.data.reviews.data],
                            },
                        };
                    });
                } else {
                    setData(res.data);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id, page]);

    const handleHelpful = (reviewId) => {
        axios.post(`/api/reviews/${reviewId}/helpful`)
            .then(res => setHelpfulMap(prev => ({ ...prev, [reviewId]: res.data.helpful_count })))
            .catch(() => {});
    };

    const total     = data ? data.total_reviews   : 0;
    const avgRaw    = data ? data.average_rating  : 0;
    const avg       = Number(avgRaw).toFixed(1);
    const breakdown = data ? (data.rating_breakdown || {}) : {};
    const reviews   = data?.reviews?.data ?? [];
    const hasMore   = !!(data?.reviews?.next_page_url);

    return (
        <div style={{ background: '#f9f9f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, padding: '3rem 2rem 5rem 2rem', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    
                    {/* ── BACK BUTTON ── */}
                    <button 
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'transparent', border: 'none', color: '#666',
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            marginBottom: '1.5rem', padding: 0
                        }}
                    >
                        <span>←</span> Back to Browse
                    </button>

                    {/* ── PRODUCT HEADER ── */}
                    <div style={{ 
                        background: '#fff', padding: '1.5rem', borderRadius: '12px', 
                        border: '1px solid #eaeaea', marginBottom: '2rem',
                        display: 'flex', alignItems: 'center', gap: '1.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{
                            width: 100, height: 100, borderRadius: '8px', overflow: 'hidden',
                            border: '1px solid #eee', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {product ? (
                                <img src={getImageUrl(product.image)} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ fontSize: '2rem', color: '#ccc' }}>⌚</div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.3rem' }}>
                                Customer Reviews
                            </div>
                            <h1 style={{ 
                                margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#111', 
                                fontFamily: '"Playfair Display", serif', lineHeight: 1.2
                            }}>
                                {product ? product.name : `Product #${id}`}
                            </h1>
                            {product?.brand && (
                                <div style={{ fontSize: '0.95rem', color: '#555', marginTop: '0.3rem', fontWeight: 500 }}>
                                    {product.brand.name}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loading skeleton */}
                    {loadingReviews && !data && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa', fontSize: '0.95rem', background: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
                            Loading reviews…
                        </div>
                    )}

                    {/* Empty state */}
                    {!loadingReviews && total === 0 && (
                        <div style={{
                            background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px',
                            padding: '4rem 2rem', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                            <div style={{ fontWeight: 800, color: '#111', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                No reviews yet
                            </div>
                            <div style={{ color: '#888', fontSize: '0.95rem' }}>
                                Be the first to review this product after your order is delivered.
                            </div>
                        </div>
                    )}

                    {/* Data available */}
                    {data && total > 0 && (
                        <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            {/* ── Aggregate block ── */}
                            <div style={{
                                background: '#fafafa', border: '1px solid #eee', borderRadius: '10px',
                                padding: '1.5rem', marginBottom: '2rem',
                                display: 'flex', gap: '2.5rem', alignItems: 'center',
                            }}>
                                {/* Big number */}
                                <div style={{ textAlign: 'center', minWidth: 80, flexShrink: 0 }}>
                                    <div style={{
                                        fontSize: '3.5rem', fontWeight: 800, color: '#111', lineHeight: 1,
                                        fontFamily: '"Playfair Display", serif',
                                    }}>
                                        {avg}
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <StarDisplay rating={avgRaw} size="1.2rem" />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.4rem', fontWeight: 500 }}>
                                        {total} review{total !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {/* Breakdown bars 5→1 */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = breakdown[star] || 0;
                                        const pct   = total > 0 ? (count / total) * 100 : 0;
                                        return (
                                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#555', minWidth: 14, textAlign: 'right', fontWeight: 600 }}>{star}</span>
                                                <span style={{ color: '#C9A84C', fontSize: '0.85rem' }}>★</span>
                                                <div style={{ flex: 1, height: 8, background: '#e5e5e5', borderRadius: 4, overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: pct + '%', height: '100%',
                                                        background: '#111', borderRadius: 4,
                                                        transition: 'width 0.5s ease',
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: '#888', minWidth: 24, textAlign: 'right' }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Individual review cards ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {reviews.map(review => {
                                    const helpCount = Object.prototype.hasOwnProperty.call(helpfulMap, review.id)
                                        ? helpfulMap[review.id]
                                        : review.helpful_count;
                                    return (
                                        <div key={review.id} style={{
                                            borderBottom: '1px solid #f0f0f0',
                                            paddingBottom: '1.25rem',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {/* Name + stars + date */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111', marginBottom: '0.25rem' }}>
                                                        {review.reviewer_name}
                                                    </div>
                                                    <StarDisplay rating={review.rating} size="0.9rem" />
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                    {new Date(review.created_at).toLocaleDateString('en-PH', {
                                                        month: 'long', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>

                                            {/* Comment */}
                                            {review.comment && (
                                                <p style={{ margin: '0 0 0.8rem', fontSize: '0.95rem', color: '#333', lineHeight: 1.6 }}>
                                                    {review.comment}
                                                </p>
                                            )}

                                            {/* Photos */}
                                            {review.images && review.images.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                                    {review.images.map((url, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt=""
                                                            onClick={() => setLightbox(url)}
                                                            style={{
                                                                width: 72, height: 72, objectFit: 'cover',
                                                                borderRadius: '8px', border: '1px solid #eee',
                                                                cursor: 'zoom-in', transition: 'opacity 0.2s'
                                                            }}
                                                            onMouseEnter={e => e.target.style.opacity = '0.8'}
                                                            onMouseLeave={e => e.target.style.opacity = '1'}
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Helpful */}
                                            <button
                                                type="button"
                                                onClick={() => handleHelpful(review.id)}
                                                style={{
                                                    background: '#fff', border: '1px solid #e5e7eb',
                                                    borderRadius: '20px', padding: '0.35rem 0.85rem',
                                                    fontSize: '0.8rem', color: '#666', cursor: 'pointer',
                                                    fontFamily: 'Inter, sans-serif', fontWeight: 600,
                                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#666'; }}
                                            >
                                                <span>👍</span> Helpful ({helpCount})
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Load more */}
                            {hasMore && (
                                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={loadingReviews}
                                        style={{
                                            background: '#0a0a0a', border: '1px solid #0a0a0a',
                                            color: '#C9A84C', borderRadius: '6px',
                                            padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 700,
                                            cursor: loadingReviews ? 'default' : 'pointer',
                                            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { if (!loadingReviews) e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#000'; }}
                                        onMouseLeave={e => { if (!loadingReviews) e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#C9A84C'; }}
                                    >
                                        {loadingReviews ? 'Loading…' : 'Load more reviews'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>



            {/* Lightbox */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
                        zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <img
                        src={lightbox}
                        alt="Review photo"
                        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }}
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setLightbox(null)}
                        style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                            width: 44, height: 44, borderRadius: '50%', fontSize: '1.25rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >✕</button>
                </div>
            )}
        </div>
    );
}
