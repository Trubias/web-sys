import { useState, useEffect } from 'react';

// Get current setting, defaults to PHP
export const getCurrencySettings = () => {
    return localStorage.getItem('admin_currency') || 'PHP';
};

// Update setting and trigger global re-render
export const setCurrencySettings = (c) => {
    localStorage.setItem('admin_currency', c);
    window.dispatchEvent(new Event('currency_update'));
};

// React hook to auto-update components when currency changes
export const useCurrency = () => {
    const [currency, setCurrency] = useState(getCurrencySettings());
    
    useEffect(() => {
        const handleUpdate = () => setCurrency(getCurrencySettings());
        window.addEventListener('currency_update', handleUpdate);
        return () => window.removeEventListener('currency_update', handleUpdate);
    }, []);
    
    return currency;
};

// Standard exchange rates relative to PHP base
const RATES = {
    PHP: 1,
    USD: 0.017,
    EUR: 0.016
};

const SYMBOLS = {
    PHP: '₱',
    USD: '$',
    EUR: '€'
};

const LOCALES = {
    PHP: 'en-PH',
    USD: 'en-US',
    EUR: 'de-DE'
};

// Global format function
// amountInPhp must be the raw base price stored in database (which is assumed PHP)
export const formatCurrency = (amountInPhp, currencyCode = null) => {
    let code = currencyCode || getCurrencySettings();
    let rate = RATES[code];
    let sym = SYMBOLS[code];
    let loc = LOCALES[code];
    
    // Failsafe: if rate/conversion fails, default to original PHP
    if (!rate || isNaN(rate) || rate <= 0) {
        code = 'PHP';
        rate = 1;
        sym = '₱';
        loc = 'en-PH';
    }
    
    const converted = Number(amountInPhp || 0) * rate;
    
    // Check if it's a whole number to decide on decimal places
    const isWhole = converted % 1 === 0;
    const formatted = converted.toLocaleString(loc, { 
        minimumFractionDigits: isWhole ? 0 : 2, 
        maximumFractionDigits: 2 
    });
    
    return `${sym}${formatted}`;
};
