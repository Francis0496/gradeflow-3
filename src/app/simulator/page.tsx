'use client';
import { useState } from 'react';
import Shell from '@/components/Shell';
import { requiredGPA, getClassification } from '@/lib/academics';

export default function SimulatorPage() {
  const [earned, setEarned] = useState(15);
  const [cgpa, setCgpa] = useState(3.35);
  const [remaining, setRemaining] = useState(15);
  const [target, setTarget] = useState(3.5);
  const need = requiredGPA(earned, cgpa, remaining, target);
  return (
    <Shell signedIn>
      <div className="page" style={{ maxWidth: 640 }}>
        <h1>Simulator</h1>
        <div className="form card">
          <label>Earned credits <input type="number" value={earned} onChange={(e) => setEarned(+e.target.value)} /></label>
          <label>Current CGPA <input type="number" step="0.01" value={cgpa} onChange={(e) => setCgpa(+e.target.value)} /></label>
          <label>Remaining credits <input type="number" value={remaining} onChange={(e) => setRemaining(+e.target.value)} /></label>
          <label>Target CGPA <input type="number" step="0.01" value={target} onChange={(e) => setTarget(+e.target.value)} /></label>
        </div>
        <div className="card stat" style={{ marginTop: 16 }}>
          <label>Required GPA on remaining credits</label>
          <strong>{need.toFixed(2)}</strong>
          <p>Target standing: {getClassification(target)}</p>
        </div>
      </div>
    </Shell>
  );
}
