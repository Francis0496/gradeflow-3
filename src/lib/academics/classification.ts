/** USL October 2018 classification (Honours track). */
export function getClassification(cgpa: number): string {
  if (cgpa >= 3.5) return 'First Class';
  if (cgpa >= 3.2) return 'Second Class (1st Div)';
  if (cgpa >= 3.0) return 'Second Class (1st Div)';
  if (cgpa >= 2.6) return 'Second Class (2nd Div)';
  if (cgpa >= 2.0) return 'Third Class';
  if (cgpa >= 1.5) return 'Pass';
  return 'Fail';
}
