import Decimal from 'decimal.js';

/**
 * Required GPA on remaining credits to reach a target CGPA.
 * neededQP = (targetCGPA * totalCredits) - earnedQP
 * requiredGPA = neededQP / remainingCredits
 */
export function requiredGPA(
  earnedCredits: number | string,
  currentCGPA: number | string,
  remainingCredits: number | string,
  targetCGPA: number | string
): number {
  const remCr = new Decimal(remainingCredits);
  const curCgpaD = new Decimal(currentCGPA);
  if (remCr.isZero() || remCr.isNegative()) return curCgpaD.toNumber();

  const earnedCr = new Decimal(earnedCredits);
  const targetD = new Decimal(targetCGPA);

  const earnedQP = earnedCr.times(curCgpaD);
  const totalCredits = earnedCr.plus(remCr);
  const neededQP = targetD.times(totalCredits).minus(earnedQP);

  return neededQP.dividedBy(remCr).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

