import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { BatchGradeRow } from '@/lib/academics/batchGrades';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const isDemoAdmin = cookieStore.get('gf_demo_admin')?.value === 'true';

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check authorization: must be authenticated user or demo admin
    if (!user && !isDemoAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Administrative login required' }, { status: 401 });
    }

    const body = await request.json();
    const rows: BatchGradeRow[] = body.rows || [];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No grade records provided' }, { status: 400 });
    }

    // Filter to valid rows only
    const validRows = rows.filter((r) => r.status === 'valid' || r.status === 'warning');

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: 'Cannot import batch: No valid rows passed audit validation' },
        { status: 400 }
      );
    }

    // If demo admin mode or running in preview environment, simulate successful batch commit
    if (isDemoAdmin || !user) {
      return NextResponse.json({
        success: true,
        committedCount: validRows.length,
        isDemo: true,
        message: `Successfully processed ${validRows.length} student grade records in Evaluation Mode.`,
      });
    }

    // Live Supabase Insertion
    // 1. Fetch courses to match IDs
    const { data: courses } = await supabase.from('courses').select('id, code');
    const courseMap = new Map((courses || []).map((c) => [c.code.toUpperCase(), c.id]));

    // 2. Fetch profiles to match student emails
    const emails = Array.from(new Set(validRows.map((r) => r.studentIdentifier.toLowerCase())));
    const { data: profiles } = await supabase.from('profiles').select('id, email').in('email', emails);
    const profileMap = new Map((profiles || []).map((p) => [p.email?.toLowerCase(), p.id]));

    const attemptsToInsert = [];
    for (const r of validRows) {
      const courseId = courseMap.get(r.courseCode.toUpperCase());
      const studentId = profileMap.get(r.studentIdentifier.toLowerCase()) || user.id;

      if (courseId) {
        attemptsToInsert.push({
          student_id: studentId,
          course_id: courseId,
          credit_hours: r.creditHours,
          ca_score: r.caScore,
          exam_score: r.examScore,
          total_score: r.calculatedTotal,
          raw_total: r.calculatedTotal,
          rounded_total: r.roundedTotal,
          letter_grade: r.calculatedGrade,
          grade_point: r.gradePoint,
          quality_points: r.qualityPoints,
          academic_year: r.academicYear,
          semester: r.semester,
          is_verified: true,
        });
      }
    }

    if (attemptsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('course_attempts').insert(attemptsToInsert);
      if (insertError) {
        // Return structured error
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // 3. Create Audit Log Entry
    try {
      await supabase.from('audit_logs').insert({
        action: 'batch_grade_upload',
        entity_type: 'course_attempts',
        entity_id: validRows[0]?.courseCode || 'MULTIPLE',
        details: {
          row_count: validRows.length,
          uploaded_by: user.email,
          academic_year: validRows[0]?.academicYear,
          semester: validRows[0]?.semester,
        },
      });
    } catch {
      // Non-fatal if audit logging encounters an issue
    }

    return NextResponse.json({
      success: true,
      committedCount: validRows.length,
      message: `Successfully committed ${validRows.length} grade attempts to institutional database.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
