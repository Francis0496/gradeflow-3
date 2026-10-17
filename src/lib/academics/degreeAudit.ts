import Decimal from 'decimal.js';
import { formatCredits, formatGPA } from './credit';
import { getClassification } from './classification';

export interface PrerequisiteRule {
  courseCode: string;
  courseTitle: string;
  prerequisiteCode: string;
  prerequisiteTitle: string;
  minimumGrade?: string; // Default: 'C-' (40% / 2.00 GP)
  minimumCreditHoursRequired?: number; // e.g., 80.0 for Capstone Project
}

export const OFFICIAL_IPAM_PREREQUISITES: PrerequisiteRule[] = [
  {
    courseCode: 'DIT121',
    courseTitle: 'Data Structures & Algorithms Analysis',
    prerequisiteCode: 'DIT112',
    prerequisiteTitle: 'Programming Fundamentals in C',
    minimumGrade: 'C-',
  },
  {
    courseCode: 'DIT122',
    courseTitle: 'Object-Oriented Programming with Java',
    prerequisiteCode: 'DIT112',
    prerequisiteTitle: 'Programming Fundamentals in C',
    minimumGrade: 'C-',
  },
  {
    courseCode: 'DIT211',
    courseTitle: 'Data Communications & Computer Networking 1',
    prerequisiteCode: 'DIT111',
    prerequisiteTitle: 'Introduction to Computing & Information Technology',
    minimumGrade: 'C-',
  },
  {
    courseCode: 'DIS212',
    courseTitle: 'Database Systems Design & SQL 1',
    prerequisiteCode: 'DIT111',
    prerequisiteTitle: 'Introduction to Computing & Information Technology',
    minimumGrade: 'C-',
  },
  {
    courseCode: 'DIS221',
    courseTitle: 'Advanced Database Management Systems 2',
    prerequisiteCode: 'DIS212',
    prerequisiteTitle: 'Database Systems Design & SQL 1',
    minimumGrade: 'C-',
  },
  {
    courseCode: 'DIT311',
    courseTitle: 'Software Engineering Principles & Lifecycle',
    prerequisiteCode: 'DIT122',
    prerequisiteTitle: 'Object-Oriented Programming with Java',
    minimumGrade: 'C-',
  },
  {
    courseCode: 'DIT312',
    courseTitle: 'Network Security & Applied Cryptography',
    prerequisiteCode: 'DIT211',
    prerequisiteTitle: 'Data Communications & Computer Networking 1',
    minimumGrade: 'C-',
  },
  {
    courseCode: 'DIT411',
    courseTitle: 'Final Year Capstone Research Project 1',
    prerequisiteCode: 'DIT311',
    prerequisiteTitle: 'Software Engineering Principles & Lifecycle',
    minimumGrade: 'C-',
    minimumCreditHoursRequired: 80.0,
  },
  {
    courseCode: 'DIT421',
    courseTitle: 'Final Year Capstone Research Project 2',
    prerequisiteCode: 'DIT411',
    prerequisiteTitle: 'Final Year Capstone Research Project 1',
    minimumGrade: 'C-',
  },
];

export interface StudentCourseRecord {
  courseCode: string;
  courseTitle?: string;
  creditHours: number;
  letterGrade?: string | null;
  gradePoint?: number | null;
  isPassed?: boolean;
  semester?: number;
  year?: number;
}

export interface CurriculumRequirement {
  code: string;
  title: string;
  credit_hours: number;
  semester_number: number;
  is_core?: boolean;
}

export type PrerequisiteStatus = 'SATISFIED' | 'FAILED_PREREQUISITE' | 'NOT_ATTEMPTED' | 'CREDIT_DEFICIENT';

export interface PrerequisiteAuditItem {
  rule: PrerequisiteRule;
  status: PrerequisiteStatus;
  details: string;
  studentPrerequisiteGrade?: string;
  studentPrerequisiteGradePoint?: number;
}

export interface CoreCourseDeficiency {
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  semesterNumber: number;
  reason: 'NOT_TAKEN' | 'FAILED'; // Grade < C- / 2.00
  gradeReceived?: string;
}

export type GraduationClearanceStatus = 'CLEARED' | 'IN_PROGRESS' | 'DEFICIENT' | 'BLOCKED';

