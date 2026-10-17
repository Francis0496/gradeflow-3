import { describe, it, expect } from 'vitest';
import {
  isPassingGrade,
  auditPrerequisites,
  performDegreeAudit,
  OFFICIAL_IPAM_PREREQUISITES,
} from '../../src/lib/academics/degreeAudit';

describe('Degree Audit & Prerequisite Engine', () => {
  describe('isPassingGrade', () => {
    it('recognizes grades >= C- (2.00) as passing', () => {
      expect(isPassingGrade('A', 4.00)).toBe(true);
      expect(isPassingGrade('B+', 3.75)).toBe(true);
      expect(isPassingGrade('B', 3.25)).toBe(true);
      expect(isPassingGrade('C+', 2.75)).toBe(true);
      expect(isPassingGrade('C', 2.50)).toBe(true);
      expect(isPassingGrade('C-', 2.00)).toBe(true);
    });

    it('recognizes grades < C- (D, E, F) as failing', () => {
      expect(isPassingGrade('D', 1.50)).toBe(false);
      expect(isPassingGrade('E', 1.00)).toBe(false);
      expect(isPassingGrade('F', 0.00)).toBe(false);
      expect(isPassingGrade('F', null)).toBe(false);
      expect(isPassingGrade(null, 1.8)).toBe(false);
    });
  });

  describe('auditPrerequisites', () => {
    it('marks prerequisite as SATISFIED when student passed prerequisite course', () => {
      const studentRecords = [
        { courseCode: 'DIT112', creditHours: 3.0, letterGrade: 'B', gradePoint: 3.25 },
        { courseCode: 'DIT121', creditHours: 3.0, letterGrade: 'A', gradePoint: 4.00 },
      ];

      const { audits, brokenCount } = auditPrerequisites(studentRecords);
      const dit121Audit = audits.find((a) => a.rule.courseCode === 'DIT121');
      expect(dit121Audit).toBeDefined();
      expect(dit121Audit?.status).toBe('SATISFIED');
      expect(brokenCount).toBe(0);
    });

    it('flags NOT_ATTEMPTED when student attempts course without prerequisite', () => {
      const studentRecords = [
        { courseCode: 'DIT121', creditHours: 3.0 }, // Enrolled in DIT121 without taking DIT112
      ];

      const { audits, brokenCount } = auditPrerequisites(studentRecords);
      const dit121Audit = audits.find((a) => a.rule.courseCode === 'DIT121');
      expect(dit121Audit?.status).toBe('NOT_ATTEMPTED');
      expect(brokenCount).toBe(1);
    });

    it('flags FAILED_PREREQUISITE when student failed prerequisite course', () => {
      const studentRecords = [
        { courseCode: 'DIT112', creditHours: 3.0, letterGrade: 'F', gradePoint: 0.00 },
        { courseCode: 'DIT121', creditHours: 3.0, letterGrade: 'B', gradePoint: 3.25 },
      ];

      const { audits, brokenCount } = auditPrerequisites(studentRecords);
      const dit121Audit = audits.find((a) => a.rule.courseCode === 'DIT121');
      expect(dit121Audit?.status).toBe('FAILED_PREREQUISITE');
      expect(brokenCount).toBe(1);
    });

    it('flags CREDIT_DEFICIENT for Capstone Project 1 if student has under 80 credits', () => {
      const studentRecords = [
        { courseCode: 'DIT311', creditHours: 3.0, letterGrade: 'B', gradePoint: 3.25 },
        { courseCode: 'DIT411', creditHours: 3.0 },
      ];

      // Isolate Capstone Project 1 rule
      const capstoneRule = OFFICIAL_IPAM_PREREQUISITES.filter((r) => r.courseCode === 'DIT411');

      // Total earned credits is only 30.0 (less than 80.0 required)
      const { audits, brokenCount } = auditPrerequisites(studentRecords, capstoneRule, 30.0);
      const capstoneAudit = audits.find((a) => a.rule.courseCode === 'DIT411');
      expect(capstoneAudit?.status).toBe('CREDIT_DEFICIENT');
      expect(brokenCount).toBe(1);
    });
  });

  describe('performDegreeAudit', () => {
    const sampleCurriculum = [
      { code: 'DIT111', title: 'Intro to Computing', credit_hours: 3.0, semester_number: 1, is_core: true },
      { code: 'DIT112', title: 'Programming in C', credit_hours: 3.0, semester_number: 1, is_core: true },
      { code: 'DIT121', title: 'Data Structures', credit_hours: 3.0, semester_number: 2, is_core: true },
    ];

    it('returns IN_PROGRESS when credits are partially completed without blockers', () => {
      const records = [
        { courseCode: 'DIT111', creditHours: 3.0, letterGrade: 'A', gradePoint: 4.00 },
        { courseCode: 'DIT112', creditHours: 3.0, letterGrade: 'B', gradePoint: 3.25 },
      ];

      const report = performDegreeAudit({
        studentRecords: records,
        curriculum: sampleCurriculum,
        requiredCredits: 9.0,
        currentCGPA: 3.62,
      });

      expect(report.graduationStatus).toBe('IN_PROGRESS');
      expect(report.earnedCredits).toBe(6.0);
      expect(report.remainingCredits).toBe(3.0);
      expect(report.percentComplete).toBe(67);
      expect(report.canGraduateNow).toBe(false);
      expect(report.coreDeficiencies.length).toBe(1);
      expect(report.coreDeficiencies[0].courseCode).toBe('DIT121');
    });

    it('returns CLEARED when total credits threshold and all core courses are passed', () => {
      const records = [
        { courseCode: 'DIT111', creditHours: 3.0, letterGrade: 'A', gradePoint: 4.00 },
        { courseCode: 'DIT112', creditHours: 3.0, letterGrade: 'B+', gradePoint: 3.75 },
        { courseCode: 'DIT121', creditHours: 3.0, letterGrade: 'A', gradePoint: 4.00 },
      ];

      const report = performDegreeAudit({
        studentRecords: records,
        curriculum: sampleCurriculum,
        requiredCredits: 9.0,
        currentCGPA: 3.91,
      });

      expect(report.graduationStatus).toBe('CLEARED');
      expect(report.earnedCredits).toBe(9.0);
      expect(report.remainingCredits).toBe(0.0);
      expect(report.percentComplete).toBe(100);
      expect(report.canGraduateNow).toBe(true);
      expect(report.coreDeficiencies.length).toBe(0);
      expect(report.projectedClassification).toBe('First Class');
    });

    it('returns BLOCKED if student attempts advanced course without prerequisite satisfied', () => {
      const records = [
        { courseCode: 'DIT111', creditHours: 3.0, letterGrade: 'A', gradePoint: 4.00 },
        { courseCode: 'DIT121', creditHours: 3.0, letterGrade: 'B', gradePoint: 3.25 }, // Took DIT121 without DIT112
      ];

      const report = performDegreeAudit({
        studentRecords: records,
        curriculum: sampleCurriculum,
        requiredCredits: 9.0,
        currentCGPA: 3.62,
      });

      expect(report.graduationStatus).toBe('BLOCKED');
      expect(report.brokenPrerequisitesCount).toBe(1);
      expect(report.canGraduateNow).toBe(false);
    });
  });
});
