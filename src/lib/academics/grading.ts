/** IPAM 10-tier grading scale. */
export interface GradeBand {
  min: number;
  max: number;
  letter: string;
  point: number;
}

export const GRADE_BANDS: GradeBand[] = [
  { min: 70, max: 100, letter: 'A', point: 4.0 },
  { min: 65, max: 69, letter: 'B+', point: 3.75 },
  { min: 60, max: 64, letter: 'B', point: 3.25 },
  { min: 55, max: 59, letter: 'B-', point: 3.0 },
  { min: 50, max: 54, letter: 'C+', point: 2.75 },
  { min: 45, max: 49, letter: 'C', point: 2.5 },
  { min: 40, max: 44, letter: 'C-', point: 2.0 },
  { min: 35, max: 39, letter: 'D', point: 1.5 },
  { min: 30, max: 34, letter: 'E', point: 1.0 },
  { min: 0, max: 29, letter: 'F', point: 0.0 },
];

export function scoreToGrade(score: number): GradeBand {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return GRADE_BANDS.find((b) => s >= b.min && s <= b.max) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

export function letterToPoint(letter: string): number {
  const band = GRADE_BANDS.find((b) => b.letter === letter);
  if (!band) throw new Error(`Unknown letter: ${letter}`);
  return band.point;
}