export interface DegreeAuditReport {
  programmeName: string;
  requiredCredits: number; // e.g. 120.0
  earnedCredits: number; // Sum of passed credits (grade >= C-)
  remainingCredits: number;
  percentComplete: number;
  currentCGPA: number;
  projectedClassification: string;
  graduationStatus: GraduationClearanceStatus;
  statusMessage: string;
  prerequisiteAudits: PrerequisiteAuditItem[];
  brokenPrerequisitesCount: number;
  coreDeficiencies: CoreCourseDeficiency[];
  passedCoursesCount: number;
  totalRequiredCoursesCount: number;
  canGraduateNow: boolean;
}

/**
 * Checks whether an attempt is considered a passing grade under USL / IPAM regulations.
 * Passing threshold is C- (40.0% / 2.00 Grade Point).
 * Grades D (1.50), E (1.00), and F (0.00) are failures.
 */
export function isPassingGrade(letter?: string | null, point?: number | null): boolean {
  if (typeof point === 'number' && !Number.isNaN(point)) {
    return point >= 2.00;
  }
  if (!letter) return false;
  const normalized = letter.trim().toUpperCase();
  const passingGrades = ['A', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];
  return passingGrades.includes(normalized);
}

/**
 * Evaluates prerequisite relationships for a student.
 */
export function auditPrerequisites(
  studentRecords: StudentCourseRecord[],
  rules: PrerequisiteRule[] = OFFICIAL_IPAM_PREREQUISITES,
  totalEarnedCredits = 0
): { audits: PrerequisiteAuditItem[]; brokenCount: number } {
  const recordsMap = new Map<string, StudentCourseRecord>();
  studentRecords.forEach((r) => {
    recordsMap.set(r.courseCode.toUpperCase(), r);
  });

  const audits: PrerequisiteAuditItem[] = [];
  let brokenCount = 0;

  for (const rule of rules) {
    const studentCourse = recordsMap.get(rule.courseCode.toUpperCase());
    const prereqRecord = recordsMap.get(rule.prerequisiteCode.toUpperCase());

    // Only audit rules where the advanced course is either taken or enrolled
    const hasAttemptedCourse = Boolean(studentCourse);

    if (rule.minimumCreditHoursRequired && totalEarnedCredits < rule.minimumCreditHoursRequired) {
      if (hasAttemptedCourse) {
        brokenCount++;
        audits.push({
          rule,
          status: 'CREDIT_DEFICIENT',
          details: `Requires minimum ${formatCredits(rule.minimumCreditHoursRequired)} earned credits before enrolling (currently ${formatCredits(totalEarnedCredits)}).`,
        });
        continue;
      }
    }

    if (!prereqRecord) {
      if (hasAttemptedCourse) {
        brokenCount++;
        audits.push({
          rule,
          status: 'NOT_ATTEMPTED',
          details: `Prerequisite ${rule.prerequisiteCode} has not been taken yet.`,
        });
      }
      continue;
    }

    const passed = isPassingGrade(prereqRecord.letterGrade, prereqRecord.gradePoint);

    if (!passed) {
      if (hasAttemptedCourse) {
        brokenCount++;
        audits.push({
          rule,
          status: 'FAILED_PREREQUISITE',
          details: `Prerequisite ${rule.prerequisiteCode} was attempted but failed (Grade: ${prereqRecord.letterGrade || 'F'}). Minimum required is C- (2.00).`,
          studentPrerequisiteGrade: prereqRecord.letterGrade || undefined,
          studentPrerequisiteGradePoint: prereqRecord.gradePoint || undefined,
        });
      }
    } else {
      audits.push({
        rule,
        status: 'SATISFIED',
        details: `Satisfied with Grade ${prereqRecord.letterGrade || 'Pass'} (${formatGPA(prereqRecord.gradePoint || 2.0)} GP).`,
        studentPrerequisiteGrade: prereqRecord.letterGrade || undefined,
        studentPrerequisiteGradePoint: prereqRecord.gradePoint || undefined,
      });
    }
  }

  return { audits, brokenCount };
}

/**
 * Conducts a comprehensive graduation clearance audit against IPAM curriculum requirements.
 */
