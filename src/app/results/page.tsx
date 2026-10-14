'use client';
import { useState } from 'react';
import { resolveAttempt, calculateGPA, getClassification } from '@/lib/academics';

export default function ResultsPage() {
  const [ca, setCa] = useState(25);
  const [exam, setExam] = useState(70);
  const [credits, setCredits] = useState(3);
  const attempt = resolveAttempt({ credits, ca, exam });
  const gpa = calculateGPA([attempt]);
  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Results</h1>
      <label>CA (30%) <input type="number" value={ca} onChange={(e) => setCa(+e.target.value)} /></label>
      <label>Exam (70%) <input type="number" value={exam} onChange={(e) => setExam(+e.target.value)} /></label>
      <label>Credits <input type="number" step="0.5" value={credits} onChange={(e) => setCredits(+e.target.value)} /></label>
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16 }}>
        <p>Letter: <strong>{attempt.letter}</strong></p>
        <p>Grade point: {attempt.gradePoint.toFixed(2)}</p>
        <p>Quality points: {attempt.qualityPoints}</p>
        <p>Credits: {attempt.credits}</p>
        <p>Sample GPA: {gpa.toFixed(2)} — {getClassification(gpa)}</p>
      </div>
    </div>
  );
}
