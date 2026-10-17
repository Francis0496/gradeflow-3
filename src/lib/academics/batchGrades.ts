import Decimal from 'decimal.js';
import { roundScoreHalfUp, scoreToGrade, letterToPoint, GRADE_BANDS } from './grading';
import { formatCredits } from './credit';

export interface BatchGradeRow {
  rowNumber: number;
  studentIdentifier: string;
  studentName?: string;
  courseCode: string;
  caScore?: number | null;
  examScore?: number | null;
  totalScore?: number | null;
  letterGrade?: string | null;
  academicYear: string;
  semester: number;
  creditHours: number;
  calculatedTotal?: number | null;
  roundedTotal?: number | null;
  calculatedGrade?: string | null;
  gradePoint?: number | null;
  qualityPoints?: number | null;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
}

export interface BatchSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  classAverage: number;
  passRate: number;
  coursesDetected: string[];
}

export interface BatchParseResult {
  rows: BatchGradeRow[];
  summary: BatchSummary;
}

const HEADER_ALIASES = {
  student: ['student_email', 'email', 'matric_number', 'student_id', 'id', 'student', 'reg_no', 'matric'],
  name: ['student_name', 'name', 'full_name', 'candidate_name', 'student name'],
  course: ['course_code', 'course', 'code', 'module', 'unit', 'course code'],
  ca: ['ca_score', 'ca', 'continuous_assessment', 'continuous assessment', 'test', 'cw', 'coursework', 'ca (30%)'],
  exam: ['exam_score', 'exam', 'examination', 'final_exam', 'final exam', 'exam (70%)'],
  total: ['total_score', 'total', 'score', 'final_score', 'overall', 'final mark'],
  grade: ['letter_grade', 'grade', 'letter'],
  year: ['academic_year', 'year', 'session', 'academic year'],
  semester: ['semester', 'sem', 'term'],
  credits: ['credit_hours', 'credits', 'credit', 'units'],
};

function matchHeader(colName: string): keyof typeof HEADER_ALIASES | null {
  const normalized = colName.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized) || aliases.includes(colName.trim().toLowerCase())) {
      return key as keyof typeof HEADER_ALIASES;
    }
  }
  return null;
}

/**
 * Robust CSV Line Splitter supporting quotes and commas.
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Evaluates individual student scores according to IPAM academic policies:
 * - 30/70 raw or percentage calculation
 * - Precedence: Letter Grade -> Direct Total -> CA + Exam
 * - Half-up rounding
 */
