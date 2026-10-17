import Decimal from 'decimal.js';

export type AwardType = 'honours' | 'general' | 'diploma' | 'certificate';

/**
 * University of Sierra Leone / IPAM Degree Classification Policy.
 * Thresholds use two-decimal half-up rounding comparisons.
 */
export function getClassification(cgpa: number | string | Decimal, award: AwardType = 'honours'): string {
  const d = new Decimal(cgpa).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const val = d.toNumber();

  if (award === 'honours') {
    if (val >= 3.50) return 'First Class';
    if (val >= 3.00) return 'Second Class, First Division';
    if (val >= 2.60) return 'Second Class, Second Division';
    if (val >= 2.00) return 'Third Class';
    if (val >= 1.50) return 'Pass';
    return 'Fail';
  }

  if (award === 'general') {
    if (val >= 3.20) return 'Division One';
    if (val >= 2.60) return 'Division Two';
    if (val >= 1.50) return 'Division Three';
    return 'Fail';
  }

  // Diploma or Certificate
  if (val >= 3.20) return 'Distinction';
  if (val >= 2.60) return 'Credit';
  if (val >= 1.50) return 'Pass';
  return 'Fail';
}

