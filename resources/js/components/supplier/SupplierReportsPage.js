import React, { useState, useEffect } from 'react';
import { reqStore, deliveryStore } from '../sharedStore';
import { BTN } from './supplierHelpers';

export default function SupplierReportsPage({ user }) {
    const [deliveries, setDeliveries] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sync = () => {
            setDeliveries(deliveryStore.getAll().filter(d => String(d.supplier_id) === String(user?.id)));
            setRequests(reqStore.getAll().filter(r => String(r.supplier_id) === String(user?.id)));
            setLoading(false);
        };
        sync();
        window.addEventListener('jk_delivery_update', sync);
        window.addEventListener('jk_req_update', sync);
        return () => {
            window.removeEventListener('jk_delivery_update', sync);
            window.removeEventListener('jk_req_update', sync);
        };
    }, [user]);

    // ── Compute KPIs from ONLY actual completed deliveries ────────────────────
    // Require deliveredAt to be set — excludes stale/incomplete entries from all metrics
    const completedDels = deliveries.filter(d =>
        (d.status === 'delivered' || d.status === 'completed') && !!d.deliveredAt
    );
    const totalUnits = completedDels.reduce((s, d) => s + (Number(d.qty) || 0), 0);
    const totalValue = completedDels.reduce((s, d) => s + (Number(d.qty) || 0) * (Number(d.price) || 0), 0);
    const totalReqs = requests.length;
    const acceptedReqs = requests.filter(r => r.status !== 'declined').length;
    const acceptRate = totalReqs > 0 ? Math.round((acceptedReqs / totalReqs) * 100) : 0;

    // On-time = delivered within 7 days of order date (heuristic), Late = beyond 7 days, Failed = declined
    const onTime = completedDels.filter(d => {
        if (!d.deliveredAt || !d.date) return true;
        const ordered = new Date(d.date);
        const delivered = new Date(d.deliveredAt);
        return (delivered - ordered) / 86400000 <= 7;
    }).length;
    const late = completedDels.length - onTime;
    const failed = requests.filter(r => r.status === 'declined').length;
    const totalPerf = onTime + late + failed || 1;

    const fmtVal = (n) => {
        if (n >= 1000000) return '₱' + (n / 1000000).toFixed(2) + 'M';
        if (n >= 1000) return '₱' + (n / 1000).toFixed(0) + 'K';
        return '₱' + n.toLocaleString();
    };

    // ── Monthly Supply Volume ─────────────────────────────────────────────────
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { label: d.toLocaleString('en', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
    });
    const monthlyVol = months.map(m => ({
        label: m.label,
        qty: completedDels.filter(d => {
            const dt = d.deliveredAt ? new Date(d.deliveredAt) : null;
            return dt && dt.getFullYear() === m.year && dt.getMonth() === m.month;
        }).reduce((s, d) => s + (Number(d.qty) || 0), 0),
    }));
    const monthlyVal = months.map(m => ({
        label: m.label,
        val: completedDels.filter(d => {
            const dt = d.deliveredAt ? new Date(d.deliveredAt) : null;
            return dt && dt.getFullYear() === m.year && dt.getMonth() === m.month;
        }).reduce((s, d) => s + (Number(d.qty) || 0) * (Number(d.price) || 0), 0),
    }));
    const maxVol = Math.max(...monthlyVol.map(m => m.qty), 1);
    const maxVal = Math.max(...monthlyVal.map(m => m.val), 1);

    // ── Top Products ──────────────────────────────────────────────────────────
    const prodMap = {};
    completedDels.forEach(d => {
        const key = d.model || 'Unknown';
        prodMap[key] = (prodMap[key] || 0) + (Number(d.qty) || 0);
    });
    const topProducts = Object.entries(prodMap).sort(([, a], [, b]) => b - a).slice(0, 6);
    const maxProd = Math.max(...topProducts.map(([, v]) => v), 1);

    // ── Export CSV ────────────────────────────────────────────────────────────
    const exportCSV = () => {
        const rows = [
            ['Product', 'Qty', 'Unit Price', 'Total Value', 'Date Delivered'],
            ...completedDels.map(d => [d.model, d.qty, d.price, (d.qty * d.price).toFixed(2), d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : '—']),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'supplier_report.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem 1.5rem' };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading reports…</div>;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0 }}>Supplier Reports</h1>
                    <p style={{ color: '#6b7280', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>Your supply performance analytics — {now.getFullYear()}</p>
                </div>
                <button onClick={exportCSV} style={{ ...BTN.gold, padding: '0.55rem 1.3rem', borderRadius: 8, fontSize: '0.9rem' }}>
                    ⬇ Export CSV
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
                {[
                    { label: 'Total Units Supplied', value: totalUnits, icon: '📦', color: '#b08d25' },
                    { label: 'Acceptance Rate', value: acceptRate + '%', icon: '✅', color: '#10b981' },
                    { label: 'Total Supply Value', value: fmtVal(totalValue), icon: '💰', color: '#8b5cf6' },
                    { label: 'Completed Deliveries', value: completedDels.length, icon: '🚚', color: '#3b82f6' },
                ].map(k => (
                    <div key={k.label} style={{ ...cardStyle, borderTop: `3px solid ${k.color}` }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{k.icon}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{k.label}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: k.color }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

                {/* Monthly Supply Volume */}
                <div style={cardStyle}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: '1rem', fontSize: '0.95rem' }}>Monthly Supply Volume (Units)</div>
                    {completedDels.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No delivery data yet</div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 160, paddingBottom: '1.5rem', position: 'relative' }}>
                            {monthlyVol.map((m, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600 }}>{m.qty || ''}</div>
                                    <div style={{
                                        width: '100%', background: 'linear-gradient(180deg,#C9A84C,#a8873d)',
                                        borderRadius: '4px 4px 0 0',
                                        height: Math.max((m.qty / maxVol) * 120, m.qty > 0 ? 6 : 0),
                                        transition: 'height 0.3s',
                                    }} />
                                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600 }}>{m.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delivery Performance Donut */}
                <div style={cardStyle}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: '1rem', fontSize: '0.95rem' }}>Delivery Performance</div>
                    {completedDels.length === 0 && failed === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No data yet</div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            {/* Simple SVG donut */}
                            <svg width="130" height="130" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
                                {(() => {
                                    const slices = [
                                        { pct: (onTime / totalPerf) * 100, color: '#10b981' },
                                        { pct: (late / totalPerf) * 100, color: '#f59e0b' },
                                        { pct: (failed / totalPerf) * 100, color: '#ef4444' },
                                    ];
                                    let offset = 25; // start at top
                                    const r = 15.915; const circ = 2 * Math.PI * r;
                                    return slices.map((s, i) => {
                                        const dash = (s.pct / 100) * circ;
                                        const el = (
                                            <circle key={i} cx="21" cy="21" r={r}
                                                fill="none" stroke={s.color} strokeWidth="6"
                                                strokeDasharray={`${dash} ${circ - dash}`}
                                                strokeDashoffset={offset} />
                                        );
                                        offset -= dash;
                                        return el;
                                    });
                                })()}
                                <circle cx="21" cy="21" r="10" fill="#fff" />
                                <text x="21" y="22.5" textAnchor="middle" style={{ fontSize: '5px', fontWeight: 'bold', fill: '#111' }}>
                                    {onTime}
                                </text>
                                <text x="21" y="27" textAnchor="middle" style={{ fontSize: '3px', fill: '#6b7280' }}>on-time</text>
                            </svg>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {[
                                    { label: 'On-Time', val: onTime, color: '#10b981' },
                                    { label: 'Late', val: late, color: '#f59e0b' },
                                    { label: 'Failed/Declined', val: failed, color: '#ef4444' },
                                ].map(l => (
                                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                                        <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>{l.label}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 800, color: l.color }}>{l.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                {/* Top Products */}
                <div style={cardStyle}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: '1rem', fontSize: '0.95rem' }}>Top Products by Units Supplied</div>
                    {topProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No data yet</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {topProducts.map(([name, qty]) => (
                                <div key={name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#374151', fontWeight: 600, marginBottom: 3 }}>
                                        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                        <span style={{ color: '#b08d25' }}>{qty}</span>
                                    </div>
                                    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: ((qty / maxProd) * 100) + '%', background: 'linear-gradient(90deg,#C9A84C,#a8873d)', borderRadius: 4, transition: 'width 0.3s' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Monthly Supply Value */}
                <div style={cardStyle}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: '1rem', fontSize: '0.95rem' }}>Monthly Supply Value (₱)</div>
                    {completedDels.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No data yet</div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 160, paddingBottom: '1.5rem' }}>
                            {monthlyVal.map((m, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600 }}>{m.val > 0 ? fmtVal(m.val) : ''}</div>
                                    <div style={{
                                        width: '100%', background: 'linear-gradient(180deg,#8b5cf6,#6d28d9)',
                                        borderRadius: '4px 4px 0 0',
                                        height: Math.max((m.val / maxVal) * 120, m.val > 0 ? 6 : 0),
                                        transition: 'height 0.3s',
                                    }} />
                                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600 }}>{m.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
