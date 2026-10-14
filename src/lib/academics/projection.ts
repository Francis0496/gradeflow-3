/** Credits needed at a given GPA to reach a target CGPA. */
export function requiredGPA(
  earnedCredits: number,
  currentCGPA: number,
  remainingCredits: number,
  targetCGPA: number
): number {
  if (remainingCredits <= 0) return currentCGPA;
  const earnedQP = earnedCredits * currentCGPA;
  const totalCredits = earnedCredits + remainingCredits;
  const neededQP = targetCGPA * totalCredits - earnedQP;
  return Math.round((neededQP / remainingCredits) * 100) / 100;
}
