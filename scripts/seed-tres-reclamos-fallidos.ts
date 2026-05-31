/**
 * Crea 3 reclamos cerrados "no procede" para un estudiante demo de sanción.
 * Cursos fijos: Lenguaje I, Matemáticas I, Economía General I.
 * Crea curso + evaluaciones + matrícula si no existen en BD.
 * Uso: npx tsx scripts/seed-tres-reclamos-fallidos.ts [email]
 */
import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';
import { semestreSiguiente } from '../lib/domain/semestre-academico';
import { departamentoDesdeCodigo } from '../lib/departamento';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

/** No usar jr.mendozaf — es la cuenta demo de presentación en vivo. */
export const EMAIL_DEMO_IMPEDIDO = 'cpalaciosc@alum.up.edu.pe';
const EMAIL = process.argv[2] ?? EMAIL_DEMO_IMPEDIDO;
const SEMESTRE = '2026-I';
const EMAIL_DOCENTE_FALLBACK = 'pa.tueroc@alum.up.edu.pe';

const CURSOS_RECLAMO = [
  { codigo: '120001', nombre: 'Lenguaje I', creditos: 4 },
  { codigo: '138649', nombre: 'Matemáticas I', creditos: 5 },
  { codigo: '132641', nombre: 'Economía General I', creditos: 5 },
] as const;

function plazoReclamo() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

async function getDocenteFallbackId() {
  const docente = await prisma.user.findUnique({
    where: { email: EMAIL_DOCENTE_FALLBACK },
    select: { id: true },
  });
  if (!docente) {
    const any = await prisma.user.findFirst({ where: { rol: 'docente' }, select: { id: true } });
    if (!any) throw new Error('No hay docentes en la BD');
    return any.id;
  }
  return docente.id;
}

async function ensureCursoConEvaluaciones(
  spec: (typeof CURSOS_RECLAMO)[number],
  docenteId: string
) {
  let curso = await prisma.curso.findFirst({
    where: { codigo: spec.codigo, semestre: SEMESTRE },
    include: { evaluaciones: { orderBy: { createdAt: 'asc' } } },
    orderBy: { seccion: 'asc' },
  });

  if (!curso) {
    console.log(`  Creando curso ${spec.codigo} ${spec.nombre}...`);
    const plazo = plazoReclamo();
    curso = await prisma.curso.create({
      data: {
        codigo: spec.codigo,
        seccion: 'A',
        nombre: spec.nombre,
        creditos: spec.creditos,
        departamento: departamentoDesdeCodigo(spec.codigo),
        docenteId,
        semestre: SEMESTRE,
        evaluaciones: {
          create: [
            {
              tipo: 'parcial',
              nombre: 'Parcial',
              notaPublicada: 11.5,
              fechaLimiteReclamo: plazo,
            },
            {
              tipo: 'final',
              nombre: 'Final',
              notaPublicada: 12,
              fechaLimiteReclamo: plazo,
            },
          ],
        },
      },
      include: { evaluaciones: { orderBy: { createdAt: 'asc' } } },
    });
  } else if (curso.evaluaciones.length === 0) {
    console.log(`  Agregando evaluaciones a ${spec.codigo} ${spec.nombre}...`);
    const plazo = plazoReclamo();
    await prisma.evaluacion.createMany({
      data: [
        {
          cursoId: curso.id,
          tipo: 'parcial',
          nombre: 'Parcial',
          notaPublicada: 11.5,
          fechaLimiteReclamo: plazo,
        },
        {
          cursoId: curso.id,
          tipo: 'final',
          nombre: 'Final',
          notaPublicada: 12,
          fechaLimiteReclamo: plazo,
        },
      ],
    });
    curso = await prisma.curso.findUniqueOrThrow({
      where: { id: curso.id },
      include: { evaluaciones: { orderBy: { createdAt: 'asc' } } },
    });
  }

  return curso;
}

async function ensureMatricula(estudianteId: string, cursoId: string) {
  await prisma.matricula.upsert({
    where: { estudianteId_cursoId: { estudianteId, cursoId } },
    create: { estudianteId, cursoId },
    update: {},
  });
}

