'use client';

interface Row {
  code: string;
  title: string;
  credits: string;
  letter: string;
  qp: string;
}

export default function DownloadButton({
  name,
  cgpa,
  classification,
  credits,
  rows,
}: {
  name: string;
  cgpa: string;
  classification: string;
  credits: string;
  rows: Row[];
}) {
  async function onDownload() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('GradeFlow 3.0 — Unofficial Transcript', 14, 18);
    doc.setFontSize(11);
    doc.text('IPAM · University of Sierra Leone', 14, 26);
    doc.text(`Student: ${name}`, 14, 36);
    doc.text(`CGPA: ${cgpa}  ·  ${classification}  ·  Credits: ${credits}`, 14, 44);
    let y = 56;
    doc.setFontSize(10);
    doc.text('Code', 14, y);
    doc.text('Title', 40, y);
    doc.text('Cr', 140, y);
    doc.text('Grade', 155, y);
    doc.text('QP', 175, y);
    y += 6;
    rows.forEach((r) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(r.code, 14, y);
      doc.text(r.title.slice(0, 48), 40, y);
      doc.text(r.credits, 140, y);
      doc.text(r.letter, 155, y);
      doc.text(r.qp, 175, y);
      y += 6;
    });
    doc.setFontSize(8);
    doc.text('Unofficial preview. Official transcripts are issued by the registry.', 14, y + 8);
    doc.save('gradeflow-transcript.pdf');
  }

  return (
    <button type="button" onClick={onDownload} style={{ background: '#1d4ed8', color: '#fff', padding: '8px 14px', border: 0, borderRadius: 6, marginTop: 16 }}>
      Download PDF
    </button>
  );
}
