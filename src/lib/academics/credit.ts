/** Credit formatting: always one decimal place. */
export function formatCredits(credits: number): string {
  return credits.toFixed(1);
}

export function parseCredits(value: string | number): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n) || n < 0) throw new Error('Invalid credits');
  return Math.round(n * 10) / 10;
}
