import Decimal from 'decimal.js';

/** IPAM official 10-tier grading scale. */
export interface GradeBand {
  min: number;
  max: number;
  letter: string;
  point: number;
}

export const GRADE_BANDS: GradeBand[] = [
  { min: 70, max: 100, letter: 'A', point: 4.00 },
  { min: 65, max: 69, letter: 'B+', point: 3.75 },
  { min: 60, max: 64, letter: 'B', point: 3.25 },
  { min: 55, max: 59, letter: 'B-', point: 3.00 },
  { min: 50, max: 54, letter: 'C+', point: 2.75 },
  { min: 45, max: 49, letter: 'C', point: 2.50 },
  { min: 40, max: 44, letter: 'C-', point: 2.00 },
  { min: 35, max: 39, letter: 'D', point: 1.50 },
  { min: 30, max: 34, letter: 'E', point: 1.00 },
  { min: 0, max: 29, letter: 'F', point: 0.00 },
];

/**
 * Decimal-safe round-half-up behavior:
 * 69.50 -> 70
 * 69.49 -> 69
 * 29.50 -> 30
 * 29.40 -> 29
 */
export function roundScoreHalfUp(score: number | string | Decimal): number {
  const d = new Decimal(score);
  return d.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function scoreToGrade(score: number | string | Decimal): GradeBand {
  const rawD = new Decimal(score);
  if (rawD.isNaN()) throw new Error('Score must be a valid number');
  
  // Constrain between 0 and 100
  const clamped = Decimal.max(0, Decimal.min(100, rawD));
  const rounded = clamped.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

  const band = GRADE_BANDS.find((b) => rounded >= b.min && rounded <= b.max);
  return band ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

export function letterToPoint(letter: string): number {
  const normalized = letter.trim().toUpperCase();
  const band = GRADE_BANDS.find((b) => b.letter.toUpperCase() === normalized);
  if (!band) throw new Error(`Unknown letter grade: ${letter}`);
  return band.point;
}

