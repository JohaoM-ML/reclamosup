/**
 * Matricula a Juan Renato en cursos de Giuliana (docente demo) y crea reclamos demo.
 * Uso: npx tsx scripts/fix-demo-estudiante.ts
 */
import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';
import { esCursoExcluidoReclamoDigital } from '../lib/cursos-reclamo-estandar';
import { calcularResultadoFinal } from '../lib/domain/resultado-final';
import { inicioCiclo } from '../lib/domain/ciclo-semanas';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
const EMAIL_ESTUDIANTE = 'jr.mendozaf@alum.up.edu.pe';
const EMAIL_DOCENTE = 'pa.tueroc@alum.up.edu.pe';
const SEMESTRE = '2026-I';
const CURSOS_POR_ESTUDIANTE = 5;

function addDias(fecha: Date, dias: number) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

function fechaEnSemanaCiclo(semana: number, offsetDias = 0) {
  const base = inicioCiclo(SEMESTRE);
  base.setDate(base.getDate() + (semana - 1) * 7 + offsetDias);
  base.setHours(10, 30, 0, 0);
  return base;
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
    select: { id: true, docente: { select: { nombres: true, apellidoPaterno: true, apellidoMaterno: true } } },
  });
  const daar = await prisma.user.findUnique({
    where: { email: 'Ap.Carhuavilcac@alum.up.edu.pe' },
    select: { id: true },
  });

  if (!estudiante) {
    console.error('No se encontró estudiante', EMAIL_ESTUDIANTE);
    process.exit(1);
  }
  if (!docente) {
    console.error('No se encontró docente', EMAIL_DOCENTE);
    process.exit(1);
  }

  const nombreDocente = docente.docente
    ? `${docente.docente.nombres} ${docente.docente.apellidoPaterno} ${docente.docente.apellidoMaterno}`.trim()
    : EMAIL_DOCENTE;

  await prisma.alumno.update({
    where: { userId: estudiante.id },
    data: { impedidoHastaSemestre: null },
  });

  const cursosGiuliana = await prisma.curso.findMany({
    where: { docenteId: docente.id },
    orderBy: [{ codigo: 'asc' }, { seccion: 'asc' }],
  });

  const otrosCursos = await prisma.curso.findMany({
    where: { docenteId: { not: docente.id } },
    orderBy: [{ codigo: 'asc' }, { seccion: 'asc' }],
  });
  const extras = pickCursosDistintosPorCodigo(
    otrosCursos,
    Math.max(0, CURSOS_POR_ESTUDIANTE - cursosGiuliana.length)
  );
  const matriculaCursos = [...cursosGiuliana, ...extras].slice(0, CURSOS_POR_ESTUDIANTE);

  await prisma.matricula.deleteMany({ where: { estudianteId: estudiante.id } });
  await prisma.matricula.createMany({
    data: matriculaCursos.map((c) => ({ estudianteId: estudiante.id, cursoId: c.id })),
    skipDuplicates: true,
  });

  console.log(`Matrículas (${matriculaCursos.length}) — docente ${nombreDocente}:`);
  for (const c of cursosGiuliana) {
    console.log(`  ✓ ${c.codigo} ${c.nombre} (${c.seccion})`);
  }
  for (const c of extras) {
    console.log(`  · ${c.codigo} ${c.nombre} (${c.seccion}) — otro docente`);
  }

  const existentes = await prisma.reclamo.findMany({
    where: { estudianteId: estudiante.id },
    select: { id: true },
  });
  if (existentes.length > 0) {
    await prisma.reclamoEvento.deleteMany({
      where: { reclamoId: { in: existentes.map((r) => r.id) } },
    });
    await prisma.reclamo.deleteMany({ where: { estudianteId: estudiante.id } });
    console.log(`\nEliminados ${existentes.length} reclamos previos`);
  }

  const porCodigo = new Map<string, (typeof cursosGiuliana)[0]>();
  for (const c of cursosGiuliana) {
    if (esCursoExcluidoReclamoDigital(c.nombre)) continue;
    if (!porCodigo.has(c.codigo)) porCodigo.set(c.codigo, c);
  }
  const cursosReclamo = [...porCodigo.values()];

  type Estado = 'ENVIADO' | 'EN_REVISION' | 'CERRADO';
  const configs: Array<{ estado: Estado; idx: number }> =
    cursosReclamo.length >= 3
      ? [
          { estado: 'ENVIADO', idx: 0 },
          { estado: 'EN_REVISION', idx: 1 },
          { estado: 'CERRADO', idx: 2 },
        ]
      : cursosReclamo.length >= 2
        ? [{ estado: 'ENVIADO', idx: 0 }]
        : [{ estado: 'ENVIADO', idx: 0 }];

  let creados = 0;

  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const curso = cursosReclamo[cfg.idx];
    if (!curso) continue;

    const ev = await prisma.evaluacion.findFirst({
      where: { cursoId: curso.id, tipo: 'parcial' },
    });
    if (!ev) continue;

    const createdAt = fechaEnSemanaCiclo(2 + i, i);
    const notaAnterior = ev.notaPublicada ?? 12;
    const notaNueva =
      cfg.estado === 'CERRADO'
        ? Math.min(20, Math.round((notaAnterior + 1.5) * 10) / 10)
        : undefined;

    const reclamo = await prisma.reclamo.create({
      data: {
        evaluacionId: ev.id,
        estudianteId: estudiante.id,
        docenteId: docente.id,
        semestreAcademico: SEMESTRE,
        motivo: 'error_suma',
        argumento:
          'Solicito revisión de mi examen conforme al reglamento vigente y adjunto sustento.',
        examenNoLapiz: true,
        notaAnterior,
        estado: cfg.estado,
        createdAt,
        updatedAt: createdAt,
        escaneadoAt: createdAt,
        archivoPath: `/uploads/seed/demo-estudiante-${i}.pdf`,
        archivoHash: `demo${i.toString().padStart(4, '0')}`,
        ...(cfg.estado === 'CERRADO' && notaNueva != null
          ? {
              decision: 'procedente',
              resultadoFinal: calcularResultadoFinal('procedente', notaAnterior, notaNueva),
              notaNueva,
              comentarioDocente: 'Revisión favorable con modificación de nota.',
            }
          : {}),
      },
    });
    creados++;

    await prisma.reclamoEvento.create({
      data: {
        reclamoId: reclamo.id,
        actorId: estudiante.id,
        accion: 'ESTUDIANTE_REGISTRO',
        estadoNuevo: 'ENVIADO',
        createdAt,
      },
    });

    if (cfg.estado === 'EN_REVISION' || cfg.estado === 'CERRADO') {
      const toma = addDias(createdAt, 1);
      await prisma.reclamoEvento.create({
        data: {
          reclamoId: reclamo.id,
          actorId: docente.id,
          accion: 'DOCENTE_TOMO_CASO',
          estadoAnterior: 'ENVIADO',
          estadoNuevo: 'EN_REVISION',
          createdAt: toma,
        },
      });
    }

    if (cfg.estado === 'CERRADO' && notaNueva != null) {
      const resolvio = addDias(createdAt, 3);
      const cierre = addDias(createdAt, 5);
      await prisma.reclamoEvento.createMany({
        data: [
          {
            reclamoId: reclamo.id,
            actorId: docente.id,
            accion: 'DOCENTE_RESOLVIO',
            estadoAnterior: 'EN_REVISION',
            estadoNuevo: 'EN_VALIDACION',
            createdAt: resolvio,
          },
          {
            reclamoId: reclamo.id,
            actorId: daar?.id ?? docente.id,
            accion: 'DAAR_CERRO',
            estadoAnterior: 'EN_VALIDACION',
            estadoNuevo: 'CERRADO',
            createdAt: cierre,
          },
        ],
      });
      await prisma.reclamo.update({
        where: { id: reclamo.id },
        data: { updatedAt: cierre },
      });
    }

    console.log(`  ${cfg.estado} — ${curso.nombre} → ${nombreDocente}`);
  }

  const libresGiuliana = cursosReclamo.length - configs.length;
  console.log('');
  console.log(`OK: Juan Renato Mendoza Flores`);
  console.log(`  ${creados} reclamo(s) asignados a ${nombreDocente}`);
  console.log(`  ${Math.max(0, libresGiuliana)} curso(s) de Giuliana libre(s) para nuevo reclamo`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
