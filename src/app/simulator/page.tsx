'use client';
import { useState } from 'react';
import { requiredGPA, getClassification } from '@/lib/academics';

export default function SimulatorPage() {
  const [earned, setEarned] = useState(15);
  const [cgpa, setCgpa] = useState(3.35);
  const [remaining, setRemaining] = useState(15);
  const [target, setTarget] = useState(3.5);
  const need = requiredGPA(earned, cgpa, remaining, target);
  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Simulator</h1>
      <p>Earned credits: <input type="number" value={earned} onChange={(e) => setEarned(+e.target.value)} /></p>
      <p>Current CGPA: <input type="number" step="0.01" value={cgpa} onChange={(e) => setCgpa(+e.target.value)} /></p>
      <p>Remaining credits: <input type="number" value={remaining} onChange={(e) => setRemaining(+e.target.value)} /></p>
      <p>Target CGPA: <input type="number" step="0.01" value={target} onChange={(e) => setTarget(+e.target.value)} /></p>
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16 }}>
        <p>Required GPA on remaining credits: <strong>{need.toFixed(2)}</strong></p>
        <p>Target standing: {getClassification(target)}</p>
      </div>
    </div>
  );
}
