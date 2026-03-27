import React, { useState, useEffect, useRef } from 'react';
import { reqStore, deliveryStore } from '../sharedStore';
import { BTN } from './supplierHelpers';

export default function SupplierReportsPage({ user }) {
    const currentYear = new Date().getFullYear();

    const [deliveries, setDeliveries] = useState([]);
    const [requests, setRequests]     = useState([]);
    const [loading, setLoading]       = useState(true);

    // ── Year search toggle ────────────────────────────────────────────────────
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [yearInput, setYearInput]       = useState(currentYear.toString());
    const [showYearSearch, setShowYearSearch] = useState(false);
    const yearInputRef = useRef(null);

    const toggleYearSearch = () => {
        setShowYearSearch(prev => {
            if (!prev) setTimeout(() => yearInputRef.current?.focus(), 40);
            return !prev;
        });
    };

    const applyYear = () => {
        const y = parseInt(yearInput, 10);
        if (!isNaN(y) && y >= 2020 && y <= currentYear + 1) {
            setSelectedYear(y);
            setShowYearSearch(false);
        }
    };

    const handleYearKey = e => {
        if (e.key === 'Enter') applyYear();
        if (e.key === 'Escape') setShowYearSearch(false);
    };

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

    // ── Filter by selected year ───────────────────────────────────────────────
    const completedDels = deliveries.filter(d =>
        (d.status === 'delivered' || d.status === 'completed') &&
        !!d.deliveredAt &&
        new Date(d.deliveredAt).getFullYear() === selectedYear
    );
    const yearRequests = requests.filter(r => {
        const dt = r.date ? new Date(r.date) : null;
        return dt && dt.getFullYear() === selectedYear;
    });

    // ── Compute KPIs ─────────────────────────────────────────────────────────
    const totalUnits = completedDels.reduce((s, d) => s + (Number(d.qty) || 0), 0);
    const totalValue = completedDels.reduce((s, d) => s + (Number(d.qty) || 0) * (Number(d.price) || 0), 0);
    const totalReqs    = yearRequests.length;
    const acceptedReqs = yearRequests.filter(r => r.status !== 'declined').length;
    const acceptRate   = totalReqs > 0 ? Math.round((acceptedReqs / totalReqs) * 100) : 0;

    // On-time = delivered within 7 days of order date, Late = beyond 7 days, Failed = declined
    const onTime = completedDels.filter(d => {
        if (!d.deliveredAt || !d.date) return true;
        return (new Date(d.deliveredAt) - new Date(d.date)) / 86400000 <= 7;
    }).length;
    const late   = completedDels.length - onTime;
    const failed = yearRequests.filter(r => r.status === 'declined').length;
    const totalPerf = onTime + late + failed || 1;

    const fmtVal = (n) => {
        if (n >= 1000000) return '₱' + (n / 1000000).toFixed(2) + 'M';
        if (n >= 1000)    return '₱' + (n / 1000).toFixed(0) + 'K';
        return '₱' + n.toLocaleString();
    };

    const hasAnyData = completedDels.length > 0 || yearRequests.length > 0;

    // ── Monthly Supply Volume (all 12 months of selected year) ───────────────
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyVol = MONTHS.map((label, idx) => ({
        label,
        qty: completedDels.filter(d => {
            const dt = d.deliveredAt ? new Date(d.deliveredAt) : null;
            return dt && dt.getMonth() === idx;
        }).reduce((s, d) => s + (Number(d.qty) || 0), 0),
    }));
    const monthlyVal = MONTHS.map((label, idx) => ({
        label,
        val: completedDels.filter(d => {
            const dt = d.deliveredAt ? new Date(d.deliveredAt) : null;
            return dt && dt.getMonth() === idx;
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
        a.href = url; a.download = `supplier_report_${selectedYear}.csv`; a.click();
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
                    <p style={{ color: '#6b7280', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
                        Your supply performance analytics — <strong style={{ color: '#b08d25' }}>{selectedYear}</strong>
                    </p>
                </div>
                {/* Right controls: year search + export */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexDirection: 'row-reverse' }}>
                    {/* Export */}
                    <button onClick={exportCSV} style={{ ...BTN.gold, padding: '0.55rem 1.3rem', borderRadius: 8, fontSize: '0.9rem' }}>
                        ⬇ Export CSV
                    </button>
                    {/* Year search icon toggle */}
                    <button
                        onClick={toggleYearSearch}
                        title={showYearSearch ? 'Close year search' : 'Search by year'}
                        style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: '#C9A84C', color: '#111827',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'background 0.2s, transform 0.2s',
                            boxShadow: showYearSearch ? '0 0 0 3px rgba(201,168,76,0.3)' : 'none',
                        }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                    {/* Slide-in year input */}
                    <div style={{
                        overflow: 'hidden',
                        maxWidth: showYearSearch ? 160 : 0,
                        opacity: showYearSearch ? 1 : 0,
                        transition: 'max-width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
                    }}>
                        <input
                            ref={yearInputRef}
                            type="number"
                            value={yearInput}
                            min={2020}
                            max={currentYear + 1}
                            onChange={e => setYearInput(e.target.value)}
                            onKeyDown={handleYearKey}
                            placeholder={`e.g. ${currentYear}`}
                            style={{
                                background: '#1f2937', color: '#f9fafb',
                                border: '1px solid #374151', borderRadius: 6,
                                padding: '0.48rem 0.85rem', fontSize: '0.85rem',
                                width: 140, outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                            onBlur={e  => (e.target.style.borderColor = '#374151')}
                        />
                    </div>
                </div>
            </div>

            {/* No-data state for selected year */}
            {!hasAnyData ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>No data for {selectedYear}</div>
                    <div style={{ fontSize: '0.88rem' }}>No deliveries or requests were found for this year. Try another year using the 🔍 search above.</div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
                        {[
                            { label: 'Total Units Supplied',  value: totalUnits,              icon: '📦', color: '#b08d25' },
                            { label: 'Acceptance Rate',       value: acceptRate + '%',         icon: '✅', color: '#10b981' },
                            { label: 'Total Supply Value',    value: fmtVal(totalValue),       icon: '💰', color: '#8b5cf6' },
                            { label: 'Completed Deliveries',  value: completedDels.length,     icon: '🚚', color: '#3b82f6' },
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
                            <div style={{ fontWeight: 700, color: '#111827', marginBottom: '1rem', fontSize: '0.95rem' }}>Monthly Supply Volume — {selectedYear} (Units)</div>
                            {completedDels.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No delivery data for {selectedYear}</div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', height: 160, paddingBottom: '1.5rem', position: 'relative' }}>
                                    {monthlyVol.map((m, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600 }}>{m.qty || ''}</div>
                                            <div style={{
                                                width: '100%', background: 'linear-gradient(180deg,#C9A84C,#a8873d)',
                                                borderRadius: '4px 4px 0 0',
                                                height: Math.max((m.qty / maxVol) * 120, m.qty > 0 ? 6 : 0),
                                                transition: 'height 0.3s',
                                            }} />
                                            <div style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 600 }}>{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delivery Performance Donut */}
                        <div style={cardStyle}>
                            <div style={{ fontWeight: 700, color: '#111827', marginBottom: '1rem', fontSize: '0.95rem' }}>Delivery Performance — {selectedYear}</div>
                            {completedDels.length === 0 && failed === 0 ? (
                                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No data for {selectedYear}</div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                    <svg width="130" height="130" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
                                        {(() => {
                                            const slices = [
                                                { pct: (onTime / totalPerf) * 100, color: '#10b981' },
                                                { pct: (late / totalPerf) * 100, color: '#f59e0b' },
                                                { pct: (failed / totalPerf) * 100, color: '#ef4444' },
                                            ];
                                            let offset = 25;
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
                                        <text x="21" y="22.5" textAnchor="middle" style={{ fontSize: '5px', fontWeight: 'bold', fill: '#111' }}>{onTime}</text>
                                        <text x="21" y="27" textAnchor="middle" style={{ fontSize: '3px', fill: '#6b7280' }}>on-time</text>
                                    </svg>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {[
                                            { label: 'On-Time',       val: onTime, color: '#10b981' },
                                            { label: 'Late',           val: late,   color: '#f59e0b' },
                                            { label: 'Failed/Declined',val: failed, color: '#ef4444' },
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
                                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No data for {selectedYear}</div>
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
                            <div style={{ fontWeight: 700, color: '#111827', marginBottom: '1rem', fontSize: '0.95rem' }}>Monthly Supply Value — {selectedYear} (₱)</div>
                            {completedDels.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No data for {selectedYear}</div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', height: 160, paddingBottom: '1.5rem' }}>
                                    {monthlyVal.map((m, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ fontSize: '0.55rem', color: '#6b7280', fontWeight: 600 }}>{m.val > 0 ? fmtVal(m.val) : ''}</div>
                                            <div style={{
                                                width: '100%', background: 'linear-gradient(180deg,#8b5cf6,#6d28d9)',
                                                borderRadius: '4px 4px 0 0',
                                                height: Math.max((m.val / maxVal) * 120, m.val > 0 ? 6 : 0),
                                                transition: 'height 0.3s',
                                            }} />
                                            <div style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 600 }}>{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
