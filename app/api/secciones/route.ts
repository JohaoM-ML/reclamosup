import { NextRequest, NextResponse } from 'next/server';
import { requireRol } from '@/lib/auth';
import { getSeccionesEstudiante } from '@/lib/services/reclamo.service';

export async function GET(request: NextRequest) {
  try {
    const session = await requireRol('estudiante', 'daar');
    const codigoCurso = request.nextUrl.searchParams.get('cursoId');

    if (!codigoCurso) {
      return NextResponse.json([]);
    }

    const estudianteId =
      session.rol === 'estudiante'
        ? session.id
        : request.nextUrl.searchParams.get('estudianteId');

    if (!estudianteId) {
      return NextResponse.json([]);
    }

    const secciones = await getSeccionesEstudiante(estudianteId, codigoCurso);
    return NextResponse.json(secciones);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}
