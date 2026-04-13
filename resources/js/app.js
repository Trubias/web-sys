import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import Layout from './components/Layout';
import Home from './components/pages/Home';
import Browse from './components/pages/Browse';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import Wishlist from './components/pages/Wishlist';
import Login from './components/auth/Login';
import ProductReviews from './components/pages/ProductReviews';
import SupplierDashboard from './components/supplier/SupplierDashboard';

// Rider pages
import RiderHome from './components/rider/RiderHome';
import RiderDeliveries from './components/rider/RiderDeliveries';
import RiderHistory from './components/rider/RiderHistory';
import RiderProfile from './components/rider/RiderProfile';

// Admin pages
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProducts from './components/admin/AdminProducts';
import AdminInventory from './components/admin/AdminInventory';
import AdminOrders from './components/admin/AdminOrders';
import AdminCustomers from './components/admin/AdminCustomers';
import AdminSuppliers from './components/admin/AdminSuppliers';
import AdminRiders from './components/admin/AdminRiders';
import AdminReports from './components/admin/AdminReports';
import AdminSettings from './components/admin/AdminSettings';

// User pages
import UserDashboard from './components/user/UserDashboard';
import UserBrowse from './components/user/UserBrowse';
import UserWishlist from './components/user/UserWishlist';
import UserProfile from './components/user/UserProfile';
import UserOrders from './components/user/UserOrders';
import Cart from './components/pages/Cart';
import Checkout from './components/pages/Checkout';

// Guard: only admins can access /admin/*
function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9f9f9', color: '#888' }}><div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div><div>Verifying access...</div></div>;
    if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
    return children;
}

// Guard: only users can access /user/*
function UserRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9f9f9', color: '#888' }}><div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div><div>Verifying access...</div></div>;
    if (!user || user.role !== 'user') return <Navigate to="/login" replace />;
    return children;
}

// Guard: only riders can access /rider/*
function RiderRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9f9f9', color: '#888' }}><div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div><div>Verifying access...</div></div>;
    if (!user || user.role !== 'rider') return <Navigate to="/login" replace />;

    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public / Customer routes */}
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="browse" element={<Browse />} />
                        <Route path="about" element={<About />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="wishlist" element={<Wishlist />} />
                        <Route path="login" element={<Login />} />


                        <Route path="*" element={<Home />} />
                    </Route>

                    {/* Standalone pages (no navbar) */}
                    <Route path="/product/:id/reviews" element={<ProductReviews />} />

                    {/* Supplier Dashboard Route */}
                    <Route path="/supplier" element={<SupplierDashboard />} />

                    {/* Admin routes — own layout, protected */}
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                    <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
                    <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                    <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
                    <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
                    <Route path="/admin/riders" element={<AdminRoute><AdminRiders /></AdminRoute>} />
                    <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                    <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                    {/* Rider Portal routes */}
                    <Route path="/rider/home" element={<RiderRoute><RiderHome /></RiderRoute>} />
                    <Route path="/rider/deliveries" element={<RiderRoute><RiderDeliveries /></RiderRoute>} />
                    <Route path="/rider/history" element={<RiderRoute><RiderHistory /></RiderRoute>} />
                    <Route path="/rider/profile" element={<RiderRoute><RiderProfile /></RiderRoute>} />

                    {/* User Portal routes */}
                    <Route path="/user/dashboard" element={<UserRoute><UserDashboard /></UserRoute>} />
                    <Route path="/user/browse" element={<UserRoute><UserBrowse /></UserRoute>} />
                    <Route path="/user/wishlist" element={<UserRoute><UserWishlist /></UserRoute>} />
                    <Route path="/user/profile" element={<UserRoute><UserProfile /></UserRoute>} />
                    <Route path="/user/orders" element={<UserRoute><UserOrders /></UserRoute>} />
                    <Route path="/user/cart" element={<UserRoute><Cart /></UserRoute>} />
                    <Route path="/user/checkout" element={<UserRoute><Checkout /></UserRoute>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

const root = createRoot(document.getElementById('app'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
