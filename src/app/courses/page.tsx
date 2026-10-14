const COURSES = [
  { code: 'DAA112', title: 'Mathematics for IT', credits: '3.0' },
  { code: 'DHM111', title: 'Critical Thinking Skills', credits: '3.0' },
  { code: 'DCN111', title: 'Programming Foundation', credits: '3.0' },
  { code: 'CNM211', title: 'Intro to Linux', credits: '3.0' },
  { code: 'CNM213', title: 'Network Access', credits: '3.0' },
];

export default function CoursesPage() {
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Course catalogue</h1>
      <p style={{ color: '#52525b' }}>Faculty of Information Systems & Technology · official codes</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {COURSES.map((c) => (
          <li key={c.code} style={{ borderBottom: '1px solid #e4e4e7', padding: '0.75rem 0' }}>
            <strong>{c.code}</strong> — {c.title} ({c.credits})
          </li>
        ))}
      </ul>
    </div>
  );
}