export function evaluateStudentScore(
  caRaw?: number | null,
  examRaw?: number | null,
  totalRaw?: number | null,
  letterRaw?: string | null,
  credits = 3.0
): {
  rawTotal: number | null;
  roundedTotal: number | null;
  letter: string | null;
  gradePoint: number | null;
  qualityPoints: number | null;
  error?: string;
  warning?: string;
} {
  try {
    const creditD = new Decimal(credits);

    // 1. Direct Letter Grade
    if (letterRaw && letterRaw.trim().length > 0) {
      const cleanLetter = letterRaw.trim().toUpperCase();
      const point = letterToPoint(cleanLetter);
      const qp = creditD.times(point).toNumber();
      return {
        rawTotal: null,
        roundedTotal: null,
        letter: cleanLetter,
        gradePoint: point,
        qualityPoints: qp,
      };
    }

    // 2. Direct Total Score
    if (typeof totalRaw === 'number' && !Number.isNaN(totalRaw)) {
      if (totalRaw < 0 || totalRaw > 100) {
        return {
          rawTotal: totalRaw,
          roundedTotal: null,
          letter: null,
          gradePoint: null,
          qualityPoints: null,
          error: `Total score (${totalRaw}) is outside valid range 0–100`,
        };
      }
      const rounded = roundScoreHalfUp(totalRaw);
      const band = scoreToGrade(rounded);
      const qp = creditD.times(band.point).toNumber();
      return {
        rawTotal: totalRaw,
        roundedTotal: rounded,
        letter: band.letter,
        gradePoint: band.point,
        qualityPoints: qp,
      };
    }

    // 3. CA + Exam Combination
    if (
      typeof caRaw === 'number' &&
      !Number.isNaN(caRaw) &&
      typeof examRaw === 'number' &&
      !Number.isNaN(examRaw)
    ) {
      if (caRaw < 0 || caRaw > 100) {
        return {
          rawTotal: null,
          roundedTotal: null,
          letter: null,
          gradePoint: null,
          qualityPoints: null,
          error: `CA score (${caRaw}) is outside valid range 0–100`,
        };
      }
      if (examRaw < 0 || examRaw > 100) {
        return {
          rawTotal: null,
          roundedTotal: null,
          letter: null,
          gradePoint: null,
          qualityPoints: null,
          error: `Exam score (${examRaw}) is outside valid range 0–100`,
        };
      }

      let rawTotalD: Decimal;
      let warning: string | undefined;

      // Check whether scores are already in 30/70 scale or 100% scale
      if (caRaw <= 30 && examRaw <= 70) {
        // Direct component addition: CA/30 + Exam/70 = 100
        rawTotalD = new Decimal(caRaw).plus(examRaw);
      } else {
        // Percentage scale: CA * 0.30 + Exam * 0.70
        rawTotalD = new Decimal(caRaw).times(0.3).plus(new Decimal(examRaw).times(0.7));
        warning = 'Evaluated using 30% CA and 70% Exam percentage weighting';
      }

      const rawTotal = rawTotalD.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
      const roundedTotal = roundScoreHalfUp(rawTotalD);
      const band = scoreToGrade(roundedTotal);
      const qp = creditD.times(band.point).toNumber();

      return {
        rawTotal,
        roundedTotal,
        letter: band.letter,
        gradePoint: band.point,
        qualityPoints: qp,
        warning,
      };
    }

    return {
      rawTotal: null,
      roundedTotal: null,
      letter: null,
      gradePoint: null,
      qualityPoints: null,
      error: 'Incomplete score: provide CA + Exam, Total Score, or Letter Grade',
    };
  } catch (err: any) {
    return {
      rawTotal: null,
      roundedTotal: null,
      letter: null,
      gradePoint: null,
      qualityPoints: null,
      error: err?.message || 'Grade calculation error',
    };
  }
}

/**
 * Parses and validates raw CSV content against official IPAM academic standards.
 */
