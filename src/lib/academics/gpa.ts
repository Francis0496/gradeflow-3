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
}

/** Precedence: letter > totalScore > CA(30%)+Exam(70%). */
export function resolveAttempt(input: AttemptInput): AttemptResult {
  let letter: string;
  let point: number;
  if (input.letter) {
    letter = input.letter;
    point = letterToPoint(letter);
  } else if (typeof input.totalScore === 'number') {
    const g = scoreToGrade(input.totalScore);
    letter = g.letter;
    point = g.point;
  } else if (typeof input.ca === 'number' && typeof input.exam === 'number') {
    const total = input.ca * 0.3 + input.exam * 0.7;
    const g = scoreToGrade(total);
    letter = g.letter;
    point = g.point;
  } else {
    throw new Error('Provide letter, totalScore, or ca+exam');
  }
  const qp = Math.round(point * input.credits * 100) / 100;
  return { credits: formatCredits(input.credits), letter, gradePoint: point, qualityPoints: qp };
}

export function calculateGPA(attempts: AttemptResult[]): number {
  const totalCredits = attempts.reduce((s, a) => s + parseFloat(a.credits), 0);
  if (totalCredits === 0) return 0;
  const totalQP = attempts.reduce((s, a) => s + a.qualityPoints, 0);
  return Math.round((totalQP / totalCredits) * 100) / 100;
}
