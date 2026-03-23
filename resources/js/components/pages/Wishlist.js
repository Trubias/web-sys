import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import ProductCard from '../ProductCard';
import Footer from '../Footer';

export default function Wishlist() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        axios.get('/api/wishlist')
            .then(r => setItems(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="loading"><div className="loading__spinner" /></div>;

    return (
        <div className="wishlist-page">
            <div className="container">
                <div className="page-header">
                    <h1>My Wishlist</h1>
                    <p>{items.length} saved timepiece{items.length !== 1 ? 's' : ''}</p>
                </div>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">♥</div>
                        <h2>Your wishlist is empty</h2>
                        <p>Click the heart icon on any watch to save it for later.</p>
                        <button className="btn btn--gold" onClick={() => navigate('/browse')}>Browse Watches</button>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {items.map(item => item.product && <ProductCard key={item.id} product={item.product} />)}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
