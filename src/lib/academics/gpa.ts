import Decimal from 'decimal.js';
import { formatCredits } from './credit';
import { scoreToGrade, letterToPoint, roundScoreHalfUp } from './grading';

export interface AttemptInput {
  credits: number | string;
  letter?: string;
  totalScore?: number;
  ca?: number;
  exam?: number;
}

export interface AttemptResult {
  credits: string;
  creditHours: number;
  letter: string;
  gradePoint: number;
  qualityPoints: number;
  rawTotal?: number;
  roundedTotal?: number;
}

/**
 * Total = (CA * 0.30) + (Exam * 0.70).
 * Round half-up to nearest integer, preserving the raw decimal score for audit.
 */
export function computeTotal(ca: number, exam: number): { raw: number; rounded: number } {
  const caD = new Decimal(ca);
  const examD = new Decimal(exam);
  if (caD.isNaN() || caD.isNegative() || caD.greaterThan(100)) {
    throw new Error('Continuous Assessment score must be between 0 and 100');
  }
  if (examD.isNaN() || examD.isNegative() || examD.greaterThan(100)) {
    throw new Error('Examination score must be between 0 and 100');
  }

  const rawD = caD.times(0.3).plus(examD.times(0.7));
  const rounded = roundScoreHalfUp(rawD);
  return {
    raw: rawD.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    rounded,
  };
}

/**
 * Precedence: Direct Letter Grade -> Direct Total Score -> CA + Exam.
 */
export function resolveAttempt(input: AttemptInput): AttemptResult {
  const creditsD = new Decimal(input.credits);
  if (creditsD.isNaN() || creditsD.isNegative()) {
    throw new Error('Invalid credit hours');
  }

  let letter: string;
  let point: number;
  let rawTotal: number | undefined;
  let roundedTotal: number | undefined;

  if (input.letter && input.letter.trim().length > 0) {
    letter = input.letter.trim().toUpperCase();
    point = letterToPoint(letter);
  } else if (typeof input.totalScore === 'number' && !Number.isNaN(input.totalScore)) {
    rawTotal = input.totalScore;
    roundedTotal = roundScoreHalfUp(rawTotal);
    const band = scoreToGrade(roundedTotal);
    letter = band.letter;
    point = band.point;
  } else if (typeof input.ca === 'number' && typeof input.exam === 'number') {
    const computed = computeTotal(input.ca, input.exam);
    rawTotal = computed.raw;
    roundedTotal = computed.rounded;
    const band = scoreToGrade(roundedTotal);
    letter = band.letter;
    point = band.point;
  } else {
    throw new Error('Provide a direct letter grade, direct total score, or CA + Exam scores');
  }

  // Quality Points = Credit Hours * Grade Point
  const pointD = new Decimal(point);
  const qpD = creditsD.times(pointD);

  return {
    credits: formatCredits(creditsD),
    creditHours: creditsD.toNumber(),
    letter,
    gradePoint: point,
    qualityPoints: qpD.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    rawTotal,
    roundedTotal,
  };
}

/**
 * Semester GPA:
 * GPA = Total Semester Quality Points / Total Semester Credits.
 * Decimal-safe round-half-up to 2 decimal places.
 */
export function calculateGPA(attempts: (AttemptResult | { credits: string | number; gradePoint?: number; qualityPoints?: number })[]): number {
  let totalCredits = new Decimal(0);
  let totalQualityPoints = new Decimal(0);

  for (const a of attempts) {
    const cr = new Decimal(a.credits);
    if (cr.isZero() || cr.isNegative()) continue;

    let qp: Decimal;
    if (typeof a.qualityPoints === 'number' && !Number.isNaN(a.qualityPoints)) {
      qp = new Decimal(a.qualityPoints);
    } else if (typeof a.gradePoint === 'number' && !Number.isNaN(a.gradePoint)) {
      qp = cr.times(new Decimal(a.gradePoint));
    } else {
      continue;
    }

    totalCredits = totalCredits.plus(cr);
    totalQualityPoints = totalQualityPoints.plus(qp);
  }

  if (totalCredits.isZero()) return 0;

  return totalQualityPoints.dividedBy(totalCredits).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Cumulative CGPA:
 * CGPA = Total Cumulative Quality Points / Total Cumulative Credits.
 * Aggregates credit-weighted quality points across all applicable semesters.
 */
export function calculateCGPA(attempts: (AttemptResult | { credits: string | number; gradePoint?: number; qualityPoints?: number })[]): number {
  return calculateGPA(attempts);
}

