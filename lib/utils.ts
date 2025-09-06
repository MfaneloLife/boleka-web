/**
 * Format a date string to a more readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a number as South African Rand currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate text to a specific length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Calculate commission amount based on a percentage
 */
export function calculateCommission(amount: number, rate: number = 0.05): number {
  return Number((amount * rate).toFixed(2));
}

/**
 * Generate a random ID (useful for temporary IDs in forms)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Safely access nested object properties
 */
export function getNestedValue<T>(obj: Record<string, unknown>, path: string, defaultValue: T | null = null): T | null {
  const keys = path.split('.');
  try {
    let current: unknown = obj;
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') return defaultValue;
      current = (current as Record<string, unknown>)[key];
    }
  return current === undefined ? defaultValue : (current as T);
  } catch (_) {
    return defaultValue;
  }
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
