import { describe, it, expect } from 'vitest';
import {
  formatCredits,
  formatGPA,
  roundScoreHalfUp,
  scoreToGrade,
  letterToPoint,
  computeTotal,
  resolveAttempt,
  calculateGPA,
  calculateCGPA,
  getClassification,
  requiredGPA,
  generateAcademicInsights,
} from '../../src/lib/academics';


describe('GradeFlow 3.0 Academic Engine', () => {
  describe('Credit Formatting (Section 6 & 19)', () => {
    it('formats single standard course credits as 3.0, not 3.0000 or 3', () => {
      expect(formatCredits(3)).toBe('3.0');
    });

    it('formats 4 standard courses (12 credits) as 12.0', () => {
      expect(formatCredits(12)).toBe('12.0');
    });

    it('formats 5 standard courses (15 credits) as 15.0', () => {
      expect(formatCredits(15)).toBe('15.0');
    });

    it('formats 6 standard courses (18 credits) as 18.0', () => {
      expect(formatCredits(18)).toBe('18.0');
    });

    it('formats GPA always with two decimal places', () => {
      expect(formatGPA(3.35)).toBe('3.35');
      expect(formatGPA(3.5)).toBe('3.50');
      expect(formatGPA(4)).toBe('4.00');
    });
  });

  describe('Score Rounding (Section 7 & 19)', () => {
    it('rounds 69.50 to 70 (Grade A)', () => {
      expect(roundScoreHalfUp(69.50)).toBe(70);
      expect(scoreToGrade(69.50).letter).toBe('A');
    });

    it('rounds 69.49 to 69 (Grade B+)', () => {
      expect(roundScoreHalfUp(69.49)).toBe(69);
      expect(scoreToGrade(69.49).letter).toBe('B+');
    });

    it('rounds 29.50 to 30 (Grade E)', () => {
      expect(roundScoreHalfUp(29.50)).toBe(30);
      expect(scoreToGrade(29.50).letter).toBe('E');
    });

    it('rounds 29.40 to 29 (Grade F)', () => {
      expect(roundScoreHalfUp(29.40)).toBe(29);
      expect(scoreToGrade(29.40).letter).toBe('F');
    });
  });

  describe('Official 10-Tier Grading Scale (Section 7 & 19)', () => {
    const testCases: [number, string, number][] = [
      [70, 'A', 4.00],
      [65, 'B+', 3.75],
      [60, 'B', 3.25],
      [55, 'B-', 3.00],
      [50, 'C+', 2.75],
      [45, 'C', 2.50],
      [40, 'C-', 2.00],
      [35, 'D', 1.50],
      [30, 'E', 1.00],
      [29, 'F', 0.00],
    ];

    testCases.forEach(([score, letter, point]) => {
      it(`maps score ${score} to grade ${letter} with grade point ${point.toFixed(2)}`, () => {
        const result = scoreToGrade(score);
        expect(result.letter).toBe(letter);
        expect(result.point).toBe(point);
      });
    });

    it('resolves letter to point correctly', () => {
      expect(letterToPoint('A')).toBe(4.00);
      expect(letterToPoint('B+')).toBe(3.75);
      expect(letterToPoint('F')).toBe(0.00);
    });
  });

  describe('Continuous Assessment & Exam Composition (Section 7)', () => {
    it('calculates (CA * 0.30) + (Exam * 0.70) with raw and rounded values', () => {
      // CA: 50, Exam: 70 -> (50 * 0.3) + (70 * 0.7) = 15 + 49 = 64 (B)
      const res = computeTotal(50, 70);
      expect(res.raw).toBe(64);
      expect(res.rounded).toBe(64);
    });

    it('accurately rounds half up at borderline scores', () => {
      // CA: 69, Exam: 70 -> 20.7 + 49 = 69.7 -> 70
      const res = computeTotal(69, 70);
      expect(res.raw).toBeCloseTo(69.7, 2);
      expect(res.rounded).toBe(70);
    });
  });

  describe('Marks Entry Precedence (Section 7)', () => {
    it('prioritizes direct letter grade over direct total score and CA/Exam', () => {
      const attempt = resolveAttempt({
        credits: 3,
        letter: 'A',
        totalScore: 50,
        ca: 20,
        exam: 20,
      });
      expect(attempt.letter).toBe('A');
      expect(attempt.gradePoint).toBe(4.00);
      expect(attempt.qualityPoints).toBe(12.00);
    });

    it('prioritizes direct total score over CA/Exam', () => {
      const attempt = resolveAttempt({
        credits: 3,
        totalScore: 65,
        ca: 20,
        exam: 20,
      });
      expect(attempt.letter).toBe('B+');
      expect(attempt.gradePoint).toBe(3.75);
      expect(attempt.qualityPoints).toBe(11.25);
    });

    it('uses CA + Exam when neither letter nor total score is provided', () => {
      const attempt = resolveAttempt({
        credits: 3,
        ca: 30,
        exam: 70, // 30*0.3 + 70*0.7 = 9 + 49 = 58 -> B- (3.00)
      });
      expect(attempt.letter).toBe('B-');
      expect(attempt.gradePoint).toBe(3.00);
      expect(attempt.qualityPoints).toBe(9.00);
    });
  });

  describe('Semester GPA Engine (Section 8 & 19)', () => {
    it('computes 5 courses with 15.0 credits and 50.25 quality points as GPA 3.35', () => {
      const attempts = [
        resolveAttempt({ credits: 3.0, letter: 'A' }),    // 3.0 * 4.00 = 12.00
        resolveAttempt({ credits: 3.0, letter: 'B+' }),   // 3.0 * 3.75 = 11.25
        resolveAttempt({ credits: 3.0, letter: 'B' }),    // 3.0 * 3.25 = 9.75
        resolveAttempt({ credits: 3.0, letter: 'B-' }),   // 3.0 * 3.00 = 9.00
        resolveAttempt({ credits: 3.0, letter: 'C+' }),   // 3.0 * 2.75 = 8.25
      ];

      const totalCredits = attempts.reduce((acc, a) => acc + a.creditHours, 0);
      const totalQP = attempts.reduce((acc, a) => acc + a.qualityPoints, 0);

      expect(totalCredits).toBe(15.0);
      expect(totalQP).toBe(50.25);

      const gpa = calculateGPA(attempts);
      expect(gpa).toBe(3.35);
    });

    it('returns 0 when no credits are attempted', () => {
      expect(calculateGPA([])).toBe(0);
    });

    it('includes zero score failing attempts in the GPA denominator', () => {
      const attempts = [
        resolveAttempt({ credits: 3.0, letter: 'A' }), // 12.00
        resolveAttempt({ credits: 3.0, letter: 'F' }), // 0.00
      ];
      // 12.00 / 6.0 = 2.00
      expect(calculateGPA(attempts)).toBe(2.00);
    });
  });

  describe('CGPA Calculation Engine (Section 9 & 19)', () => {
    it('aggregates credit-weighted quality points correctly: (60.0 + 10.0) / (15.0 + 5.0) = 3.50', () => {
      const sem1Attempts = [
        { credits: 15.0, qualityPoints: 60.0, gradePoint: 4.00 },
      ];
      const sem2Attempts = [
        { credits: 5.0, qualityPoints: 10.0, gradePoint: 2.00 },
      ];

      const allAttempts = [...sem1Attempts, ...sem2Attempts];
      const cgpa = calculateCGPA(allAttempts);

      // (60.0 + 10.0) / (15.0 + 5.0) = 70.0 / 20.0 = 3.50
      // NOT (4.00 + 2.00) / 2 = 3.00
      expect(cgpa).toBe(3.50);
      expect(cgpa).not.toBe(3.00);
    });
  });

  describe('Degree Classification (Section 10)', () => {
    describe('Honours Degree Policy', () => {
      it('classifies CGPA >= 3.50 as First Class', () => {
        expect(getClassification(4.00, 'honours')).toBe('First Class');
        expect(getClassification(3.50, 'honours')).toBe('First Class');
      });

      it('classifies CGPA 3.00 - 3.49 as Second Class, First Division', () => {
        expect(getClassification(3.49, 'honours')).toBe('Second Class, First Division');
        expect(getClassification(3.00, 'honours')).toBe('Second Class, First Division');
      });

      it('classifies CGPA 2.60 - 2.99 as Second Class, Second Division', () => {
        expect(getClassification(2.99, 'honours')).toBe('Second Class, Second Division');
        expect(getClassification(2.60, 'honours')).toBe('Second Class, Second Division');
      });

      it('classifies CGPA 2.00 - 2.59 as Third Class', () => {
        expect(getClassification(2.59, 'honours')).toBe('Third Class');
        expect(getClassification(2.00, 'honours')).toBe('Third Class');
      });

      it('classifies CGPA 1.50 - 1.99 as Pass', () => {
        expect(getClassification(1.99, 'honours')).toBe('Pass');
        expect(getClassification(1.50, 'honours')).toBe('Pass');
      });

      it('classifies CGPA < 1.50 as Fail', () => {
        expect(getClassification(1.49, 'honours')).toBe('Fail');
        expect(getClassification(0.00, 'honours')).toBe('Fail');
      });
    });

    describe('General Degree Policy', () => {
      it('classifies Division One, Two, Three and Fail', () => {
        expect(getClassification(3.50, 'general')).toBe('Division One');
        expect(getClassification(3.20, 'general')).toBe('Division One');
        expect(getClassification(2.80, 'general')).toBe('Division Two');
        expect(getClassification(1.80, 'general')).toBe('Division Three');
        expect(getClassification(1.20, 'general')).toBe('Fail');
      });
    });

    describe('Diploma Policy', () => {
      it('classifies Distinction, Credit, Pass and Fail', () => {
        expect(getClassification(3.50, 'diploma')).toBe('Distinction');
        expect(getClassification(3.20, 'diploma')).toBe('Distinction');
        expect(getClassification(2.80, 'diploma')).toBe('Credit');
        expect(getClassification(1.80, 'diploma')).toBe('Pass');
        expect(getClassification(1.20, 'diploma')).toBe('Fail');
      });
    });
  });

  describe('Grade Simulator & Projection (Section 13)', () => {
    it('calculates the required GPA to attain target CGPA', () => {
      const req = requiredGPA(15, 3.35, 15, 3.50);
      expect(req).toBe(3.65);
    });
  });

  describe('Academic Performance Recommendations & Insights', () => {
    it('identifies strengths, vulnerabilities, and points needed for next tier', () => {
      const attempts = [
        { courseCode: 'DIT111', courseTitle: 'Programming', creditHours: 3.0, letter: 'A', gradePoint: 4.00 },
        { courseCode: 'DHM111', courseTitle: 'Critical Thinking', creditHours: 3.0, letter: 'B+', gradePoint: 3.75 },
        { courseCode: 'DAA112', courseTitle: 'Mathematics for IT', creditHours: 3.0, letter: 'C-', gradePoint: 2.00 },
      ];

      const insights = generateAcademicInsights(attempts, 120.0, 'honours');
      // 3*4 + 3*3.75 + 3*2 = 12 + 11.25 + 6 = 29.25 / 9 = 3.25
      expect(insights.cgpa).toBe(3.25);
      expect(insights.standing).toBe('Second Class, First Division');
      expect(insights.nextTier?.name).toBe('First Class');
      expect(insights.nextTier?.threshold).toBe(3.50);
      expect(insights.nextTier?.pointsNeeded).toBeCloseTo(0.25, 2);
      expect(insights.strengths.length).toBe(2);
      expect(insights.vulnerabilities.length).toBe(1);
      expect(insights.completionPercentage).toBe(8); // 9/120 = 7.5% -> 8%
    });
  });
});

