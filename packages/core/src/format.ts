/**
 * Format a price from smallest currency unit to display string.
 * e.g. formatPrice(19500, 2) → "195.00"
 */
export function formatPrice(value: number, decimals: number): string {
  return (value / Math.pow(10, decimals)).toFixed(decimals)
}

/**
 * Parse a display price string back to smallest currency unit.
 * e.g. parsePrice("195.00", 2) → 19500
 */
export function parsePrice(str: string, decimals: number): number {
  return Math.round(parseFloat(str || '0') * Math.pow(10, decimals))
}
