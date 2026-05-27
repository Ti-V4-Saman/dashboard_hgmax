import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const schema = await query('DESCRIBE metas');
    return NextResponse.json({ schema });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
