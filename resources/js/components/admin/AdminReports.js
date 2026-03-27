import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';

const IMG_BASE = '/storage/';

const getToken = () =>
    localStorage.getItem('admin_token') || localStorage.getItem('jk_token') || '';

const authHead = () => ({
    headers: { Authorization: 'Bearer ' + getToken(), Accept: 'application/json' }
});

import { formatCurrency, useCurrency } from '../utils/currency';

const fmt = (n) => formatCurrency(n);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Simple SVG bar chart ────────────────────────────────────────────────────
function BarChart({ data, height = 160 }) {
    // data: [ { label, value } ]
    if (!data || data.length === 0) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                No data for this year
            </div>
        );
    }
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 6, borderBottom: '2px solid #e5e7eb', borderLeft: '2px solid #e5e7eb', paddingLeft: 4 }}>
            {data.map((d, i) => {
                const pct = Math.round((d.value / maxVal) * 100);
                return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div title={`${d.label}: ${fmt(d.value)}`}
                            style={{
                                width: '100%', height: pct + '%', minHeight: 4,
                                background: i === 0 ? '#C9A84C' : '#dbc378',
                                borderRadius: '4px 4px 0 0', transition: 'height 0.3s',
                            }} />
                    </div>
                );
            })}
        </div>
    );
}

