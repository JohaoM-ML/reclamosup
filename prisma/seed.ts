import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createPrismaClient } from '../lib/create-prisma-client';
import { CONTRASENA_INICIAL } from '../lib/contrasena-inicial';
import { generarCodigoUpAleatorio } from '../lib/codigo-up';
import { departamentoDesdeCodigo } from '../lib/departamento';
import { calcularResultadoFinal } from '../lib/domain/resultado-final';
import {
  emailAlumnoUp,
  emailDocenteUp,
  emailUnico,
  parseNombreEstudiante,
  parseNombreProfesor,
  type PartesNombre,
} from '../lib/email-up';
import { esCursoExcluidoReclamoDigital } from '../lib/cursos-reclamo-estandar';
import { inicioCiclo, PLAZO_DOCENTE_DIAS } from '../lib/domain/ciclo-semanas';
import type { OfertaSeccion } from '../scripts/parse-oferta-academica';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

const SEMESTRE = '2026-I';
/** Cuentas demo del equipo (hackathon). */
const EMAIL_DEMO_ESTUDIANTE = 'jr.mendozaf@alum.up.edu.pe';
const EMAIL_DEMO_DAAR = 'Ap.Carhuavilcac@alum.up.edu.pe';
const EMAIL_DEMO_DOCENTE = 'pa.tueroc@alum.up.edu.pe';
const CURSOS_POR_ESTUDIANTE = 5;
const TOTAL_ESTUDIANTES = 50;
const MAX_CURSOS = 20;
const MIN_SECCIONES_POR_CURSO = 2;
const MAX_SECCIONES_POR_CURSO = 4;
const TARGET_RECLAMOS = 98;
const BACKLOG_ABIERTO = 40;
const BATCH = 100;

const NOMBRES = [
  'Ana', 'Luis', 'Sofía', 'Diego', 'Valeria', 'Marco', 'Camila', 'Jorge', 'Elena', 'Pablo',
  'Renata', 'Andrés', 'Lucía', 'Felipe', 'Gabriela', 'Ricardo', 'Isabel', 'Martín', 'Natalia',
  'Sebastián', 'Daniela', 'Carlos', 'María', 'José', 'Fernanda', 'Alejandro', 'Patricia',
  'Roberto', 'Claudia', 'Miguel', 'Verónica', 'Antonio', 'Carmen', 'Francisco', 'Rosa',
  'Manuel', 'Adriana', 'Pedro', 'Laura', 'Javier', 'Mónica', 'Raúl', 'Silvia', 'Óscar',
  'Teresa', 'Hugo', 'Beatriz', 'Iván', 'Gladys', 'Ernesto',
];

const APELLIDOS = [
  'García', 'Mendoza', 'Ramírez', 'Castro', 'Ríos', 'Herrera', 'Vargas', 'Paredes', 'Quispe',
  'Salazar', 'Flores', 'Navarro', 'Ortiz', 'Díaz', 'Morales', 'Luna', 'Campos', 'Aguilar',
  'Peña', 'Rojas', 'Torres', 'Silva', 'Chávez', 'Reyes', 'Gutiérrez', 'Romero', 'Vega',
  'Cruz', 'Ramos', 'Medina', 'Soto', 'Delgado', 'Ortega', 'Guerrero', 'Contreras', 'Ponce',
  'Figueroa', 'Espinoza', 'Valdez', 'Cordero', 'Núñez', 'Ibarra', 'Palacios', 'León',
];

type EstadoReclamo =
  | 'ENVIADO'
  | 'EN_REVISION'
  | 'EN_VALIDACION'
  | 'CERRADO'
  | 'RECHAZADO'
  | 'ANULADO';

function cargarOferta(): OfertaSeccion[] {
  const jsonPath = path.resolve(__dirname, 'data/oferta-2026-1.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      'Falta prisma/data/oferta-2026-1.json — ejecuta: npx tsx scripts/parse-oferta-academica.ts'
    );
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as OfertaSeccion[];
}

