import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios base URL
axios.defaults.baseURL = '';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistIds, setWishlistIds] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('jk_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get('/api/user');
            setUser(res.data);
            fetchCart();
            fetchWishlist();
        } catch {
            localStorage.removeItem('jk_token');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const fetchCart = async () => {
        try { const res = await axios.get('/api/cart'); setCartCount(res.data.length); } catch { }
    };

    const fetchWishlist = async () => {
        try { const res = await axios.get('/api/wishlist'); setWishlistIds(res.data.map(i => i.product_id)); } catch { }
    };

    const login = async (email, password, login_type = null) => {
        const payload = { email, password };
        if (login_type) payload.login_type = login_type;
        const res = await axios.post('/api/login', payload);
        const { token, user } = res.data;
        localStorage.setItem('jk_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        fetchCart();
        fetchWishlist();
        return user;
    };

    const register = async (data) => {
        const res = await axios.post('/api/register', data);
        const { token, user } = res.data;
        localStorage.setItem('jk_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return user;
    };

    const logout = async () => {
        try { await axios.post('/api/logout'); } finally {
            localStorage.removeItem('jk_token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setCartCount(0);
            setWishlistIds([]);
        }
    };

    const addToCart = async (productId, quantity = 1) => {
        await axios.post('/api/cart', { product_id: productId, quantity });
        fetchCart();
        
        // Optimistically drop from local wishlist view reflecting automatic backend deletion
        setWishlistIds(ids => ids.filter(id => Number(id) !== Number(productId)));
    };

    const toggleWishlist = async (productId) => {
        const pId = Number(productId);
        if (wishlistIds.some(id => Number(id) === pId)) {
            // Optimistic deletion
            setWishlistIds(ids => ids.filter(id => Number(id) !== pId));
            try {
                const res = await axios.get('/api/wishlist');
                const item = res.data.find(i => Number(i.product_id) === pId);
                if (item) await axios.delete(`/api/wishlist/${item.id}`);
            } catch (err) {
                // Revert locally if request fails
                setWishlistIds(ids => [...ids, pId]);
            }
        } else {
            // Optimistic addition
            setWishlistIds(ids => [...ids, pId]);
            try {
                await axios.post('/api/wishlist', { product_id: pId });
            } catch (err) {
                setWishlistIds(ids => ids.filter(id => Number(id) !== pId));
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, cartCount, wishlistIds, login, register, logout, addToCart, toggleWishlist, refreshCart: fetchCart, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
