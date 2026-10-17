import Decimal from 'decimal.js';
import { calculateCGPA } from './gpa';
import { getClassification, AwardType } from './classification';
import { formatCredits, formatGPA } from './credit';

export interface AcademicInsightAttempt {
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  letter: string;
  gradePoint: number;
}

export interface AcademicRecommendation {
  cgpa: number;
  formattedCGPA: string;
  standing: string;
  nextTier?: {
    name: string;
    threshold: number;
    pointsNeeded: number;
  };
  strengths: string[];
  vulnerabilities: string[];
  actionItems: string[];
  completionPercentage: number;
}

/**
 * Generates personalized academic recommendations and success analytics
 * based on official IPAM degree thresholds and historical course attempts.
 */
export function generateAcademicInsights(
  attempts: AcademicInsightAttempt[],
  totalRequiredCredits: number = 120.0,
  award: AwardType = 'honours'
): AcademicRecommendation {
  if (!attempts || attempts.length === 0) {
    return {
      cgpa: 0,
      formattedCGPA: '0.00',
      standing: 'No attempts recorded',
      strengths: [],
      vulnerabilities: [],
      actionItems: ['Record your first semester courses to receive customized academic guidance.'],
      completionPercentage: 0,
    };
  }

  const mapped = attempts.map((a) => ({
    credits: a.creditHours,
    gradePoint: a.gradePoint,
  }));

  const cgpa = calculateCGPA(mapped);
  const totalEarnedCredits = attempts.reduce((sum, a) => sum + a.creditHours, 0);
  const completionPercentage = Math.min(100, Math.round((totalEarnedCredits / totalRequiredCredits) * 100));
  const standing = getClassification(cgpa, award);

  // Identify Strengths (A, B+)
  const strengths: string[] = [];
  const vulnerabilities: string[] = [];

  for (const a of attempts) {
    if (a.gradePoint >= 3.75) {
      strengths.push(`${a.courseCode} (${a.courseTitle}) — Grade ${a.letter}`);
    } else if (a.gradePoint < 2.50) {
      vulnerabilities.push(`${a.courseCode} (${a.courseTitle}) — Grade ${a.letter} (${a.gradePoint.toFixed(2)} GP)`);
    }
  }

  // Determine Next Classification Tier
  let nextTier: { name: string; threshold: number; pointsNeeded: number } | undefined;
  if (award === 'honours') {
    if (cgpa < 2.00) {
      nextTier = { name: 'Third Class', threshold: 2.00, pointsNeeded: new Decimal(2.00).minus(cgpa).toNumber() };
    } else if (cgpa < 2.60) {
      nextTier = { name: 'Second Class, Second Division', threshold: 2.60, pointsNeeded: new Decimal(2.60).minus(cgpa).toNumber() };
    } else if (cgpa < 3.00) {
      nextTier = { name: 'Second Class, First Division', threshold: 3.00, pointsNeeded: new Decimal(3.00).minus(cgpa).toNumber() };
    } else if (cgpa < 3.50) {
      nextTier = { name: 'First Class', threshold: 3.50, pointsNeeded: new Decimal(3.50).minus(cgpa).toNumber() };
    }
  }

  // Actionable Insights
  const actionItems: string[] = [];

  if (nextTier) {
    actionItems.push(
      `You are only ${nextTier.pointsNeeded.toFixed(2)} grade points away from elevating to ${nextTier.name} (Threshold: ${nextTier.threshold.toFixed(2)}).`
    );
  } else {
    actionItems.push('Outstanding performance! You are currently maintaining First Class Honours standing.');
  }

  if (vulnerabilities.length > 0) {
    actionItems.push(
      `Consider reviewing core fundamentals for ${vulnerabilities.length} unit(s) with grades below C (2.50) to prevent GPA dilution.`
    );
  }

  if (totalEarnedCredits < totalRequiredCredits) {
    const remaining = totalRequiredCredits - totalEarnedCredits;
    actionItems.push(
      `${formatCredits(remaining)} credits remaining across subsequent semesters towards graduation.`
    );
  }

  return {
    cgpa,
    formattedCGPA: formatGPA(cgpa),
    standing,
    nextTier,
    strengths: strengths.slice(0, 4),
    vulnerabilities: vulnerabilities.slice(0, 4),
    actionItems,
    completionPercentage,
  };
}
