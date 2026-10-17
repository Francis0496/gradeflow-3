import { describe, it, expect } from 'vitest';
import {
  evaluateStudentScore,
  parseGradeCsv,
} from '../../src/lib/academics/batchGrades';

describe('Batch Grades Parsing & 30/70 Evaluation Engine', () => {
  describe('evaluateStudentScore', () => {
    it('correctly calculates raw 30/70 scores (CA <= 30, Exam <= 70)', () => {
      // CA = 28/30, Exam = 62/70 -> Total = 90 -> Grade A (4.00)
      const res = evaluateStudentScore(28, 62, null, null, 3.0);
      expect(res.rawTotal).toBe(90);
      expect(res.roundedTotal).toBe(90);
      expect(res.letter).toBe('A');
      expect(res.gradePoint).toBe(4.00);
      expect(res.qualityPoints).toBe(12.0);
      expect(res.error).toBeUndefined();
    });

    it('correctly weights percentage 30/70 scores (CA > 30 or Exam > 70)', () => {
      // CA = 80%, Exam = 65% -> 80*0.3 + 65*0.7 = 24 + 45.5 = 69.5 -> rounds to 70 (Grade A)
      const res = evaluateStudentScore(80, 65, null, null, 3.0);
      expect(res.rawTotal).toBe(69.5);
      expect(res.roundedTotal).toBe(70);
      expect(res.letter).toBe('A');
      expect(res.gradePoint).toBe(4.00);
      expect(res.warning).toContain('30% CA and 70% Exam');
    });

    it('handles direct total score override', () => {
      // Total 64 -> B (3.25)
      const res = evaluateStudentScore(null, null, 64, null, 3.0);
      expect(res.roundedTotal).toBe(64);
      expect(res.letter).toBe('B');
      expect(res.gradePoint).toBe(3.25);
      expect(res.qualityPoints).toBe(9.75);
    });

    it('handles direct letter grade override', () => {
      // Letter B+ -> 3.75 point
      const res = evaluateStudentScore(null, null, null, 'B+', 3.0);
      expect(res.letter).toBe('B+');
      expect(res.gradePoint).toBe(3.75);
      expect(res.qualityPoints).toBe(11.25);
    });

    it('flags out-of-range negative scores', () => {
      const res = evaluateStudentScore(-5, 50, null, null, 3.0);
      expect(res.error).toContain('outside valid range 0–100');
    });

    it('flags out-of-range scores exceeding 100', () => {
      const res = evaluateStudentScore(105, 50, null, null, 3.0);
      expect(res.error).toContain('outside valid range 0–100');
    });
  });

  describe('parseGradeCsv', () => {
    const knownCourses = [
      { code: 'DIT111', credit_hours: 3.0 },
      { code: 'DIT112', credit_hours: 3.0 },
      { code: 'MAT111', credit_hours: 3.0 },
    ];

    it('parses standard CSV format with headers', () => {
      const csv = `student_email,student_name,course_code,ca_score,exam_score,academic_year,semester
john.kamara@ipam.edu.sl,John Kamara,DIT111,26,58,2025/2026,1
fatmata.sesay@ipam.edu.sl,Fatmata Sesay,DIT111,28,64,2025/2026,1`;

      const result = parseGradeCsv(csv, knownCourses);
      expect(result.summary.totalRows).toBe(2);
      expect(result.summary.validRows).toBe(2);
      expect(result.summary.errorRows).toBe(0);
      expect(result.rows[0].studentIdentifier).toBe('john.kamara@ipam.edu.sl');
      expect(result.rows[0].roundedTotal).toBe(84);
      expect(result.rows[0].calculatedGrade).toBe('A');
      expect(result.rows[1].roundedTotal).toBe(92);
      expect(result.rows[1].calculatedGrade).toBe('A');
    });

    it('supports varied column aliases like matric_number, test, and exam', () => {
      const csv = `matric_number,candidate_name,course,test,examination
19283,Mohamed Conteh,DIT112,20,44`;

      const result = parseGradeCsv(csv, knownCourses);
      expect(result.summary.totalRows).toBe(1);
      expect(result.rows[0].studentIdentifier).toBe('19283');
      expect(result.rows[0].studentName).toBe('Mohamed Conteh');
      expect(result.rows[0].courseCode).toBe('DIT112');
      expect(result.rows[0].roundedTotal).toBe(64);
      expect(result.rows[0].calculatedGrade).toBe('B');
    });

    it('flags errors for missing student identifier and duplicate submissions', () => {
      const csv = `student_email,course_code,ca_score,exam_score
,DIT111,25,50
student1@ipam.edu.sl,DIT111,25,50
student1@ipam.edu.sl,DIT111,28,60`;

      const result = parseGradeCsv(csv, knownCourses);
      expect(result.summary.totalRows).toBe(3);
      expect(result.rows[0].errors).toContain('Student email / matric number is missing');
      expect(result.rows[2].errors.some((e) => e.includes('Duplicate grade entry'))).toBe(true);
      expect(result.summary.errorRows).toBe(2);
      expect(result.summary.validRows).toBe(1);
    });

    it('computes class average and pass rate correctly', () => {
      const csv = `student_email,course_code,ca_score,exam_score
s1@ipam.edu.sl,DIT111,25,55
s2@ipam.edu.sl,DIT111,10,15`; // row 1: 80 (Pass), row 2: 25 (Fail)

      const result = parseGradeCsv(csv, knownCourses);
      expect(result.summary.totalRows).toBe(2);
      expect(result.summary.validRows).toBe(2);
      // Average = (80 + 25) / 2 = 52.5
      expect(result.summary.classAverage).toBe(52.5);
      // Pass rate: 1 pass out of 2 = 50%
      expect(result.summary.passRate).toBe(50);
    });
  });
});
