export const getSuppToken = () =>
    localStorage.getItem('supplier_token') || localStorage.getItem('admin_token') || localStorage.getItem('jk_token');

export const suppHead = () => ({ headers: { Authorization: "Bearer " + getSuppToken(), 'Accept': 'application/json' } });

export const IMG_BASE = '/storage/';

export const BTN = {
    gold: { background: 'linear-gradient(135deg,#C9A84C,#a8873d)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' },
    green: { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' },
    red: { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' },
};

export const INV_MODAL = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    box: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    hdr: { padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', borderRadius: '16px 16px 0 0' },
    title: { margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#111827' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#ef4444', padding: 0, fontWeight: 700 },
    lbl: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.35rem' },
    inp: { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', color: '#1f2937', outline: 'none', transition: 'border-color 0.2s' },
    errBox: { background: '#fee2e2', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 },
    cancelBtn: { padding: '0.6rem 1.2rem', borderRadius: 8, background: '#fff', color: '#ef4444', border: '1px solid #f87171', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' },
    saveBtn: { padding: '0.6rem 1.2rem', borderRadius: 8, background: 'linear-gradient(135deg,#C9A84C,#a8873d)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
};
