import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../ProductCard';
import ProductModal from '../ProductModal';
import { useAuth } from '../../Context/AuthContext';
import Footer from '../Footer';

const BRANDS = ['Rolex', 'Omega', 'Patek Philippe', 'Cartier', 'Tag Heuer'];

export default function Home() {
    const { addToCart } = useAuth();
    const navigate = useNavigate();
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        axios.get('/api/products?limit=3')
            .then(r => setFeatured(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            {/* Wishlist/Cart Notification */}
            {toastMsg && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#333', color: '#fff', padding: '1rem 2rem', borderRadius: '4px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600, animation: 'fadeIn 0.3s' }}>
                    {toastMsg}
                </div>
            )}

            {/* ── Hero ─────────────────────────── */}
            <section className="hero">
                <div className="hero__content">
                    <div className="hero__text">
                        <h1 className="hero__title">
                            Discover Timeless<br />Elegance
                        </h1>
                        <p className="hero__description">
                            Explore our curated collection of luxury timepieces. Crafted for
                            those who appreciate precision, heritage, and uncompromising quality.
                        </p>
                        <button className="hero__cta" onClick={() => navigate('/browse')}>
                            Discover Collection
                        </button>
                    </div>
                    <div className="hero__image-wrap">
                        <img
                            src="/images/hero_watch.png"
                            alt="Luxury Watch"
                            className="hero__image"
                        />
                    </div>
                </div>
            </section>

            {/* ── Featured Products ─────────────── */}
            <section className="section">
                <div className="container">
                    <div className="section__header">
                        <h2 className="section__title">Featured Products</h2>
                        <p className="section__subtitle">Our most sought-after timepieces, selected by our expert curators.</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button className="section__link" onClick={() => navigate('/browse')}>
                            View All Products →
                        </button>
                    </div>
                    {loading
                        ? <div className="loading"><div className="loading__spinner" /></div>
                        : <div className="product-grid">{featured.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}</div>
                    }
                </div>
            </section>

            {/* ── Brand Showcase ──────────────────── */}
            <div className="brand-showcase">
                <div className="container">
                    <div className="brand-showcase__title">Brand Showcase</div>
                    <div className="brand-showcase__subtitle">Authorised dealer for the world's most prestigious watchmakers.</div>
                    <div className="brand-showcase__grid">
                        {BRANDS.map(b => (
                            <div key={b} className="brand-showcase__item"
                                onClick={() => navigate(`/browse?brand=${b.toLowerCase().replace(/\s+/g, '-')}`)}>
                                {b}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ProductModal 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
                onAddToCart={(prod, qty) => {
                    addToCart(prod.id, qty);
                    setToastMsg(`Added ${qty} item(s) to Cart`);
                    setTimeout(() => setToastMsg(''), 3000);
                    setSelectedProduct(null);
                }} 
            />

            <Footer />
        </div>
    );
}
