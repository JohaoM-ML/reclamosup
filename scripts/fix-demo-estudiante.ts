/**
 * Prepara al estudiante demo: nombre, 5 cursos distintos matriculados, sin reclamos previos.
 * Uso: npm run demo:reset
 */
import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';
import { esCursoExcluidoReclamoDigital } from '../lib/cursos-reclamo-estandar';
import type { PartesNombre } from '../lib/email-up';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
const EMAIL_ESTUDIANTE = 'jr.mendozaf@alum.up.edu.pe';
const EMAIL_DOCENTE = 'pa.tueroc@alum.up.edu.pe';
const CODIGO_DEMO_DOCENTE = '000100001';
const SEMESTRE = '2026-I';
const CURSOS_POR_ESTUDIANTE = 5;
const PLAZO_DIAS = 30;

const DEMO_ESTUDIANTE: PartesNombre = {
  nombres: 'Johao Rafael',
  apellidoPaterno: 'Mendoza',
  apellidoMaterno: 'Fabian',
};

function addDias(fecha: Date, dias: number) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

function pickCursosDistintosPorCodigo<
  T extends { id: string; codigo: string; nombre: string; docenteId: string },
>(cursos: T[], n: number): T[] {
  const out: T[] = [];
  const codigos = new Set<string>();
  for (const c of cursos) {
    if (esCursoExcluidoReclamoDigital(c.nombre)) continue;
    if (codigos.has(c.codigo)) continue;
    codigos.add(c.codigo);
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
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
      docente: { select: { codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true } },
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

  const nombreCompleto = `${DEMO_ESTUDIANTE.nombres} ${DEMO_ESTUDIANTE.apellidoPaterno} ${DEMO_ESTUDIANTE.apellidoMaterno}`;

  await prisma.alumno.update({
    where: { userId: estudiante.id },
    data: {
      ...DEMO_ESTUDIANTE,
      impedidoHastaSemestre: null,
    },
  });

  const cursosGiuliana = await prisma.curso.findMany({
    where: { docenteId: docente.id, semestre: SEMESTRE },
    orderBy: [{ codigo: 'asc' }, { seccion: 'asc' }],
  });

  const otrosCursos = await prisma.curso.findMany({
    where: { docenteId: { not: docente.id }, semestre: SEMESTRE },
    orderBy: [{ codigo: 'asc' }, { seccion: 'asc' }],
  });

  const matriculaCursos = [
    ...pickCursosDistintosPorCodigo(cursosGiuliana, CURSOS_POR_ESTUDIANTE),
    ...pickCursosDistintosPorCodigo(otrosCursos, CURSOS_POR_ESTUDIANTE),
  ]
    .filter(
      (c, i, arr) =>
        arr.findIndex((x) => x.codigo === c.codigo) === i &&
        !esCursoExcluidoReclamoDigital(c.nombre)
    )
    .slice(0, CURSOS_POR_ESTUDIANTE);

  await prisma.matricula.deleteMany({ where: { estudianteId: estudiante.id } });
  await prisma.matricula.createMany({
    data: matriculaCursos.map((c) => ({ estudianteId: estudiante.id, cursoId: c.id })),
    skipDuplicates: true,
  });

  const plazoReclamo = addDias(new Date(), PLAZO_DIAS);
  await prisma.evaluacion.updateMany({
    where: { cursoId: { in: matriculaCursos.map((c) => c.id) } },
    data: { fechaLimiteReclamo: plazoReclamo },
  });
  console.log(`Plazos de reclamo extendidos hasta ${plazoReclamo.toLocaleDateString('es-PE')}`);

  console.log(`Matrículas (${matriculaCursos.length} cursos distintos):`);
  for (const c of matriculaCursos) {
    const tag = c.docenteId === docente.id ? 'Giuliana' : 'otro docente';
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
