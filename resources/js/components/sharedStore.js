// ─── Shared LocalStorage State for Demo purposes ────────────────────────

export const REQ_STORE_KEY       = 'jk_product_requests';
export const DEL_STORE_KEY       = 'jk_deliveries';
export const NOTIF_STORE_KEY     = 'jk_notifications';
export const INV_STORE_KEY       = 'jk_inventory';
export const PROD_MGMT_STORE_KEY = 'jk_product_mgmt';
export const SUPP_STOCK_KEY      = 'jk_supplier_stock';

// Mock initial data if empty
const initialRequests = [];


export const reqStore = {
    getAll: () => {
        try { 
            const d = JSON.parse(localStorage.getItem(REQ_STORE_KEY)); 
            if (d && d.length > 0) return d;
        } catch {}
        // Initialize if empty
        localStorage.setItem(REQ_STORE_KEY, JSON.stringify(initialRequests));
        return initialRequests;
    },
    save: (items) => { 
        localStorage.setItem(REQ_STORE_KEY, JSON.stringify(items)); 
        window.dispatchEvent(new Event('jk_req_update')); 
    },
    add: (d) => { 
        const all = reqStore.getAll(); 
        all.unshift(d); 
        reqStore.save(all); 
    },
    update: (id, patch) => { 
        const all = reqStore.getAll().map(d => d.id === id ? { ...d, ...patch } : d); 
        reqStore.save(all); 
    },
};

export const deliveryStore = {
    getAll: () => { 
        try { return JSON.parse(localStorage.getItem(DEL_STORE_KEY) || '[]'); } catch { return []; } 
    },
    save: (items) => { 
        localStorage.setItem(DEL_STORE_KEY, JSON.stringify(items)); 
        window.dispatchEvent(new Event('jk_delivery_update')); 
    },
    add: (d) => { 
        const all = deliveryStore.getAll(); 
        all.unshift(d); 
        deliveryStore.save(all); 
    },
    update: (id, patch) => { 
        const all = deliveryStore.getAll().map(d => String(d.id) === String(id) ? { ...d, ...patch } : d); 
        deliveryStore.save(all); 
    },
};

export const inventoryStore = {
    getAll: () => { 
        try { return JSON.parse(localStorage.getItem(INV_STORE_KEY) || '[]'); } catch { return []; } 
    },
    save: (items) => { 
        localStorage.setItem(INV_STORE_KEY, JSON.stringify(items)); 
        window.dispatchEvent(new Event('jk_inventory_update')); 
    },
    add: (d) => { 
        const all = inventoryStore.getAll();
        if (!all.find(x => String(x.id) === String(d.id))) {
            all.unshift(d); 
            inventoryStore.save(all); 
        }
    },
    update: (id, patch) => { 
        const all = inventoryStore.getAll().map(d => String(d.id) === String(id) ? { ...d, ...patch } : d); 
        inventoryStore.save(all); 
    },
    delete: (id) => {
        const all = inventoryStore.getAll().filter(d => String(d.id) !== String(id));
        inventoryStore.save(all);
    }
};

export const notificationStore = {
    getAll: () => {
        try { return JSON.parse(localStorage.getItem(NOTIF_STORE_KEY) || '[]'); } catch { return []; }
    },
    save: (items) => {
        localStorage.setItem(NOTIF_STORE_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event('jk_notification_update'));
    },
    add: (target, message) => {
        // target: 'admin' or dynamically a supplier's company name/id
        const all = notificationStore.getAll();
        all.unshift({
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            target, message, date: new Date().toISOString(), read: false
        });
        notificationStore.save(all);
    },
    markRead: (id) => {
        const all = notificationStore.getAll().map(n => n.id === id ? { ...n, read: true } : n);
        notificationStore.save(all);
    },
    clearAll: (target) => {
        const all = notificationStore.getAll().filter(n => n.target !== target);
        notificationStore.save(all);
    }
};

// ─── Product Management Store (Admin-ordered products pending placement) ──────
// Each entry: { id (unique), productId (supplier product id), name, brand, category,
//               supplier, price, stock (=qty ordered), image }
export const productMgmtStore = {
    getAll: () => {
        try { return JSON.parse(localStorage.getItem(PROD_MGMT_STORE_KEY) || '[]'); } catch { return []; }
    },
    save: (items) => {
        localStorage.setItem(PROD_MGMT_STORE_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event('jk_product_mgmt_update'));
    },
    add: (d) => {
        const all = productMgmtStore.getAll();
        all.unshift(d);
        productMgmtStore.save(all);
    },
    delete: (id) => {
        const all = productMgmtStore.getAll().filter(d => String(d.id) !== String(id));
        productMgmtStore.save(all);
    },
};

// ─── Supplier Stock Deduction Store ──────────────────────────────────────────
// Each entry: { productId, deducted } (accumulated deductions per supplier product)
export const supplierStockStore = {
    getAll: () => {
        try { return JSON.parse(localStorage.getItem(SUPP_STOCK_KEY) || '[]'); } catch { return []; }
    },
    save: (items) => {
        localStorage.setItem(SUPP_STOCK_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event('jk_supplier_stock_update'));
    },
    deduct: (productId, qty) => {
        const all = supplierStockStore.getAll();
        const idx = all.findIndex(d => String(d.productId) === String(productId));
        if (idx >= 0) {
            all[idx] = { ...all[idx], deducted: all[idx].deducted + qty };
        } else {
            all.push({ productId: String(productId), deducted: qty });
        }
        supplierStockStore.save(all);
    },
    getDeducted: (productId) => {
        const d = supplierStockStore.getAll().find(x => String(x.productId) === String(productId));
        return d ? d.deducted : 0;
    },
};
