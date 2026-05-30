import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { leerExamenEscaneado } from '@/lib/services/archivo.service';
import { prisma } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reclamoId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { reclamoId } = await params;
  const reclamo = await prisma.reclamo.findUnique({ where: { id: reclamoId } });

  if (!reclamo) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const puedeVer =
    session.rol === 'daar' ||
    (session.rol === 'docente' && reclamo.docenteId === session.id) ||
    (session.rol === 'estudiante' && reclamo.estudianteId === session.id);

  if (!puedeVer) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  if (!reclamo.archivoPath) {
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 });
  }

  try {
    const { buffer, contentType } = await leerExamenEscaneado(reclamo.archivoPath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
}
