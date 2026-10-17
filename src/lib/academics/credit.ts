import Decimal from 'decimal.js';

/** Credit formatting: always one decimal place (e.g., 3.0, 12.0, 15.0). */
export function formatCredits(credits: number | string | Decimal): string {
  const d = new Decimal(credits ?? 0);
  return d.toFixed(1);
}

/** Format GPA/CGPA: always two decimal places (e.g., 3.35, 3.50, 4.00). */
export function formatGPA(gpa: number | string | Decimal): string {
  const d = new Decimal(gpa ?? 0);
  return d.toFixed(2);
}

export function parseCredits(value: string | number): number {
  const d = new Decimal(value);
  if (d.isNaN() || d.isNegative()) throw new Error('Invalid credits');
  return d.toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber();
}

