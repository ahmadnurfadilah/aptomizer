import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number using Intl.NumberFormat
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted number as string
 */
export function formatNumber(value: number | undefined | null, options: Intl.NumberFormatOptions = {}): string {
  if (value === undefined || value === null) return '—';

  // Default formatting options
  const defaultOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
  };

  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  return new Intl.NumberFormat('en-US', mergedOptions).format(value);
}

/**
 * Format currency value
 * @param value - The number to format as currency
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | undefined | null, currency: string = 'USD'): string {
  if (value === undefined || value === null) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 * @param value - The decimal value to format as percentage (e.g., 0.12 for 12%)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number | undefined | null, maximumFractionDigits: number = 2): string {
  if (value === undefined || value === null) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits,
  }).format(value);
}

/**
 * Truncates a wallet address for display purposes
 * @param address The full wallet address
 * @param startChars Number of characters to show at the start
 * @param endChars Number of characters to show at the end
 * @returns Truncated address string
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