export function parseGradeCsv(
  csvContent: string,
  knownCourses: { code: string; credit_hours: number }[] = []
): BatchParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        warningRows: 0,
        errorRows: 0,
        classAverage: 0,
        passRate: 0,
        coursesDetected: [],
      },
    };
  }

  // Header detection
  const headerCols = splitCsvLine(lines[0]);
  const colMap: { [key in keyof typeof HEADER_ALIASES]?: number } = {};

  headerCols.forEach((col, idx) => {
    const matched = matchHeader(col);
    if (matched && colMap[matched] === undefined) {
      colMap[matched] = idx;
    }
  });

  const hasStudentCol = colMap.student !== undefined;
  const hasCourseCol = colMap.course !== undefined;

  const rows: BatchGradeRow[] = [];
  const seenEntries = new Set<string>();
  const coursesSet = new Set<string>();

  let scoreSum = 0;
  let scoredCount = 0;
  let passCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const parts = splitCsvLine(lines[i]);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract fields using detected columns or fallback indices
    const studentIdentifier = (hasStudentCol && colMap.student !== undefined ? parts[colMap.student] : parts[0]) || '';
    const studentName = colMap.name !== undefined ? parts[colMap.name] : undefined;
    const courseCode = (hasCourseCol && colMap.course !== undefined ? parts[colMap.course] : parts[2] || parts[1] || '').toUpperCase().trim();

    const caStr = colMap.ca !== undefined ? parts[colMap.ca] : undefined;
    const examStr = colMap.exam !== undefined ? parts[colMap.exam] : undefined;
    const totalStr = colMap.total !== undefined ? parts[colMap.total] : undefined;
    const letterStr = colMap.grade !== undefined ? parts[colMap.grade] : undefined;
    const yearStr = colMap.year !== undefined ? parts[colMap.year] : undefined;
    const semStr = colMap.semester !== undefined ? parts[colMap.semester] : undefined;
    const creditsStr = colMap.credits !== undefined ? parts[colMap.credits] : undefined;

    const academicYear = yearStr?.trim() || '2025/2026';
    const semester = semStr ? parseInt(semStr, 10) || 1 : 1;

    // Course resolution
    const matchedCourse = knownCourses.find((c) => c.code.toUpperCase() === courseCode);
    const creditHours = creditsStr
      ? parseFloat(creditsStr) || 3.0
      : matchedCourse
      ? Number(matchedCourse.credit_hours)
      : 3.0;

    if (!studentIdentifier || studentIdentifier.trim().length === 0) {
      errors.push('Student email / matric number is missing');
    }

    if (!courseCode || courseCode.trim().length === 0) {
      errors.push('Course code is missing');
    } else {
      coursesSet.add(courseCode);
      if (knownCourses.length > 0 && !matchedCourse) {
        warnings.push(`Course code '${courseCode}' is not registered in the active catalogue`);
      }
    }

    // Duplicate detection in same batch
    const dedupeKey = `${studentIdentifier.toLowerCase()}_${courseCode}_${academicYear}_${semester}`;
    if (seenEntries.has(dedupeKey)) {
      errors.push(`Duplicate grade entry for ${studentIdentifier} in ${courseCode}`);
    } else if (studentIdentifier && courseCode) {
      seenEntries.add(dedupeKey);
    }

    const caScore = caStr !== undefined && caStr !== '' ? parseFloat(caStr) : null;
    const examScore = examStr !== undefined && examStr !== '' ? parseFloat(examStr) : null;
    const totalScore = totalStr !== undefined && totalStr !== '' ? parseFloat(totalStr) : null;
    const letterGrade = letterStr?.trim().toUpperCase() || null;

    const evalResult = evaluateStudentScore(caScore, examScore, totalScore, letterGrade, creditHours);

    if (evalResult.error) {
      errors.push(evalResult.error);
    }
    if (evalResult.warning) {
      warnings.push(evalResult.warning);
    }

    const status: 'valid' | 'warning' | 'error' = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

    if (status !== 'error' && evalResult.roundedTotal !== null && evalResult.roundedTotal !== undefined) {
      scoreSum += evalResult.roundedTotal;
      scoredCount++;
      if (evalResult.gradePoint !== null && evalResult.gradePoint !== undefined && evalResult.gradePoint >= 2.0) {
        passCount++;
      }
    }

    rows.push({
      rowNumber: rowNum,
      studentIdentifier,
      studentName,
      courseCode,
      caScore,
      examScore,
      totalScore,
      letterGrade,
      academicYear,
      semester,
      creditHours,
      calculatedTotal: evalResult.rawTotal,
      roundedTotal: evalResult.roundedTotal,
      calculatedGrade: evalResult.letter,
      gradePoint: evalResult.gradePoint,
      qualityPoints: evalResult.qualityPoints,
      status,
      errors,
      warnings,
    });
  }

  const validRows = rows.filter((r) => r.status === 'valid').length;
  const warningRows = rows.filter((r) => r.status === 'warning').length;
  const errorRows = rows.filter((r) => r.status === 'error').length;
  const classAverage = scoredCount > 0 ? Math.round((scoreSum / scoredCount) * 10) / 10 : 0;
  const passRate = scoredCount > 0 ? Math.round((passCount / scoredCount) * 100) : 0;

  return {
    rows,
    summary: {
      totalRows: rows.length,
      validRows: validRows + warningRows,
      warningRows,
      errorRows,
      classAverage,
      passRate,
      coursesDetected: Array.from(coursesSet),
    },
  };
}
