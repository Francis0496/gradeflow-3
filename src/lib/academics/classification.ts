/** USL October 2018 classification (Section 11.19). */
export type AwardType = 'honours' | 'general' | 'diploma';

export function getClassification(cgpa: number, award: AwardType = 'honours'): string {
  if (award === 'honours') {
    if (cgpa >= 3.5) return 'First Class';
    if (cgpa >= 3.2) return 'Second Class (1st Div)';
    if (cgpa >= 3.0) return 'Second Class (1st Div)';
    if (cgpa >= 2.6) return 'Second Class (2nd Div)';
    if (cgpa >= 2.0) return 'Third Class';
    if (cgpa >= 1.5) return 'Pass';
    return 'Fail';
  }
  if (award === 'general') {
    if (cgpa >= 3.2) return 'Division One';
    if (cgpa >= 2.6) return 'Division Two';
    if (cgpa >= 1.5) return 'Division Three';
    return 'Fail';
  }
  if (cgpa >= 3.2) return 'Distinction';
  if (cgpa >= 2.6) return 'Credit';
  if (cgpa >= 1.5) return 'Pass';
  return 'Fail';
}
