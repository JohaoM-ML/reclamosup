import { NextRequest, NextResponse } from 'next/server';
import { requireRol } from '@/lib/auth';
import { getEvaluacionesEstudiante } from '@/lib/services/reclamo.service';

export async function GET(request: NextRequest) {
  try {
    const session = await requireRol('estudiante', 'daar');
    const estudianteId =
      session.rol === 'estudiante'
        ? session.id
        : request.nextUrl.searchParams.get('estudianteId');

    if (!estudianteId) {
      return NextResponse.json([]);
    }

    const cursoId = request.nextUrl.searchParams.get('cursoId') ?? undefined;
    const seccion = request.nextUrl.searchParams.get('seccion') ?? undefined;
    const evaluaciones = await getEvaluacionesEstudiante(estudianteId, cursoId, seccion);
    return NextResponse.json(evaluaciones);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}