function seleccionarOferta(oferta: OfertaSeccion[]): OfertaSeccion[] {
  const elegible = oferta.filter((s) => !esCursoExcluidoReclamoDigital(s.nombre));

  const porCodigo = new Map<string, OfertaSeccion[]>();
  for (const s of elegible) {
    const list = porCodigo.get(s.codigo) ?? [];
    list.push(s);
    porCodigo.set(s.codigo, list);
  }

  const codigos = [...porCodigo.keys()].sort((a, b) => a.localeCompare(b));
  const codigosElegidos = codigos.slice(0, MAX_CURSOS);
  const out: OfertaSeccion[] = [];

  for (const codigo of codigosElegidos) {
    const vistosSeccion = new Set<string>();
    const secciones = [...(porCodigo.get(codigo) ?? [])]
      .sort((a, b) => a.seccion.localeCompare(b.seccion))
      .filter((s) => {
        if (vistosSeccion.has(s.seccion)) return false;
        vistosSeccion.add(s.seccion);
        return true;
      });
    const cantidad = Math.min(
      MAX_SECCIONES_POR_CURSO,
      Math.max(MIN_SECCIONES_POR_CURSO, secciones.length)
    );
    out.push(...secciones.slice(0, cantidad));
  }

  return out;
}

function notaAleatoria() {
  return Math.round((8 + Math.random() * 12) * 10) / 10;
}

function diasDesdeAhora(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function pickCursosDistintosPorCodigo(
  cursos: { id: string; docenteId: string; codigo: string; nombre: string }[],
  n: number
) {
  const shuffled = [...cursos].sort(() => Math.random() - 0.5);
  const elegidos: typeof cursos = [];
  const codigos = new Set<string>();
  for (const c of shuffled) {
    if (codigos.has(c.codigo)) continue;
    codigos.add(c.codigo);
    elegidos.push(c);
    if (elegidos.length >= n) break;
  }
  return elegidos;
}

async function createManyBatched<T extends Record<string, unknown>>(
  label: string,
  items: T[],
  fn: (batch: T[]) => Promise<number>
) {
  let total = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    total += await fn(batch);
    if ((i + BATCH) % 500 === 0 || i + BATCH >= items.length) {
      console.log(`  ${label}: ${Math.min(i + BATCH, items.length)}/${items.length}`);
    }
  }
  return total;
}

async function crearUsuarioDocente(
  partes: PartesNombre,
  email: string,
  password: string
) {
  return prisma.user.create({
    data: {
      email,
      password,
      rol: 'docente',
      docente: {
        create: {
          nombres: partes.nombres,
          apellidoPaterno: partes.apellidoPaterno,
          apellidoMaterno: partes.apellidoMaterno,
        },
      },
    },
  });
}

function fechaEnSemanaCiclo(semana: number, offsetDias = 0) {
  const base = inicioCiclo(SEMESTRE);
  base.setDate(base.getDate() + (semana - 1) * 7 + offsetDias);
  base.setHours(10 + (offsetDias % 6), 30, 0, 0);
  return base;
}

function addDias(fecha: Date, dias: number) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

type CalidadSeed = 'sube' | 'sin_cambio' | 'baja';

function notaSegunCalidad(notaAnterior: number, calidad: CalidadSeed): number {
  if (calidad === 'sube') return Math.min(20, Math.round((notaAnterior + 1.2 + Math.random() * 1.5) * 10) / 10);
  if (calidad === 'baja') return Math.max(0, Math.round((notaAnterior - 1 - Math.random()) * 10) / 10);
  return notaAnterior;
}

