import { formatCredits } from './credit';
import { scoreToGrade, letterToPoint } from './grading';

export interface AttemptInput {
  credits: number;
  letter?: string;
  totalScore?: number;
  ca?: number;
  exam?: number;
}

export interface AttemptResult {
  credits: string;
  letter: string;
  gradePoint: number;
  qualityPoints: number;
  rawTotal?: number;
  roundedTotal?: number;
}

/** Total = CA*0.30 + Exam*0.70. Round half up to nearest integer. Keep raw for audit. */
export function computeTotal(ca: number, exam: number): { raw: number; rounded: number } {
  const raw = ca * 0.3 + exam * 0.7;
  const rounded = Math.round(raw);
  return { raw, rounded };
}

export function resolveAttempt(input: AttemptInput): AttemptResult {
  let letter: string;
  let point: number;
  let rawTotal: number | undefined;
  let roundedTotal: number | undefined;

  if (input.letter) {
    letter = input.letter;
    point = letterToPoint(letter);
  } else if (typeof input.totalScore === 'number') {
    const g = scoreToGrade(input.totalScore);
    letter = g.letter;
    point = g.point;
    rawTotal = input.totalScore;
    roundedTotal = Math.round(input.totalScore);
  } else if (typeof input.ca === 'number' && typeof input.exam === 'number') {
    const t = computeTotal(input.ca, input.exam);
    const g = scoreToGrade(t.rounded);
    letter = g.letter;
    point = g.point;
    rawTotal = t.raw;
    roundedTotal = t.rounded;
  } else {
    throw new Error('Provide letter, totalScore, or ca+exam');
  }

  const qp = Math.round(point * input.credits * 100) / 100;
  return {
    credits: formatCredits(input.credits),
    letter,
    gradePoint: point,
    qualityPoints: qp,
    rawTotal,
    roundedTotal,
  };
}

export function calculateGPA(attempts: AttemptResult[]): number {
  const totalCredits = attempts.reduce((s, a) => s + parseFloat(a.credits), 0);
  if (totalCredits === 0) return 0;
  const totalQP = attempts.reduce((s, a) => s + a.qualityPoints, 0);
  return Math.round((totalQP / totalCredits) * 100) / 100;
}
