import { getClassification } from '@/lib/academics';

const SAMPLE = [
  { code: 'DAA112', title: 'Mathematics for IT', credits: '3.0', letter: 'B', qp: 9.75 },
  { code: 'DHM111', title: 'Critical Thinking Skills', credits: '3.0', letter: 'B+', qp: 11.25 },
  { code: 'DCN111', title: 'Programming Foundation', credits: '3.0', letter: 'A', qp: 12.0 },
];

export default function TranscriptPage() {
  const cgpa = 3.35;
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Unofficial Transcript</h1>
      <p>IPAM · BSc Information Technology · CGPA {cgpa.toFixed(2)} — {getClassification(cgpa)}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e4e4e7' }}>
            <th>Code</th><th>Title</th><th>Credits</th><th>Grade</th><th>QP</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE.map((r) => (
            <tr key={r.code} style={{ borderBottom: '1px solid #f4f4f5' }}>
              <td>{r.code}</td><td>{r.title}</td><td>{r.credits}</td><td>{r.letter}</td><td>{r.qp}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 16 }}>Unofficial preview. Official transcripts are issued by the registry.</p>
    </div>
  );
}