async function main() {
  console.log('Cargando oferta académica...');
  const ofertaCompleta = cargarOferta();
  const oferta = seleccionarOferta(ofertaCompleta);
  const cursosDistintos = new Set(oferta.map((o) => o.codigo)).size;
  console.log(
    `  ${cursosDistintos} cursos, ${oferta.length} secciones (máx. ${MAX_SECCIONES_POR_CURSO}/curso) — oferta total: ${ofertaCompleta.length} secciones`
  );

  await prisma.notificacion.deleteMany();
  await prisma.solicitudExamenFisico.deleteMany();
  await prisma.reclamoEvento.deleteMany();
  await prisma.reclamo.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.alumno.deleteMany();
  await prisma.docente.deleteMany();
  await prisma.administrativoDaar.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash(CONTRASENA_INICIAL, 10);
  const plazoReclamo = diasDesdeAhora(14);
  const emailsUsados = new Set<string>([
    EMAIL_DEMO_DAAR,
    EMAIL_DEMO_ESTUDIANTE,
    EMAIL_DEMO_DOCENTE,
  ]);

  const daarPartes = parseNombreEstudiante('Ap Carhuavilca Cac');
  await prisma.user.create({
    data: {
      email: EMAIL_DEMO_DAAR,
      password,
      rol: 'daar',
      administrativoDaar: {
        create: {
          nombres: daarPartes.nombres,
          apellidoPaterno: daarPartes.apellidoPaterno,
          apellidoMaterno: daarPartes.apellidoMaterno,
        },
      },
    },
  });

  const profesoresUnicos = [...new Set(oferta.map((o) => o.profesor))];
  const docentePorNombre = new Map<string, string>();

  for (let idx = 0; idx < profesoresUnicos.length; idx++) {
    const nombreRaw = profesoresUnicos[idx];
    const partes = parseNombreProfesor(nombreRaw);
    const email =
      idx === 0 ? EMAIL_DEMO_DOCENTE : emailUnico(emailDocenteUp(partes), emailsUsados);
    const docente = await crearUsuarioDocente(partes, email, password);
    docentePorNombre.set(nombreRaw, docente.id);
  }

  console.log(`  ${docentePorNombre.size} docentes`);

  const cursoRows = oferta.map((s) => ({
    codigo: s.codigo,
    seccion: s.seccion,
    nombre: s.nombre,
    creditos: s.creditos,
    departamento: departamentoDesdeCodigo(s.codigo),
    docenteId: docentePorNombre.get(s.profesor)!,
    semestre: SEMESTRE,
  }));

  const cursos: {
    id: string;
    docenteId: string;
    codigo: string;
    nombre: string;
    seccion: string;
  }[] = [];
  for (let i = 0; i < cursoRows.length; i += BATCH) {
    const batch = cursoRows.slice(i, i + BATCH);
    const created = await prisma.curso.createManyAndReturn({ data: batch });
    cursos.push(
      ...created.map((c) => ({
        id: c.id,
        docenteId: c.docenteId,
        codigo: c.codigo,
        nombre: c.nombre,
        seccion: c.seccion,
      }))
    );
  }
  const excluidos = ofertaCompleta.filter((s) => esCursoExcluidoReclamoDigital(s.nombre)).length;
  console.log(`  ${cursos.length} secciones (${new Set(cursos.map((c) => c.codigo)).size} cursos)`);
  console.log(`  Cursos excluidos (reclamo presencial DAAR): ${excluidos} secciones en oferta omitidas`);

  const evalRows = cursos.flatMap((c) => [
    {
      cursoId: c.id,
      tipo: 'parcial',
      nombre: 'Parcial',
      notaPublicada: notaAleatoria(),
      fechaLimiteReclamo: plazoReclamo,
    },
    {
      cursoId: c.id,
      tipo: 'final',
      nombre: 'Final',
      notaPublicada: notaAleatoria(),
      fechaLimiteReclamo: plazoReclamo,
    },
  ]);

  await createManyBatched('Evaluaciones', evalRows, async (batch) => {
    const r = await prisma.evaluacion.createMany({ data: batch });
    return r.count;
  });

  const estudiantes: { id: string; email: string }[] = [];
  const codigosUsados = new Set<string>();

  for (let i = 0; i < TOTAL_ESTUDIANTES; i++) {
    let codigo: string;
    do {
      codigo = generarCodigoUpAleatorio();
    } while (codigosUsados.has(codigo));
    codigosUsados.add(codigo);

    const nombreCompleto =
      i === 0
        ? 'Juan Renato Mendoza Flores'
        : `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[(i * 7) % APELLIDOS.length]} ${APELLIDOS[(i * 13) % APELLIDOS.length]}`;
    const partes = parseNombreEstudiante(nombreCompleto);
    const email =
      i === 0 ? EMAIL_DEMO_ESTUDIANTE : emailUnico(emailAlumnoUp(partes), emailsUsados);

    const est = await prisma.user.create({
      data: {
        email,
        password,
        rol: 'estudiante',
        alumno: {
          create: {
            nombres: partes.nombres,
            apellidoPaterno: partes.apellidoPaterno,
            apellidoMaterno: partes.apellidoMaterno,
            codigo,
          },
        },
      },
    });
    estudiantes.push({ id: est.id, email });
  }
  console.log(`  ${estudiantes.length} estudiantes`);

  const matriculaRows: { estudianteId: string; cursoId: string }[] = [];

  for (const estudiante of estudiantes) {
    const elegidos = pickCursosDistintosPorCodigo(cursos, CURSOS_POR_ESTUDIANTE);

    for (const c of elegidos) {
      matriculaRows.push({ estudianteId: estudiante.id, cursoId: c.id });
    }
  }

  const matCount = await createManyBatched('Matrículas', matriculaRows, async (batch) => {
    const r = await prisma.matricula.createMany({ data: batch, skipDuplicates: true });
    return r.count;
  });

  const matriculas = await prisma.matricula.findMany({
    select: { estudianteId: true, cursoId: true },
  });
  const estudiantesPorCurso = new Map<string, string[]>();
  for (const m of matriculas) {
    const list = estudiantesPorCurso.get(m.cursoId) ?? [];
    list.push(m.estudianteId);
    estudiantesPorCurso.set(m.cursoId, list);
  }

  const evaluaciones = await prisma.evaluacion.findMany({
    select: {
      id: true,
      cursoId: true,
      tipo: true,
      notaPublicada: true,
      curso: { select: { docenteId: true, codigo: true, seccion: true } },
    },
  });
  const evalPorCurso = new Map<string, typeof evaluaciones>();
  for (const ev of evaluaciones) {
    const list = evalPorCurso.get(ev.cursoId) ?? [];
    list.push(ev);
    evalPorCurso.set(ev.cursoId, list);
  }

  const daarUser = await prisma.user.findUnique({
    where: { email: EMAIL_DEMO_DAAR },
    select: { id: true },
  });
  const daarId = daarUser!.id;

  const calidadPool: CalidadSeed[] = [];
  for (let i = 0; i < 43; i++) calidadPool.push('sube');
  for (let i = 0; i < 49; i++) calidadPool.push('sin_cambio');
  for (let i = 0; i < 8; i++) calidadPool.push('baja');
  while (calidadPool.length < TARGET_RECLAMOS) calidadPool.push('sin_cambio');

  const semanaPesos = [6, 7, 8, 9, 10, 11, 18, 20, 8];
  const semanaSlots: number[] = [];
  for (let s = 0; s < 9; s++) {
    for (let c = 0; c < semanaPesos[s]; c++) semanaSlots.push(s + 1);
  }
  while (semanaSlots.length < TARGET_RECLAMOS) semanaSlots.push(7 + (semanaSlots.length % 2));

  const candidatos: Array<{
    evaluacionId: string;
    estudianteId: string;
    docenteId: string;
    notaAnterior: number;
    tipo: string;
    fechaLimiteReclamo: Date;
  }> = [];

  for (const ev of evaluaciones) {
    const matriculados = estudiantesPorCurso.get(ev.cursoId) ?? [];
    for (const estudianteId of matriculados.slice(0, 3)) {
      candidatos.push({
        evaluacionId: ev.id,
        estudianteId,
        docenteId: ev.curso.docenteId,
        notaAnterior: ev.notaPublicada ?? notaAleatoria(),
        tipo: ev.tipo,
        fechaLimiteReclamo: plazoReclamo,
      });
    }
  }

  const shuffled = [...candidatos].sort(() => Math.random() - 0.5).slice(0, TARGET_RECLAMOS);
  const usedPairs = new Set<string>();
  let reclamoCount = 0;
  const eventoRows: Array<{
    reclamoId: string;
    actorId: string;
    accion: string;
    estadoAnterior: string | null;
    estadoNuevo: string | null;
    createdAt: Date;
  }> = [];

  for (let r = 0; r < shuffled.length; r++) {
    const slot = shuffled[r];
    const key = `${slot.estudianteId}:${slot.evaluacionId}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    const semana = semanaSlots[r] ?? 1 + (r % 9);
    const createdAt = fechaEnSemanaCiclo(semana, r % 5);

    let estado: EstadoReclamo;
    if (r < BACKLOG_ABIERTO) {
      estado = (['ENVIADO', 'EN_REVISION', 'EN_VALIDACION'] as EstadoReclamo[])[r % 3];
    } else if (r % 25 === 0) {
      estado = 'RECHAZADO';
    } else if (r % 30 === 0) {
      estado = 'ANULADO';
    } else {
      estado = 'CERRADO';
    }

    const calidad = calidadPool[r % calidadPool.length];
    const procedente = calidad !== 'sin_cambio' || r % 5 !== 0 ? r % 8 !== 0 : false;
    const decision = procedente ? 'procedente' : 'no_procedente';
    const notaAnterior = slot.notaAnterior;
    const notaNueva =
      estado === 'EN_VALIDACION' || estado === 'CERRADO'
        ? procedente
          ? notaSegunCalidad(notaAnterior, calidad)
          : notaAnterior
        : undefined;
    const resultadoFinal =
      estado === 'EN_VALIDACION' || estado === 'CERRADO'
        ? calcularResultadoFinal(decision as 'procedente' | 'no_procedente', notaAnterior, notaNueva)
        : undefined;

    const formularioOk = r % 11 !== 0 && r % 13 !== 0;
    const argumento = formularioOk
      ? 'Solicito revisión de mi examen conforme al reglamento vigente y adjunto sustento.'
      : r % 13 === 0
        ? 'Revisar.'
        : 'Solicito revisión de mi examen conforme al reglamento vigente.';

    const reclamo = await prisma.reclamo.create({
      data: {
        evaluacionId: slot.evaluacionId,
        estudianteId: slot.estudianteId,
        docenteId: slot.docenteId,
        semestreAcademico: SEMESTRE,
        motivo: ['error_suma', 'revision_integral', 'otro'][r % 3],
        argumento,
        examenNoLapiz: formularioOk || r % 17 !== 0,
        notaAnterior,
        estado,
        createdAt,
        updatedAt: createdAt,
        ...(estado !== 'RECHAZADO' && estado !== 'ANULADO' && formularioOk
          ? {
              escaneadoAt: addDias(createdAt, 0),
              archivoPath: `/uploads/seed/reclamo-${r}.pdf`,
              archivoHash: `seed${r.toString().padStart(4, '0')}`,
            }
          : {}),
        ...(estado === 'EN_VALIDACION' || estado === 'CERRADO'
          ? {
              decision,
              resultadoFinal,
              notaNueva,
              comentarioDocente: procedente
                ? calidad === 'sube'
                  ? 'Revisión favorable con modificación de nota.'
                  : calidad === 'baja'
                    ? 'Revisión integral con ajuste a la baja.'
                    : 'Procede sin modificar la nota.'
                : 'No procede — se mantiene la nota original.',
            }
          : {}),
        ...(estado === 'RECHAZADO'
          ? { comentarioDocente: 'Reclamo no procede según reglamento.' }
          : {}),
      },
    });
    reclamoCount++;

    eventoRows.push({
      reclamoId: reclamo.id,
      actorId: slot.estudianteId,
      accion: 'ESTUDIANTE_REGISTRO',
      estadoAnterior: null,
      estadoNuevo: 'ENVIADO',
      createdAt,
    });

    if (estado !== 'ENVIADO' && estado !== 'RECHAZADO' && estado !== 'ANULADO') {
      const docenteToma = addDias(createdAt, 1 + (r % 3));
      eventoRows.push({
        reclamoId: reclamo.id,
        actorId: slot.docenteId,
        accion: 'DOCENTE_TOMO_CASO',
        estadoAnterior: 'ENVIADO',
        estadoNuevo: 'EN_REVISION',
        createdAt: docenteToma,
      });

      const fueraPlazo = r % 19 === 0;
      const diasDocente = fueraPlazo ? 10 + (r % 4) : 1 + (r % 2);
      const docenteResolvio = addDias(docenteToma, diasDocente);
      eventoRows.push({
        reclamoId: reclamo.id,
        actorId: slot.docenteId,
        accion: 'DOCENTE_RESOLVIO',
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: estado === 'EN_VALIDACION' || estado === 'CERRADO' ? 'EN_VALIDACION' : 'EN_REVISION',
        createdAt: docenteResolvio,
      });

      if (estado === 'CERRADO') {
        const diasDaar = 2 + (r % 5);
        const cierre = addDias(docenteResolvio, diasDaar);
        eventoRows.push({
          reclamoId: reclamo.id,
          actorId: daarId,
          accion: 'DAAR_CERRO',
          estadoAnterior: 'EN_VALIDACION',
          estadoNuevo: 'CERRADO',
          createdAt: cierre,
        });
        await prisma.reclamo.update({
          where: { id: reclamo.id },
          data: { updatedAt: cierre },
        });
      }
    }
  }

  await createManyBatched('Eventos reclamo', eventoRows, async (batch) => {
    const r = await prisma.reclamoEvento.createMany({ data: batch });
    return r.count;
  });

  console.log(`  Plazo docente post-registro: +${PLAZO_DOCENTE_DIAS} días (referencia cumplimiento)`);

  console.log('');
  console.log('Seed OK — base universitaria simulada');
  console.log(`  Docentes:     ${docentePorNombre.size}`);
  console.log(`  Estudiantes:  ${estudiantes.length}`);
  console.log(`  Cursos:       ${new Set(cursos.map((c) => c.codigo)).size} (${cursos.length} secciones)`);
  console.log(`  Matrículas:   ${matCount}`);
  console.log(`  Evaluaciones: ${evalRows.length}`);
  console.log(`  Reclamos:     ${reclamoCount}`);
  console.log('');
  console.log('Acceso demo (hackathon):');
  console.log(`  Estudiante: ${EMAIL_DEMO_ESTUDIANTE}`);
  console.log(`  Docente:    ${EMAIL_DEMO_DOCENTE}`);
  console.log(`  DAAR:       ${EMAIL_DEMO_DAAR}`);
  console.log(`  Contraseña (todos): ${CONTRASENA_INICIAL}`);
  console.log('');
  console.log('También puede ingresar cualquier otro usuario generado en el seed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