export function performDegreeAudit({
  programmeName = 'BSc. Information Technology (Honours)',
  studentRecords = [],
  curriculum = [],
  requiredCredits = 120.0,
  currentCGPA = 0,
}: {
  programmeName?: string;
  studentRecords?: StudentCourseRecord[];
  curriculum?: CurriculumRequirement[];
  requiredCredits?: number;
  currentCGPA?: number;
}): DegreeAuditReport {
  const recordsMap = new Map<string, StudentCourseRecord>();
  let earnedCreditsD = new Decimal(0);
  let passedCoursesCount = 0;

  for (const r of studentRecords) {
    const code = r.courseCode.toUpperCase();
    recordsMap.set(code, r);
    const passed = isPassingGrade(r.letterGrade, r.gradePoint);
    if (passed) {
      earnedCreditsD = earnedCreditsD.plus(new Decimal(r.creditHours || 3.0));
      passedCoursesCount++;
    }
  }

  const earnedCredits = earnedCreditsD.toDecimalPlaces(1).toNumber();
  const reqCreditsD = new Decimal(requiredCredits);
  const remainingCredits = Decimal.max(0, reqCreditsD.minus(earnedCreditsD)).toNumber();
  const percentComplete = Math.min(
    100,
    Math.round(earnedCreditsD.dividedBy(reqCreditsD).times(100).toNumber())
  );

  // Check Core Course Deficiencies
  const coreDeficiencies: CoreCourseDeficiency[] = [];
  for (const item of curriculum) {
    const code = item.code.toUpperCase();
    const isCore = item.is_core !== false;
    if (!isCore) continue;

    const studentRecord = recordsMap.get(code);
    if (!studentRecord) {
      coreDeficiencies.push({
        courseCode: item.code,
        courseTitle: item.title,
        creditHours: item.credit_hours,
        semesterNumber: item.semester_number,
        reason: 'NOT_TAKEN',
      });
    } else if (!isPassingGrade(studentRecord.letterGrade, studentRecord.gradePoint)) {
      coreDeficiencies.push({
        courseCode: item.code,
        courseTitle: item.title,
        creditHours: item.credit_hours,
        semesterNumber: item.semester_number,
        reason: 'FAILED',
        gradeReceived: studentRecord.letterGrade || 'F',
      });
    }
  }

  // Audit Prerequisites
  const { audits: prerequisiteAudits, brokenCount: brokenPrerequisitesCount } = auditPrerequisites(
    studentRecords,
    OFFICIAL_IPAM_PREREQUISITES,
    earnedCredits
  );

  const projectedClassification = getClassification(currentCGPA);

  // Determine Graduation Status
  let graduationStatus: GraduationClearanceStatus = 'IN_PROGRESS';
  let statusMessage = '';
  let canGraduateNow = false;

  if (brokenPrerequisitesCount > 0) {
    graduationStatus = 'BLOCKED';
    statusMessage = `Registration Blocked: ${brokenPrerequisitesCount} prerequisite requirements are unfulfilled or failed.`;
  } else if (earnedCredits >= requiredCredits) {
    if (coreDeficiencies.length > 0) {
      graduationStatus = 'DEFICIENT';
      statusMessage = `Graduation Pending: Completed ${formatCredits(earnedCredits)} credits, but ${coreDeficiencies.length} core courses remain deficient.`;
    } else if (currentCGPA < 2.00) {
      graduationStatus = 'DEFICIENT';
      statusMessage = `Graduation Disqualified: Minimum CGPA of 2.00 is required for Honours (Current: ${formatGPA(currentCGPA)}).`;
    } else {
      graduationStatus = 'CLEARED';
      statusMessage = `Graduation Clearance Approved: Completed ${formatCredits(earnedCredits)} credits with CGPA ${formatGPA(currentCGPA)} (${projectedClassification}).`;
      canGraduateNow = true;
    }
  } else {
    graduationStatus = 'IN_PROGRESS';
    statusMessage = `Curriculum In Progress: ${formatCredits(remainingCredits)} credit hours remaining to reach ${formatCredits(requiredCredits)} graduation threshold.`;
  }

  return {
    programmeName,
    requiredCredits,
    earnedCredits,
    remainingCredits,
    percentComplete,
    currentCGPA,
    projectedClassification,
    graduationStatus,
    statusMessage,
    prerequisiteAudits,
    brokenPrerequisitesCount,
    coreDeficiencies,
    passedCoursesCount,
    totalRequiredCoursesCount: curriculum.length || 30,
    canGraduateNow,
  };
}