async function main() {
  const estudiante = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, email: true },
  });
  if (!estudiante) throw new Error(`No se encontró estudiante: ${EMAIL}`);

  const daar = await prisma.user.findFirst({ where: { rol: 'daar' }, select: { id: true } });
  if (!daar) throw new Error('No hay usuario DAAR');

  const docenteFallbackId = await getDocenteFallbackId();

  console.log('Preparando cursos objetivo...');
  const slots: Array<{
    curso: { id: string; codigo: string; nombre: string; docenteId: string };
    evaluacion: { id: string; notaPublicada: number | null; nombre: string };
  }> = [];

  for (const spec of CURSOS_RECLAMO) {
    const curso = await ensureCursoConEvaluaciones(spec, docenteFallbackId);
    await ensureMatricula(estudiante.id, curso.id);

    const parcial = curso.evaluaciones.find((e) => e.tipo === 'parcial') ?? curso.evaluaciones[0];
    if (!parcial) throw new Error(`Sin evaluación parcial en ${spec.nombre}`);

    slots.push({
      curso: {
        id: curso.id,
        codigo: curso.codigo,
        nombre: curso.nombre,
        docenteId: curso.docenteId,
      },
      evaluacion: {
        id: parcial.id,
        notaPublicada: parcial.notaPublicada,
        nombre: parcial.nombre,
      },
    });
    console.log(`  OK ${curso.codigo} ${curso.nombre} (${curso.seccion ?? 'A'})`);
  }

  const existentes = await prisma.reclamo.findMany({
    where: { estudianteId: estudiante.id },
    select: { id: true },
  });
  if (existentes.length > 0) {
    const ids = existentes.map((r) => r.id);
    await prisma.reclamoEvento.deleteMany({ where: { reclamoId: { in: ids } } });
    await prisma.notificacion.deleteMany({ where: { reclamoId: { in: ids } } });
    await prisma.reclamo.deleteMany({ where: { estudianteId: estudiante.id } });
    console.log(`\nEliminados ${existentes.length} reclamo(s) previo(s)`);
  }

  const motivos = ['revision_integral', 'otro', 'revision_integral'] as const;
  const now = new Date();

  console.log('\nCreando reclamos no procede...');
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const notaAnterior = slot.evaluacion.notaPublicada ?? 12;
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - (12 - i * 3));

    const reclamo = await prisma.reclamo.create({
      data: {
        evaluacionId: slot.evaluacion.id,
        estudianteId: estudiante.id,
        docenteId: slot.curso.docenteId,
        operadorDaarId: daar.id,
        semestreAcademico: SEMESTRE,
        motivo: motivos[i],
        argumento: 'Solicito revisión integral del examen conforme al reglamento.',
        examenNoLapiz: true,
        notaAnterior,
        notaNueva: notaAnterior,
        estado: 'CERRADO',
        decision: 'no_procedente',
        resultadoFinal: 'no_procede',
        comentarioDocente: 'No procede — se mantiene la nota original.',
        archivoPath: `seed/fallido-${slot.curso.codigo}.pdf`,
        archivoHash: `fail${slot.curso.codigo}`,
        escaneadoAt: createdAt,
        createdAt,
        updatedAt: createdAt,
      },
    });

    const t1 = new Date(createdAt.getTime() + 86400000);
    const t2 = new Date(createdAt.getTime() + 172800000);
    const t3 = new Date(createdAt.getTime() + 259200000);

    await prisma.reclamoEvento.createMany({
      data: [
        {
          reclamoId: reclamo.id,
          actorId: estudiante.id,
          accion: 'ESTUDIANTE_REGISTRO',
          estadoAnterior: null,
          estadoNuevo: 'ENVIADO',
          createdAt,
        },
        {
          reclamoId: reclamo.id,
          actorId: slot.curso.docenteId,
          accion: 'DOCENTE_TOMO_CASO',
          estadoAnterior: 'ENVIADO',
          estadoNuevo: 'EN_REVISION',
          createdAt: t1,
        },
        {
          reclamoId: reclamo.id,
          actorId: slot.curso.docenteId,
          accion: 'DOCENTE_RESOLVIO',
          estadoAnterior: 'EN_REVISION',
          estadoNuevo: 'EN_VALIDACION',
          createdAt: t2,
        },
        {
          reclamoId: reclamo.id,
          actorId: daar.id,
          accion: 'DAAR_CERRO',
          estadoAnterior: 'EN_VALIDACION',
          estadoNuevo: 'CERRADO',
          createdAt: t3,
        },
      ],
    });

    console.log(`  Reclamo ${i + 1}: ${slot.curso.nombre} (Parcial) → No procede`);
  }

  const impedidoHasta = semestreSiguiente(SEMESTRE);
  await prisma.alumno.update({
    where: { userId: estudiante.id },
    data: { impedidoHastaSemestre: impedidoHasta },
  });

  console.log('');
  console.log('Listo');
  console.log(`  Correo:     ${estudiante.email}`);
  console.log(`  Contraseña: reclamoup1234`);
  console.log(`  Reclamos:   Lenguaje I, Matemáticas I, Economía General I — No procede`);
  console.log(`  Impedido:   hasta semestre ${impedidoHasta}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
