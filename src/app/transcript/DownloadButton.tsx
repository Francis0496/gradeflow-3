'use client';
import { Download } from 'lucide-react';

interface Row {
  code: string;
  title: string;
  credits: string;
  letter: string;
  gradePoint: string;
  qp: string;
}

export default function DownloadButton({
  name,
  programme,
  cgpa,
  classification,
  credits,
  rows,
}: {
  name: string;
  programme: string;
  cgpa: string;
  classification: string;
  credits: string;
  rows: Row[];
}) {
  async function onDownload() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Top Header & Institution
    doc.setFillColor(29, 78, 216); // Blue 700
    doc.rect(0, 0, 210, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('UNIVERSITY OF SIERRA LEONE · IPAM CAMPUS', 14, 11);

    // Document Title
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(18);
    doc.text('Unofficial Academic Transcript Preview', 14, 28);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Sierra EduTech Solutions Limited · GradeFlow 3.0 Academic Engine', 14, 34);

    // Student & Performance Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 40, 182, 30, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(`Student Name: ${name}`, 20, 48);
    doc.text(`Programme: ${programme}`, 20, 56);
    doc.text(`Cumulative CGPA: ${cgpa}`, 20, 64);

    doc.text(`Completed Credits: ${credits}`, 110, 48);
    doc.text(`Degree Classification: ${classification}`, 110, 56);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 110, 64);

    // Table Header
    let y = 80;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Course Code', 18, y + 5.5);
    doc.text('Course Title', 45, y + 5.5);
    doc.text('Credits', 125, y + 5.5);
    doc.text('Grade', 145, y + 5.5);
    doc.text('Point', 162, y + 5.5);
    doc.text('Quality Pts', 180, y + 5.5);

    // Table Rows
    y += 12;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);

    rows.forEach((r) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(r.code, 18, y);
      doc.text(r.title.slice(0, 40), 45, y);
      doc.text(r.credits, 128, y);
      doc.text(r.letter, 148, y);
      doc.text(r.gradePoint, 164, y);
      doc.text(r.qp, 185, y);

      // subtle separator line
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, 196, y + 2);
      y += 7;
    });

    // Disclaimer Footer
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'NOTICE: This document is an unofficial academic performance summary generated via GradeFlow 3.0.',
      14,
      y
    );
    doc.text(
      'Official, authenticated transcripts are issued solely by the University of Sierra Leone Registry.',
      14,
      y + 5
    );

    doc.save(`GradeFlow-Transcript-${name.replace(/\s+/g, '_')}.pdf`);
  }

  return (
    <button
      type="button"
      onClick={onDownload}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
    >
      <Download className="w-4 h-4" />
      Download PDF Transcript
    </button>
  );
}
