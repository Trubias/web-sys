import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';

const getToken = () =>
    localStorage.getItem('admin_token') || localStorage.getItem('jk_token') || '';

const authHead = () => ({
    headers: { Authorization: 'Bearer ' + getToken(), Accept: 'application/json' }
});

import { formatCurrency, useCurrency } from '../utils/currency';

const fmt = (n) => formatCurrency(n);

const statusColor = { Completed: '#27ae60', Pending: '#C9A84C', Processing: '#2980b9' };
const statusBg   = { Completed: 'rgba(39,174,96,0.12)', Pending: 'rgba(201,168,76,0.15)', Processing: 'rgba(41,128,185,0.12)' };

// ─── SVG Revenue Chart ────────────────────────────────────────────────────────
function RevenueChart({ data, period }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                No revenue data for this period
            </div>
        );
    }
    
    // Check if flat zero
    const max = Math.max(...data, 1);
    const isZero = max === 1 && data.every(d => d === 0);
    
    const w = 480, h = 250, pad = 10;
    const barW = Math.max((w - pad * 2) / data.length - 2, 2);

    return (
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity="1" />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C9A84C" />
                    <stop offset="100%" stopColor="#D4B96A" />
                </linearGradient>
            </defs>
            {isZero ? (
                // Flat zero line
                <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="url(#lineGrad)" strokeWidth="2" opacity="0.6" />
            ) : (
                <>
                    {/* Bars */}
                    {data.map((v, i) => {
                        if (v === 0) return null;
                        const bh = ((v / max) * (h - pad * 2));
                        const x = pad + i * ((w - pad * 2) / data.length);
                        const y = h - pad - bh;
                        return (
                            <rect key={i} x={x} y={y} width={barW} height={bh} rx="2" fill="url(#barGrad)" opacity="0.85">
                                <title>{fmt(v)}</title>
                            </rect>
                        );
                    })}
                    {/* Trend line */}
                    <polyline
                        points={data.map((v, i) => {
                            const x = pad + i * ((w - pad * 2) / data.length) + barW / 2;
                            const y = h - pad - (v / max) * (h - pad * 2);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="url(#lineGrad)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                    />
                </>
            )}
            
            {/* Base line */}
            <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e5e7eb" strokeWidth="1" />
        </svg>
    );
}

// ─── Main Admin Dashboard Component ───────────────────────────────────────────
export default function AdminDashboard() {
    useCurrency(); // Force re-render on currency change
    const [period, setPeriod]   = useState('Last 30 Days');
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        // Ensure period maps perfectly to backend params
        let apiPeriod = period;
        if (period === 'Last Month') apiPeriod = 'Last Month';
        axios.get(`/api/admin/dashboard?period=${apiPeriod}`, authHead())
            .then(res => setData(res.data))
            .catch(() => setError('Could not load dashboard data.'))
            .finally(() => setLoading(false));
    }, [period]);

    useEffect(() => {
        load();
        window.addEventListener('jk_inventory_update', load);
        return () => window.removeEventListener('jk_inventory_update', load);
    }, [load]);

    // Safety checks
    const m = data?.metrics || {
        total_sales: 0, sales_change: null,
        total_orders: 0, orders_change: null,
        low_stock: 0,
        total_customers: 0, customers_change: null
    };

    const periodOptions = ['Today', 'Last Week', 'Last Month', 'Last 90 Days'];

    // Map labels to dynamic data
    const stats = [
        {
            label: 'Total Sales',
            value: fmt(m.total_sales),
            change: m.sales_change,
            color: '#C9A84C',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
                </svg>
            )
        },
        {
            label: 'Total Orders',
            value: m.total_orders.toLocaleString(),
            change: m.orders_change,
            color: '#C9A84C',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                </svg>
            )
        },
        {
            label: 'Low Stock Alerts',
            value: m.low_stock.toLocaleString(),
            change: null, // Point-in-time, no period diff needed
            color: m.low_stock > 0 ? '#e74c3c' : '#C9A84C',
            alert: m.low_stock > 0,
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={m.low_stock > 0 ? '#e74c3c' : '#9ca3af'} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            )
        },
        {
            label: 'Total Customers',
            value: m.total_customers.toLocaleString(),
            change: m.customers_change,
            color: '#C9A84C',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
            )
        },
    ];

    // Determine chart X-axis label
    let xLabel = '';
    if (period === 'Today') xLabel = 'Hours (00:00 - 23:00)';
    else if (period === 'Last Week') xLabel = 'Last 7 Days';
    else if (period === 'Last Month') xLabel = 'Last 30 Days';
    else if (period === 'Last 90 Days') xLabel = 'Last 90 Days';

    // Fallback recent orders array
    const recentOrders = data?.recent_orders || [];

    return (
        <AdminLayout>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Overview Dashboard</h1>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#ef4444', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="admin-stats-grid">
                {stats.map((s) => {
                    const hasChange = s.change !== null;
                    const isUp = s.change > 0;
                    const changeStr = s.change > 0 ? `+${s.change}%` : `${s.change}%`;
                    
                    return (
                        <div key={s.label} className={`admin-stat-card${s.alert ? ' admin-stat-card--alert' : ''}`} style={{ borderTop: `4px solid ${s.color}` }}>
                            <div className="admin-stat-card__top">
                                <span className="admin-stat-card__label">{s.label.toUpperCase()}</span>
                                <span className="admin-stat-card__icon" style={{ color: s.color }}>{s.icon}</span>
                            </div>
                            <div className="admin-stat-card__value" style={{ color: s.alert ? '#e74c3c' : undefined }}>
                                {loading ? <span style={{opacity: 0.4}}>—</span> : s.value}
                            </div>
                            {hasChange && !loading ? (
                                <div className={`admin-stat-card__change${isUp ? ' up' : ' down'}`} style={{ color: isUp ? '#10b981' : (s.change < 0 ? '#ef4444' : '#6b7280') }}>
                                    {isUp ? '↗ ' : (s.change < 0 ? '↘ ' : '− ')} 
                                    {changeStr} vs prev period
                                </div>
                            ) : (
                                <div className="admin-stat-card__change" style={{ visibility: 'hidden' }}>—</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Chart + Recent Orders */}
            <div className="admin-bottom-grid">
                {/* Revenue Chart */}
                <div className="admin-card">
                    <div className="admin-card__header">
                        <div>
                            <div className="admin-card__title">Revenue Analytics</div>
                            <div className="admin-card__subtitle">Sales performance overview</div>
                        </div>
                        <select
                            className="admin-select"
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                        >
                            {periodOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div style={{ marginTop: '1.5rem', minHeight: 250 }}>
                        {loading ? (
                            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading...</div>
                        ) : (
                            <RevenueChart data={data?.chart_data} period={period} />
                        )}
                    </div>
                    <div className="admin-chart-labels" style={{ justifyContent: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: 10 }}>
                        <span>{xLabel}</span>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="admin-card">
                    <div className="admin-card__header">
                        <div className="admin-card__title">Recent Orders</div>
                        <button className="admin-link-btn" onClick={() => window.location.href='/admin/orders'}>View All</button>
                    </div>
                    <div className="admin-orders-list" style={{ minHeight: 250, gap: '0.9rem' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading orders...</div>
                        ) : recentOrders.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No recent orders</div>
                        ) : (
                            recentOrders.map((o) => (
                                <div key={o.id} className="admin-order-row-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontWeight: 700, fontSize: '0.8rem' }}>
                                            {o.id.replace('ORD-', '#')}
                                        </div>
                                        <div>
                                            <div className="admin-order-product" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                                                {o.product}
                                            </div>
                                            <div style={{ color: '#888', fontSize: '0.75rem', marginTop: 2 }}>Order ID: {o.id}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                                        <div style={{ color: '#C9A84C', fontWeight: 800, fontSize: '0.95rem' }}>{formatCurrency(o.amount || 0)}</div>
                                        <span
                                            className="admin-badge"
                                            style={{ background: statusBg[o.status] || '#f3f4f6', color: statusColor[o.status] || '#4b5563' }}
                                        >
                                            {o.status}
                                        </span>
                                        <div className="admin-order-amount">{fmt(o.amount)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
