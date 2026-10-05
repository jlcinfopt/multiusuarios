import { Business } from '../types';

/**
 * Format currency dynamically based on Business country or currency
 * Supports Portugal (EUR €) and Brasil (BRL R$)
 */
export function formatMoney(amount: number | string | undefined, business?: Partial<Business> | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount || 0;
  const isBrazil = business?.country === 'BR' || business?.currency === 'BRL';

  if (isBrazil) {
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }

  // Default: Portugal / Euro
  // If whole number, format like 15€, if decimal format 15.50€
  return num % 1 === 0 ? `${num}€` : `${num.toFixed(2)}€`;
}

/**
 * Currency symbol: '€' or 'R$'
 */
export function getCurrencySymbol(business?: Partial<Business> | null): string {
  const isBrazil = business?.country === 'BR' || business?.currency === 'BRL';
  return isBrazil ? 'R$' : '€';
}

/**
 * Country label helper
 */
export function getCountryDetails(countryCode?: 'PT' | 'BR') {
  if (countryCode === 'BR') {
    return {
      name: 'Brasil',
      flag: '🇧🇷',
      currency: 'BRL',
      symbol: 'R$',
      phonePrefix: '+55',
      paymentMethodName: 'PIX',
    };
  }
  return {
    name: 'Portugal',
    flag: '🇵🇹',
    currency: 'EUR',
    symbol: '€',
    phonePrefix: '+351',
    paymentMethodName: 'MB WAY',
  };
}
