import { NextRequest, NextResponse } from 'next/server';
import { requireRol } from '@/lib/auth';
import { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';

export async function GET(request: NextRequest) {
  try {
    await requireRol('daar');
    const semestre = request.nextUrl.searchParams.get('semestre') ?? '2026-I';
    const data = await getDashboardDaarData(semestre);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'No autenticado' || msg === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
