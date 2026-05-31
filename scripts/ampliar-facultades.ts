/**
 * Añade cursos de la oferta académica por área (prefijos 12–18) que falten en BD,
 * con código UP real, docente, evaluaciones, matrículas y reclamos demo.
 *
 * Uso: npm run db:ampliar-facultades
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createPrismaClient } from '../lib/create-prisma-client';
import { CONTRASENA_INICIAL } from '../lib/contrasena-inicial';
import { generarCodigoUpAleatorio } from '../lib/codigo-up';
import { departamentoDesdeCodigo, PREFIJOS_OFERTA, areaDesdePrefijo } from '../lib/departamento';
import { calcularResultadoFinal } from '../lib/domain/resultado-final';
import { inicioCiclo } from '../lib/domain/ciclo-semanas';
import { esCursoExcluidoReclamoDigital } from '../lib/cursos-reclamo-estandar';
import { seleccionarOfertaPorFacultad } from '../lib/oferta-por-facultad';
import {
  emailDocenteUp,
  emailUnico,
  parseNombreProfesor,
  type PartesNombre,
} from '../lib/email-up';
import type { OfertaSeccion } from '../scripts/parse-oferta-academica';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

const SEMESTRE = '2026-I';
const CURSOS_POR_PREFIJO = 4;
const EMAIL_DEMO_ESTUDIANTE = 'jr.mendozaf@alum.up.edu.pe';
const PLAZO_DIAS = 30;
const RECLAMOS_POR_CURSO_NUEVO = 2;

function cargarOferta(): OfertaSeccion[] {
  const jsonPath = path.resolve(__dirname, '../prisma/data/oferta-2026-1.json');
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as OfertaSeccion[];
}

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

function notaAleatoria() {
  return Math.round((8 + Math.random() * 12) * 10) / 10;
}

async function obtenerOCrearDocente(
  profesorRaw: string,
  password: string,
  docentePorNombre: Map<string, string>,
  emailsUsados: Set<string>,
  codigosDocenteUsados: Set<string>
): Promise<string> {
  const existente = docentePorNombre.get(profesorRaw);
  if (existente) return existente;

  const partes = parseNombreProfesor(profesorRaw);
  const email = emailUnico(emailDocenteUp(partes), emailsUsados);

  let codigo: string;
  do {
    codigo = generarCodigoUpAleatorio();
  } while (codigosDocenteUsados.has(codigo));
  codigosDocenteUsados.add(codigo);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      rol: 'docente',
      docente: {
        create: {
          codigo,
          nombres: partes.nombres,
          apellidoPaterno: partes.apellidoPaterno,
          apellidoMaterno: partes.apellidoMaterno,
        },
      },
    },
  });

  docentePorNombre.set(profesorRaw, user.id);
  return user.id;
}

async function main() {
  console.log('Cargando oferta académica 2026-I…');
  const ofertaCompleta = cargarOferta();

  const existentes = await prisma.curso.findMany({
    where: { semestre: SEMESTRE },
    select: { codigo: true, seccion: true, departamento: true },
  });

  const clavesExistentes = new Set(existentes.map((c) => `${c.codigo}:${c.seccion}`));
  const prefijosActuales = new Set(existentes.map((c) => c.codigo.slice(0, 2)));

  console.log('Prefijos ya en BD:', [...prefijosActuales].sort().join(', ') || '(ninguno)');

  // Códigos UP que faltan por área según oferta
  const codigosEnBd = new Set(existentes.map((c) => c.codigo));
  const codigosPorPrefijoFaltante = new Map<string, string[]>();

  for (const pref of PREFIJOS_OFERTA) {
    if (prefijosActuales.has(pref) && pref === '12') {
      // Humanidades ya cargada; añadir códigos 12 faltantes si hay pocos
    }
    const codigosOferta = [
      ...new Set(
        ofertaCompleta
          .filter((s) => s.codigo.startsWith(pref) && !esCursoExcluidoReclamoDigital(s.nombre))
          .map((s) => s.codigo)
      ),
    ].sort();

    const faltantes = codigosOferta.filter((c) => !codigosEnBd.has(c)).slice(0, CURSOS_POR_PREFIJO);
    if (faltantes.length > 0) {
      codigosPorPrefijoFaltante.set(pref, faltantes);
    } else if (!prefijosActuales.has(pref)) {
      codigosPorPrefijoFaltante.set(pref, codigosOferta.slice(0, CURSOS_POR_PREFIJO));
    }
  }

  const codigosAAñadir = new Set([...codigosPorPrefijoFaltante.values()].flat());
  if (codigosAAñadir.size === 0) {
    console.log('No hay cursos nuevos por prefijo. Sincronizando departamentos…');
  } else {
    console.log('Códigos UP a añadir por área:');
    for (const [pref, codigos] of codigosPorPrefijoFaltante) {
      console.log(`  ${areaDesdePrefijo(pref) ?? pref}: ${codigos.join(', ')}`);
    }
  }

  const seccionesNuevas = seleccionarOfertaPorFacultad(ofertaCompleta, {
    cursosPorPrefijo: CURSOS_POR_PREFIJO,
    minSeccionesPorCurso: 1,
    maxSeccionesPorCurso: 2,
    soloCodigos: codigosAAñadir.size > 0 ? codigosAAñadir : undefined,
  }).filter((s) => !clavesExistentes.has(`${s.codigo}:${s.seccion}`));

  const password = await bcrypt.hash(CONTRASENA_INICIAL, 10);
  const docentePorNombre = new Map<string, string>();
  const emailsUsados = new Set(
    (await prisma.user.findMany({ select: { email: true } })).map((u) => u.email)
  );
  const codigosDocenteUsados = new Set(
    (await prisma.docente.findMany({ select: { codigo: true } })).map((d) => d.codigo)
  );

  const docentesDb = await prisma.docente.findMany({
    include: { user: { select: { id: true, email: true } } },
  });
  for (const d of docentesDb) {
    const nombre = `${d.nombres} ${d.apellidoPaterno} ${d.apellidoMaterno}`.trim();
    docentePorNombre.set(nombre, d.userId);
  }

  const plazoReclamo = addDias(new Date(), PLAZO_DIAS);
  let cursosCreados = 0;
  let evaluacionesCreadas = 0;
  const nuevosCursoIds: string[] = [];

  for (const s of seccionesNuevas) {
    const docenteId = await obtenerOCrearDocente(
      s.profesor,
      password,
      docentePorNombre,
      emailsUsados,
      codigosDocenteUsados
    );

    const curso = await prisma.curso.create({
      data: {
        codigo: s.codigo,
        seccion: s.seccion,
        nombre: s.nombre,
        creditos: s.creditos,
        departamento: departamentoDesdeCodigo(s.codigo),
        docenteId,
        semestre: SEMESTRE,
      },
    });
    cursosCreados++;
    nuevosCursoIds.push(curso.id);

    await prisma.evaluacion.createMany({
      data: [
        {
          cursoId: curso.id,
          tipo: 'parcial',
          nombre: 'Parcial',
          notaPublicada: notaAleatoria(),
          fechaLimiteReclamo: plazoReclamo,
        },
        {
          cursoId: curso.id,
          tipo: 'final',
          nombre: 'Final',
          notaPublicada: notaAleatoria(),
          fechaLimiteReclamo: plazoReclamo,
        },
      ],
    });
    evaluacionesCreadas += 2;

    console.log(
      `  + ${s.codigo} ${s.nombre} (${s.seccion}) — ${departamentoDesdeCodigo(s.codigo)}`
    );
  }

  // Sincronizar departamento en todos los cursos (código UP → área oferta)
  const todosCursos = await prisma.curso.findMany({ where: { semestre: SEMESTRE } });
  let deptActualizados = 0;
  for (const c of todosCursos) {
    const dept = departamentoDesdeCodigo(c.codigo);
    if (c.departamento !== dept) {
      await prisma.curso.update({ where: { id: c.id }, data: { departamento: dept } });
      deptActualizados++;
    }
  }

  // Matrículas: repartir estudiantes (excepto demo con carga fija) en cursos nuevos
  const estudiantes = await prisma.user.findMany({
    where: { rol: 'estudiante', email: { not: EMAIL_DEMO_ESTUDIANTE } },
    select: { id: true },
    take: 40,
  });

  let matriculasNuevas = 0;
  for (let i = 0; i < estudiantes.length && nuevosCursoIds.length > 0; i++) {
    const cursoId = nuevosCursoIds[i % nuevosCursoIds.length];
    try {
      await prisma.matricula.create({
        data: { estudianteId: estudiantes[i].id, cursoId },
      });
      matriculasNuevas++;
    } catch {
      /* duplicate estudiante-curso */
    }
  }

  // Reclamos demo en evaluaciones parciales de cursos nuevos
  let reclamosCreados = 0;
  if (nuevosCursoIds.length > 0) {
    const evaluaciones = await prisma.evaluacion.findMany({
      where: { cursoId: { in: nuevosCursoIds }, tipo: 'parcial' },
      include: { curso: { select: { docenteId: true, codigo: true } } },
    });

    for (const ev of evaluaciones) {
      const matriculas = await prisma.matricula.findMany({
        where: { cursoId: ev.cursoId },
        take: RECLAMOS_POR_CURSO_NUEVO,
      });

      for (let i = 0; i < matriculas.length; i++) {
        const m = matriculas[i];
        const yaReclamo = await prisma.reclamo.findFirst({
          where: { estudianteId: m.estudianteId, evaluacionId: ev.id },
        });
        if (yaReclamo) continue;

        const notaAnterior = ev.notaPublicada ?? 12;
        const createdAt = fechaEnSemanaCiclo(3 + (reclamosCreados % 6), i);
        const estados = ['ENVIADO', 'EN_REVISION', 'CERRADO'] as const;
        const estado = estados[reclamosCreados % estados.length];

        await prisma.reclamo.create({
          data: {
            evaluacionId: ev.id,
            estudianteId: m.estudianteId,
            docenteId: ev.curso.docenteId,
            semestreAcademico: SEMESTRE,
            motivo: 'error_suma',
            argumento: 'Solicito revisión conforme al reglamento vigente.',
            examenNoLapiz: true,
            notaAnterior,
            estado,
            createdAt,
            updatedAt: createdAt,
            escaneadoAt: createdAt,
            archivoPath: `/uploads/seed/ampliar-${ev.curso.codigo}-${i}.pdf`,
            archivoHash: `amp${reclamosCreados.toString().padStart(4, '0')}`,
            ...(estado === 'CERRADO'
              ? {
                  decision: 'procedente' as const,
                  resultadoFinal: calcularResultadoFinal('procedente', notaAnterior, notaAnterior + 1),
                  notaNueva: Math.min(20, notaAnterior + 1),
                  comentarioDocente: 'Revisión favorable.',
                }
              : {}),
          },
        });
        reclamosCreados++;
      }
    }
  }

  const resumen = await prisma.curso.groupBy({
    by: ['departamento'],
    where: { semestre: SEMESTRE },
    _count: { id: true },
  });

  console.log('');
  console.log('Resumen por área (oferta académica):');
  for (const r of resumen.sort((a, b) => a.departamento.localeCompare(b.departamento))) {
    console.log(`  ${r.departamento}: ${r._count.id} sección(es)`);
  }
  console.log('');
  console.log(`Cursos nuevos:      ${cursosCreados}`);
  console.log(`Evaluaciones:       ${evaluacionesCreadas}`);
  console.log(`Matrículas nuevas:  ${matriculasNuevas}`);
  console.log(`Reclamos nuevos:    ${reclamosCreados}`);
  console.log(`Dept. corregidos:   ${deptActualizados}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
