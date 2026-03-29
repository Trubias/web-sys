import React, { useState, useEffect } from 'react';
import { reqStore, deliveryStore, notificationStore } from '../sharedStore';
import { BTN, INV_MODAL, suppHead } from './supplierHelpers';
import axios from 'axios';

function StatCard({ title, val, icon, color, bg }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 150, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: color }}>{val}</div>
            </div>
        </div>
    );
}

function Stepper({ status, expectedDeliveryDate }) {
    const steps = ['Request Placed', 'Accepted', 'Preparing', 'Transporting', 'Delivered'];

    let currentIndex = 0;
    if (status === 'accepted') currentIndex = 1;
    if (status === 'preparing') currentIndex = 2;
    if (status === 'transporting') currentIndex = 3;
    if (status === 'completed' || status === 'delivered') currentIndex = 4;

    const fmtExpected = expectedDeliveryDate
        ? new Date(expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2.5rem', position: 'relative', width: '90%', margin: '2.5rem auto 1rem auto' }}>
            <div style={{ position: 'absolute', top: 11, left: '0%', right: '0%', height: 3, background: '#f3f4f6', zIndex: 0 }}>
                <div style={{ height: '100%', background: '#dca54c', width: ((currentIndex / 4) * 100) + '%', transition: 'width 0.3s ease' }} />
            </div>

            {steps.map((step, idx) => {
                const isCompleted = idx <= currentIndex;
                const isCurrent = idx === currentIndex;
                const isTransportingStep = idx === 3;
                return (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: 90, position: 'relative' }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: isCompleted ? '#dca54c' : '#f3f4f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '12px', fontWeight: 'bold', marginBottom: 8,
                            boxShadow: isCompleted ? '0 0 0 4px #fef08a' : '0 0 0 4px #fff'
                        }}>
                            {isCompleted && '✓'}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 800 : 700, color: isCompleted ? '#dca54c' : '#9ca3af', textAlign: 'center', position: 'absolute', top: 35, width: 120 }}>
                            {step}
                            {isTransportingStep && fmtExpected && (
                                <div style={{ fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap' }}>
                                    📅 {fmtExpected}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SetDeliveryDateModal({ delivery, onConfirm, onCancel }) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const [selectedDate, setSelectedDate] = useState(tomorrowStr);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!selectedDate) { setError('Please select an expected delivery date.'); return; }
        if (selectedDate < todayStr) { setError('Delivery date cannot be in the past. Please select today or a future date.'); return; }
        onConfirm(selectedDate);
    };

    return (
        <div style={INV_MODAL.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
            <div style={{ ...INV_MODAL.box, maxWidth: 440 }}>
                <div style={INV_MODAL.hdr}>
                    <h2 style={INV_MODAL.title}>🚚 Set Delivery Date</h2>
                    <button style={INV_MODAL.closeBtn} onClick={onCancel}>✕</button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Please set the expected delivery date for this shipment before marking it as Transporting.
                    </p>
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.9rem 1.1rem', marginBottom: '1.25rem' }}>
                        <div style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>{delivery.model} ×{delivery.qty}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3 }}>Ref: {delivery.ref}</div>
                    </div>
                    {error && <div style={INV_MODAL.errBox}>{error}</div>}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ ...INV_MODAL.lbl, fontSize: '0.85rem' }}>Expected Delivery Date *</label>
                        <input
                            type="date"
                            value={selectedDate}
                            min={todayStr}
                            onChange={e => { setSelectedDate(e.target.value); setError(''); }}
                            style={{ ...INV_MODAL.inp, fontFamily: 'inherit', fontSize: '0.95rem', padding: '0.7rem 1rem', cursor: 'pointer' }}
                        />
                        <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: '0.4rem' }}>
                            Past dates are not allowed.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" style={INV_MODAL.cancelBtn} onClick={onCancel}>Cancel</button>
                        <button type="button" onClick={handleConfirm} style={{ ...INV_MODAL.saveBtn, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            🚚 Confirm & Mark as Transporting
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DeliveriesPage({ user }) {
    const [deliveries, setDeliveries] = useState([]);
    const [proofFiles, setProofFiles] = useState({});
    const [tab, setTab] = useState('active'); // 'active' | 'archive'
    const [transportingTarget, setTransportingTarget] = useState(null);

    useEffect(() => {
        const sync = () => setDeliveries([...deliveryStore.getAll()].filter(d => String(d.supplier_id) === String(user?.id)).reverse());
        sync();
        window.addEventListener('jk_delivery_update', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('jk_delivery_update', sync);
            window.removeEventListener('storage', sync);
        };
    }, [user]);

    const actions = {
        markPreparing: (d) => {
            reqStore.update(d.reqId, { status: 'preparing' });
            deliveryStore.update(d.id, { status: 'preparing' });
            notificationStore.add('admin', `Your order ${d.ref} is now being prepared.`);
        },
        openTransportingModal: (d) => setTransportingTarget(d),
        confirmTransporting: (d, expectedDate) => {
            const supplierName = user?.name || user?.company_name || 'The Supplier';
            const fmtDate = new Date(expectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            reqStore.update(d.reqId, { status: 'transporting', expectedDeliveryDate: expectedDate });
            deliveryStore.update(d.id, { status: 'transporting', expectedDeliveryDate: expectedDate });
            notificationStore.add(
                'admin',
                `Supplier ${supplierName} has marked ${d.model} x${d.qty} (Ref: ${d.ref}) as Transporting. Expected delivery date: ${fmtDate}.`
            );
            setTransportingTarget(null);
        },
        handleProofUpload: (id, file) => {
            if (file) {
                const url = URL.createObjectURL(file);
                setProofFiles(p => ({ ...p, [id]: url }));
            }
        },
        markDelivered: async (d) => {
            if (!proofFiles[d.id] && !d.proof) return;
            const now = new Date().toISOString();
            
            if (d.stock_deducted) {
                reqStore.update(d.reqId, { status: 'completed', deliveredAt: now });
                deliveryStore.update(d.id, { status: 'delivered', proof: proofFiles[d.id] || d.proof, deliveredAt: now });
                notificationStore.add('admin', `Your order ${d.ref} has been successfully delivered. You can now place it in Inventory.`);
                return;
            }

            try {
                if (d.product_id && d.qty) {
                    await axios.put(`/api/supplier-products/${d.product_id}/deduct`, {
                        quantity: Number(d.qty)
                    }, suppHead());
                    window.dispatchEvent(new Event('jk_supplier_stock_update'));
                }
            } catch (err) {
                console.error("Failed to deduct stock:", err);
            }

            reqStore.update(d.reqId, { status: 'completed', deliveredAt: now });
            deliveryStore.update(d.id, { status: 'delivered', proof: proofFiles[d.id] || d.proof, deliveredAt: now, stock_deducted: true });
            notificationStore.add('admin', `Your order ${d.ref} has been successfully delivered. You can now place it in Inventory.`);
        }
    };

    // Active = not yet delivered. Archive = delivered or completed.
    const activeDeliveries = deliveries.filter(d => d.status !== 'delivered' && d.status !== 'completed');
    const archiveDeliveries = deliveries.filter(d => d.status === 'delivered' || d.status === 'completed');
    const displayedDeliveries = tab === 'active' ? activeDeliveries : archiveDeliveries;

    const counts = {
        accepted: activeDeliveries.filter(d => d.status === 'accepted' || d.status === 'preparing').length,
        transporting: activeDeliveries.filter(d => d.status === 'transporting').length,
        delivered: archiveDeliveries.length,
    };

    const tabStyle = (active) => ({
        padding: '0.45rem 1.2rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem',
        border: 'none', cursor: 'pointer',
        background: active ? '#111827' : '#f3f4f6',
        color: active ? '#C9A84C' : '#6b7280',
        transition: 'all 0.15s',
    });

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0 }}>Delivery Management</h1>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Track orders from Acceptance to Final Delivery</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button style={tabStyle(tab === 'active')} onClick={() => setTab('active')}>
                        Active Deliveries {tab === 'active' && activeDeliveries.length > 0 ? `(${activeDeliveries.length})` : ''}
                    </button>
                    <button style={tabStyle(tab === 'archive')} onClick={() => setTab('archive')}>
                        🗂 Archive {archiveDeliveries.length > 0 ? `(${archiveDeliveries.length})` : ''}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard title="To Fulfill" val={counts.accepted} icon="⚙️" color="#3b82f6" bg="#eff6ff" />
                <StatCard title="Transporting" val={counts.transporting} icon="🚚" color="#8b5cf6" bg="#f3e8ff" />
                <StatCard title="Delivered (Archived)" val={counts.delivered} icon="✅" color="#10b981" bg="#d1fae5" />
            </div>

            {displayedDeliveries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    {tab === 'archive' ? '🗂 No archived (delivered) deliveries yet.' : 'No active deliveries yet.'}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {displayedDeliveries.map(d => {
                    const hasProof = !!proofFiles[d.id] || !!d.proof;
                    const isArchived = d.status === 'delivered' || d.status === 'completed';
                    return (
                        <div key={d.id} style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: `1px solid ${isArchived ? '#a7f3d0' : '#e5e7eb'}`, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#b08d25', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '0.8rem', color: '#6b7280', borderLeft: '1px solid #d1d5db', paddingLeft: '0.5rem' }}>Ref: <strong style={{ color: '#27272a' }}>{d.ref}</strong></span>
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                                        {d.model} <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '1rem' }}>×{d.qty}</span>
                                    </h3>
                                    <div style={{ color: '#6b7280', fontSize: '0.85rem', display: 'flex', gap: 12, alignItems: 'center', fontWeight: 500, flexWrap: 'wrap' }}>
                                        <span>🏷️ {d.brand}</span>
                                        <span style={{ color: '#dca54c' }}>📁 {d.category}</span>
                                        <span>₱{Number(d.price).toLocaleString()} total</span>
                                        <span style={{ color: '#3b82f6' }}>💳 {d.payment}</span>
                                        {d.expectedDeliveryDate && (
                                            <span style={{ color: '#8b5cf6', fontWeight: 700 }}>
                                                📅 Expected: {new Date(d.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                        {isArchived && d.deliveredAt && (
                                            <span style={{ color: '#10b981', fontWeight: 700 }}>✅ Delivered: {new Date(d.deliveredAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 150 }}>
                                    {!isArchived && (
                                        <>
                                            {d.status === 'accepted' && (
                                                <button onClick={() => actions.markPreparing(d)} style={{ ...BTN.gold, padding: '0.5rem 1.2rem', fontSize: '0.85rem', borderRadius: 8, width: '100%' }}>Mark as Preparing</button>
                                            )}
                                            {d.status === 'preparing' && (
                                                <button onClick={() => actions.openTransportingModal(d)} style={{ ...BTN.gold, padding: '0.5rem 1.2rem', fontSize: '0.85rem', borderRadius: 8, width: '100%' }}>Mark as Transporting</button>
                                            )}
                                            {d.status === 'transporting' && (
                                                <>
                                                    <button
                                                        onClick={() => actions.markDelivered(d)}
                                                        disabled={!hasProof}
                                                        style={{ ...BTN.green, background: hasProof ? '#dca54c' : '#e5e7eb', color: hasProof ? '#fff' : '#9ca3af', border: 'none', padding: '0.5rem 1.2rem', fontSize: '0.85rem', borderRadius: 8, fontWeight: 700, width: '100%', cursor: hasProof ? 'pointer' : 'not-allowed' }}>
                                                        ✓ Mark Delivered
                                                    </button>
                                                    <label style={{ display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', background: '#f3e8ff', color: '#7c3aed', padding: '0.4rem 0', fontSize: '0.8rem', borderRadius: 8, fontWeight: 700, boxSizing: 'border-box' }}>
                                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => actions.handleProofUpload(d.id, e.target.files[0])} />
                                                        {hasProof ? '📎 Proof Attached' : '📷 Upload Proof'}
                                                    </label>
                                                </>
                                            )}
                                        </>
                                    )}
                                    {isArchived && (d.proof || proofFiles[d.id]) && (
                                        <a href={d.proof || proofFiles[d.id]} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6', textDecoration: 'underline' }}>View Proof of Delivery</a>
                                    )}
                                    {isArchived && (
                                        <span style={{ fontSize: '0.78rem', background: '#d1fae5', color: '#065f46', padding: '0.25rem 0.75rem', borderRadius: 20, fontWeight: 700 }}>Archived ✅</span>
                                    )}
                                </div>
                            </div>

                            <Stepper status={d.status} expectedDeliveryDate={d.expectedDeliveryDate} />
                        </div>
                    );
                })}
            </div>

            {/* ── Set Delivery Date Modal ── */}
            {transportingTarget && (
                <SetDeliveryDateModal
                    delivery={transportingTarget}
                    onConfirm={(date) => actions.confirmTransporting(transportingTarget, date)}
                    onCancel={() => setTransportingTarget(null)}
                />
            )}
        </div>
    );
}
