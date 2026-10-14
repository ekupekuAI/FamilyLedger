/** Money/date helpers. Balances are summed in integer paise so 0.1 + 0.2 never drifts. */

export function toPaise(amount: number | string | null | undefined): number {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  // toPrecision strips binary noise (1.005 * 100 = 100.4999…) before rounding.
  return Math.round(Number((n * 100).toPrecision(12)));
}

/** "₹1,234.50" — accepts rupees as stored in the DB (number or decimal string). */
export function formatINR(amount: number | string): string {
  const paise = toPaise(amount);
  const abs = (Math.abs(paise) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${paise < 0 ? '-' : ''}₹${abs}`;
}

/** Validates a typed amount: positive, at most 2 decimals, fits decimal(12, 2). */
export function parseAmount(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const n = Number(value);
  return n > 0 && n < 10_000_000_000 ? n : null;
}

/** Today as YYYY-MM-DD in the user's time zone (toISOString() would give the UTC date). */
export function localISODate(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parse a DB `date` (YYYY-MM-DD) as a local date; new Date('2026-01-05') is UTC midnight. */
export function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
