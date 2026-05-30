import { prisma } from '@/lib/db';
import { estaImpedidoParaSemestre } from '@/lib/domain/semestre-academico';

export class ValidacionError extends Error {
  constructor(
    public codigo: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidacionError';
  }
}

export async function assertPuedeReclamar(
  estudianteId: string,
  evaluacionId: string
) {
  const evaluacion = await prisma.evaluacion.findUniqueOrThrow({
    where: { id: evaluacionId },
    include: { curso: { select: { codigo: true, semestre: true } } },
  });

  const alumno = await prisma.alumno.findUnique({
    where: { userId: estudianteId },
    select: { impedidoHastaSemestre: true },
  });

  if (
    alumno &&
    estaImpedidoParaSemestre(alumno.impedidoHastaSemestre, evaluacion.curso.semestre)
  ) {
    throw new ValidacionError(
      'R2',
      `Está impedido de reclamar hasta el semestre ${alumno.impedidoHastaSemestre} (3 reclamos no procedentes en el semestre anterior)`
    );
  }

  const existenteEnCurso = await prisma.reclamo.findFirst({
    where: {
      estudianteId,
      evaluacion: { curso: { codigo: evaluacion.curso.codigo } },
    },
  });

  if (existenteEnCurso) {
    throw new ValidacionError(
      'R6',
      'Ya existe un reclamo para este curso (parcial o final)'
    );
  }
}

export async function assertDentroDePlazo(evaluacionId: string) {
  const ev = await prisma.evaluacion.findUniqueOrThrow({
    where: { id: evaluacionId },
  });

  if (new Date() > ev.fechaLimiteReclamo) {
    throw new ValidacionError('R7', 'Plazo de reclamo vencido');
  }
}

export async function assertExamenNoLapiz(examenNoLapiz: boolean) {
  if (!examenNoLapiz) {
    throw new ValidacionError(
      'R5',
      'No procede reclamo si el examen fue hecho con lápiz'
    );
  }
}

/** Tras cerrar un reclamo no procedente: sanción semestre siguiente si llega a 3. */
export async function aplicarSancionSiCorresponde(
  estudianteId: string,
  semestreAcademico: string,
  motivo: string
) {
  if (motivo === 'error_suma') return;

  const noProcedentesCerrados = await prisma.reclamo.count({
    where: {
      estudianteId,
      semestreAcademico,
      estado: 'CERRADO',
      decision: 'no_procedente',
      motivo: { not: 'error_suma' },
    },
  });

  if (noProcedentesCerrados < 3) return;

  const { semestreSiguiente } = await import('@/lib/domain/semestre-academico');
  const sancionHasta = semestreSiguiente(semestreAcademico);

  await prisma.alumno.update({
    where: { userId: estudianteId },
    data: { impedidoHastaSemestre: sancionHasta },
  });
}