// ─── Simple SVG line chart ────────────────────────────────────────────────────
function LineChart({ monthlyRevenue, height = 180 }) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const values = months.map(m => monthlyRevenue[m] || 0);
    const hasData = values.some(v => v > 0);

    if (!hasData) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                No revenue data for this year
            </div>
        );
    }

    const maxVal = Math.max(...values, 1);
    const W = 300;
    const H = height;
    const pad = 8;
    const points = values.map((v, i) => {
        const x = pad + (i / 11) * (W - 2 * pad);
        const y = H - pad - ((v / maxVal) * (H - 2 * pad));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
            <polyline points={points} fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinejoin="round" />
            {values.map((v, i) => {
                if (v === 0) return null;
                const x = pad + (i / 11) * (W - 2 * pad);
                const y = H - pad - ((v / maxVal) * (H - 2 * pad));
                return (
                    <g key={i}>
                        <circle cx={x} cy={y} r="3.5" fill="#C9A84C" />
                        <title>{MONTH_NAMES[i]}: {fmt(v)}</title>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────
export default function AdminReports() {
    useCurrency();
    const currentYear = new Date().getFullYear();
    const [yearInput, setYearInput] = useState(currentYear.toString());
    const [showSearch, setShowSearch] = useState(false);
    const inputRef = useRef(null);

    const [year, setYear]       = useState(currentYear.toString());
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    const handleSearch = () => {
        const y = parseInt(yearInput, 10);
        if (!yearInput || isNaN(y) || y < 2020 || y > currentYear) return;
        setYear(yearInput);
        setShowSearch(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
        if (e.key === 'Escape') setShowSearch(false);
    };

    const toggleSearch = () => {
        setShowSearch(prev => {
            if (!prev) setTimeout(() => inputRef.current?.focus(), 50);
            return !prev;
        });
    };

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        axios.get(`/api/admin/reports?year=${year}`, authHead())
            .then(r => setData(r.data))
            .catch(() => setError('Could not load reports. Make sure you are logged in as admin.'))
            .finally(() => setLoading(false));
    }, [year]);

    useEffect(() => { load(); }, [load]);


    // Build derived display values
    const totalRevenue   = data ? data.total_revenue   : 0;
    const avgOrderValue  = data ? data.avg_order_value : 0;
    const topBrand       = data ? (data.top_brand || 'No data') : '—';
    const convRate       = data ? data.conversion_rate  : 0;
    const monthlyRevenue = data ? data.monthly_revenue  : {};
    const salesByBrand   = data ? data.sales_by_brand   : {};
    const topProducts    = data ? data.top_products     : [];
    const retPct         = data ? data.returning_percent : 0;
    const avgLTV         = data ? data.avg_ltv          : 0;

    const metrics = [
        {
            label: 'Total Revenue (YTD)',
            value: fmt(totalRevenue),
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        },
        {
            label: 'Average Order Value',
            value: fmt(avgOrderValue),
            icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
        },
        {
            label: 'Top Selling Brand',
            value: topBrand,
            icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
        },
        {
            label: 'Conversion Rate',
            value: convRate + '%',
            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        },
    ];

    // Line chart data
    const lineData = {};
    for (let m = 1; m <= 12; m++) {
        lineData[m] = monthlyRevenue[m] || 0;
    }

    // Bar chart data (brands by revenue)
    const brandBarData = Object.entries(salesByBrand)
        .sort((a, b) => b[1].rev - a[1].rev)
        .slice(0, 6)
        .map(([name, s]) => ({ label: name, value: s.rev }));

    return (
        <AdminLayout>
            {/* Header */}
            <div className="admin-page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 className="admin-page-title">Professional Analytics</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.2rem', fontSize: '0.9rem' }}>
                        {data && data.order_count === 0
                            ? `No data found for ${year}`
                            : `Real sales data for ${year}`}
                    </p>
                </div>

                {/* Search icon toggle */}
                <div className="reports-search">
                    <div className={`reports-search__input-wrap${showSearch ? ' reports-search__input-wrap--visible' : ''}`}>
                        <input
                            ref={inputRef}
                            type="number"
                            value={yearInput}
                            min={2020}
                            max={currentYear}
                            onChange={e => setYearInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Year, e.g. ${currentYear - 1}`}
                        />
                    </div>
                    <button
                        className="reports-search__icon-btn"
                        onClick={toggleSearch}
                        title={showSearch ? 'Close search' : 'Search by year'}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#ef4444', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {metrics.map((m, i) => (
                    <div key={i} style={{ background: '#111827', color: '#fff', borderRadius: 12, padding: '1.5rem' }}>
                        <div style={{ color: '#C9A84C', marginBottom: '1rem' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d={m.icon} />
                            </svg>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem' }}>{m.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            {loading ? <span style={{ opacity: 0.4 }}>—</span> : m.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>

                {/* Revenue Over Time */}
                <div className="admin-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                        Revenue Over Time ({year})
                    </h3>
                    {loading ? (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading…</div>
                    ) : (
                        <>
                            <LineChart monthlyRevenue={lineData} height={180} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                {MONTH_NAMES.map(m => <span key={m}>{m}</span>)}
                            </div>
                        </>
                    )}
                </div>

                {/* Sales by Brand */}
                <div className="admin-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                        Sales by Brand ({year})
                    </h3>
                    {loading ? (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading…</div>
                    ) : (
                        <>
                            <BarChart data={brandBarData} height={160} />
                            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {brandBarData.map((d, i) => (
                                    <span key={i} style={{ fontSize: '0.7rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>
                                        {d.label}
                                    </span>
                                ))}
                                {brandBarData.length === 0 && (
                                    <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>No brand sales yet</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right column: Top Products + Customer Insights */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Top Products */}
                    <div className="admin-card" style={{ padding: '1.5rem', flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Top Products ({year})
                        </h3>
                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>Product</th>
                                    <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>Qty</th>
                                    <th style={{ paddingBottom: '0.5rem', fontWeight: 500, textAlign: 'right' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>Loading…</td></tr>
                                ) : topProducts.length === 0 ? (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>No sales data yet</td></tr>
                                ) : topProducts.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: i < topProducts.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                        <td style={{ padding: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {/* Product image */}
                                            <div style={{ width: 40, height: 40, borderRadius: 6, background: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {p.image_url
                                                    ? <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = '#d1d5db'; }} />
                                                    : <div style={{ width: 40, height: 40, background: '#d1d5db', borderRadius: 6 }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{p.name.split(' ')[0]}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#6b7280', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {p.name.split(' ').slice(1).join(' ')}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{p.qty}</td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700, color: '#C9A84C' }}>
                                            {fmt(p.rev)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Customer Insights */}
                    <div className="admin-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Customer Insights ({year})
                        </h3>
                        {loading ? (
                            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading…</div>
                        ) : data && data.order_count === 0 ? (
                            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No order data for this year</div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#6b7280' }}>Returning Customers</span>
                                    <span style={{ fontWeight: 700 }}>{retPct}%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#6b7280' }}>Average LTV</span>
                                    <span style={{ fontWeight: 700, color: '#C9A84C' }}>{fmt(avgLTV)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
