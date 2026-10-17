import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'supabase', 'COMPLETE_SYSTEM_BOOTSTRAP.sql');
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Bootstrap SQL file not found', { status: 404 });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="COMPLETE_SYSTEM_BOOTSTRAP.sql"',
      },
    });
  } catch (error: any) {
    return new NextResponse(error?.message || 'Internal error', { status: 500 });
  }
}
