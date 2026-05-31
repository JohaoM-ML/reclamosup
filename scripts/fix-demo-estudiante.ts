/**
 * Prepara al estudiante demo Johao: 5 cursos fijos, sin reclamos, Matemáticas I con Giuliana.
 * Uso: npm run demo:reset
 */
import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';
import { departamentoDesdeCodigo } from '../lib/departamento';
import type { PartesNombre } from '../lib/email-up';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
const EMAIL_ESTUDIANTE = 'jr.mendozaf@alum.up.edu.pe';
const EMAIL_DOCENTE = 'pa.tueroc@alum.up.edu.pe';
const CODIGO_DEMO_DOCENTE = '000100001';
const SEMESTRE = '2026-I';
const PLAZO_DIAS = 30;

const DEMO_ESTUDIANTE: PartesNombre = {
  nombres: 'Johao Rafael',
  apellidoPaterno: 'Mendoza',
  apellidoMaterno: 'Fabian',
};

/** Cursos fijos para la demo de Johao (código + sección UP). */
const CURSOS_JOHAO_DEMO = [
  { codigo: '138649', nombre: 'Matemáticas I', seccion: 'A', creditos: 5, docenteGiuliana: true },
  { codigo: '132641', nombre: 'Economía General I', seccion: 'A', creditos: 5, docenteGiuliana: false },
  { codigo: '120001', nombre: 'Lenguaje I', seccion: 'A', creditos: 4, docenteGiuliana: false },
  { codigo: '170211', nombre: 'Introducción a la Ingeniería', seccion: 'C', creditos: 4, docenteGiuliana: false },
  { codigo: '120133', nombre: 'Ética', seccion: 'A', creditos: 4, docenteGiuliana: false },
] as const;

function addDias(fecha: Date, dias: number) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

function plazoReclamo() {
  return addDias(new Date(), PLAZO_DIAS);
}

async function getOtroDocenteId(giulianaId: string) {
  const otro = await prisma.user.findFirst({
    where: { rol: 'docente', id: { not: giulianaId } },
    select: { id: true },
  });
  if (!otro) throw new Error('No hay otro docente en la BD');
  return otro.id;
}

async function ensureEvaluaciones(cursoId: string) {
  const count = await prisma.evaluacion.count({ where: { cursoId } });
  if (count > 0) return;
  const plazo = plazoReclamo();
  await prisma.evaluacion.createMany({
    data: [
      { cursoId, tipo: 'parcial', nombre: 'Parcial', notaPublicada: 13, fechaLimiteReclamo: plazo },
      { cursoId, tipo: 'final', nombre: 'Final', notaPublicada: 14, fechaLimiteReclamo: plazo },
    ],
  });
}

async function ensureCurso(
  spec: (typeof CURSOS_JOHAO_DEMO)[number],
  giulianaId: string,
  otroDocenteId: string
) {
  const docenteId = spec.docenteGiuliana ? giulianaId : otroDocenteId;

  let curso = await prisma.curso.findFirst({
    where: { codigo: spec.codigo, seccion: spec.seccion, semestre: SEMESTRE },
  });

  if (!curso) {
    curso = await prisma.curso.create({
      data: {
        codigo: spec.codigo,
        seccion: spec.seccion,
        nombre: spec.nombre,
        creditos: spec.creditos,
        departamento: departamentoDesdeCodigo(spec.codigo),
        docenteId,
        semestre: SEMESTRE,
      },
    });
    console.log(`  Creado ${spec.codigo} ${spec.nombre} (${spec.seccion})`);
  } else if (spec.docenteGiuliana && curso.docenteId !== giulianaId) {
    await prisma.curso.update({
      where: { id: curso.id },
      data: { docenteId: giulianaId },
    });
    console.log(`  Reasignado ${spec.nombre} (${spec.seccion}) → Giuliana`);
  } else if (!spec.docenteGiuliana && curso.docenteId === giulianaId) {
    await prisma.curso.update({
      where: { id: curso.id },
      data: { docenteId: otroDocenteId },
    });
    console.log(`  Reasignado ${spec.nombre} (${spec.seccion}) → otro docente`);
  }

  await ensureEvaluaciones(curso.id);

  const plazo = plazoReclamo();
  await prisma.evaluacion.updateMany({
    where: { cursoId: curso.id },
    data: { fechaLimiteReclamo: plazo },
  });

  return prisma.curso.findUniqueOrThrow({ where: { id: curso.id } });
}

async function main() {
  const estudiante = await prisma.user.findUnique({
    where: { email: EMAIL_ESTUDIANTE },
    select: { id: true },
  });
  const docente = await prisma.user.findUnique({
    where: { email: EMAIL_DOCENTE },
    select: {
      id: true,
      docente: { select: { codigo: true } },
    },
  });

  if (!estudiante) {
    console.error('No se encontró estudiante', EMAIL_ESTUDIANTE);
    process.exit(1);
  }
  if (!docente) {
    console.error('No se encontró docente', EMAIL_DOCENTE);
    process.exit(1);
  }

  if (docente.docente && !docente.docente.codigo) {
    await prisma.docente.update({
      where: { userId: docente.id },
      data: { codigo: CODIGO_DEMO_DOCENTE },
    });
  }

  const otroDocenteId = await getOtroDocenteId(docente.id);
  const nombreCompleto = `${DEMO_ESTUDIANTE.nombres} ${DEMO_ESTUDIANTE.apellidoPaterno} ${DEMO_ESTUDIANTE.apellidoMaterno}`;

  await prisma.alumno.update({
    where: { userId: estudiante.id },
    data: {
      ...DEMO_ESTUDIANTE,
      impedidoHastaSemestre: null,
    },
  });

  console.log('Preparando cursos demo...');
  const matriculaCursos = [];
  for (const spec of CURSOS_JOHAO_DEMO) {
    const curso = await ensureCurso(spec, docente.id, otroDocenteId);
    matriculaCursos.push(curso);
  }

  await prisma.matricula.deleteMany({ where: { estudianteId: estudiante.id } });
  await prisma.matricula.createMany({
    data: matriculaCursos.map((c) => ({ estudianteId: estudiante.id, cursoId: c.id })),
    skipDuplicates: true,
  });

  const fechaPlazo = plazoReclamo();
  console.log(`Plazos de reclamo extendidos hasta ${fechaPlazo.toLocaleDateString('es-PE')}`);

  console.log(`Matrículas (${matriculaCursos.length} cursos):`);
  for (const c of matriculaCursos) {
    const tag = c.docenteId === docente.id ? 'Giuliana (pa.tueroc)' : 'otro docente';
    console.log(`  · ${c.codigo} ${c.nombre} (${c.seccion}) — ${tag}`);
  }

  const existentes = await prisma.reclamo.findMany({
    where: { estudianteId: estudiante.id },
    select: { id: true },
  });
  if (existentes.length > 0) {
    await prisma.reclamoEvento.deleteMany({
      where: { reclamoId: { in: existentes.map((r) => r.id) } },
    });
    await prisma.notificacion.deleteMany({
      where: { reclamoId: { in: existentes.map((r) => r.id) } },
    });
    await prisma.reclamo.deleteMany({ where: { estudianteId: estudiante.id } });
    console.log(`\nEliminados ${existentes.length} reclamo(s) previo(s)`);
  } else {
    console.log('\nSin reclamos previos que eliminar');
  }

  console.log('');
  console.log(`OK: ${nombreCompleto}`);
  console.log(`  0 reclamos — puede registrar hasta ${matriculaCursos.length} en cursos distintos`);
  console.log(`  Docente demo recibe reclamos de: Matemáticas I (${SEMESTRE}-A)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
