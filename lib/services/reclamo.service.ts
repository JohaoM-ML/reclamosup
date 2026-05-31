import { prisma } from '@/lib/db';
import type { Prisma } from '@/app/generated/prisma/client';
import { puedeTransicionar } from '@/lib/domain/estado-reclamo';
import type {
  EstadoReclamo,
  MotivoReclamo,
  Rol,
} from '@/lib/types';
import { logEvento } from '@/lib/services/audit.service';
import {
  confirmarExamenSubido,
  crearUrlSubidaFirmada,
  eliminarExamenEscaneado,
  subirExamenEscaneado,
  validarTamanoArchivo,
} from '@/lib/services/archivo.service';
import {
  sendNotification,
  sendToRole,
} from '@/lib/services/notification.service';
import {
  calcularResultadoFinal,
  decisionDesdeResultado,
} from '@/lib/domain/resultado-final';
import { esCursoExcluidoReclamoDigital } from '@/lib/cursos-reclamo-estandar';
import {
  assertDentroDePlazo,
  assertExamenNoLapiz,
  assertPuedeReclamar,
  aplicarSancionSiCorresponde,
  ValidacionError,
} from '@/lib/services/validacion.service';
import type { ResultadoFinal } from '@/lib/types';

import {
  getCodigoUser,
  getNombreUser,
  userDisplaySelect,
  type UserConPerfil,
} from '@/lib/user-profile';

export { ValidacionError };

const reclamoInclude = {
  estudiante: { select: userDisplaySelect },
  docente: { select: userDisplaySelect },
  operador: { select: userDisplaySelect },
  evaluacion: {
    include: {
      curso: { select: { id: true, codigo: true, seccion: true, nombre: true } },
    },
  },
  eventos: {
    include: { actor: { select: userDisplaySelect } },
    orderBy: { createdAt: 'asc' as const },
  },
  solicitudExamenFisico: { select: { id: true, solicitadoAt: true, entregadoAt: true } },
};

function mapUserDisplay(user: UserConPerfil) {
  return {
    id: user.id,
    email: user.email,
    nombre: getNombreUser(user),
    codigo: getCodigoUser(user),
    rol: user.rol,
  };
}

type ReclamoConRelaciones = Prisma.ReclamoGetPayload<{ include: typeof reclamoInclude }>;

function mapReclamo(reclamo: ReclamoConRelaciones) {
  return {
    ...reclamo,
    estudiante: mapUserDisplay(reclamo.estudiante),
    docente: mapUserDisplay(reclamo.docente),
    operador: reclamo.operador ? mapUserDisplay(reclamo.operador) : null,
    eventos: reclamo.eventos.map((ev) => ({
      ...ev,
      actor: mapUserDisplay(ev.actor),
    })),
  };
}

async function assertMatriculado(estudianteId: string, cursoId: string) {
  const m = await prisma.matricula.findUnique({
    where: {
      estudianteId_cursoId: { estudianteId, cursoId },
    },
  });
  if (!m) {
    throw new ValidacionError(
      'MAT',
      'No estás matriculado en este curso'
    );
  }
}

export async function getEvaluacionConCurso(evaluacionId: string) {
  return prisma.evaluacion.findUniqueOrThrow({
    where: { id: evaluacionId },
    include: { curso: true },
  });
}

export type ReclamoEstudianteInput = {
  estudianteId: string;
  evaluacionId: string;
  motivo: MotivoReclamo;
  argumento: string;
  preguntasMarcadas?: number[];
  examenNoLapiz: boolean;
};

async function crearReclamoBase(input: ReclamoEstudianteInput) {
  await assertDentroDePlazo(input.evaluacionId);
  await assertPuedeReclamar(input.estudianteId, input.evaluacionId);
  await assertExamenNoLapiz(input.examenNoLapiz);

  const evaluacion = await getEvaluacionConCurso(input.evaluacionId);
  await assertMatriculado(input.estudianteId, evaluacion.cursoId);

  return prisma.reclamo.create({
    data: {
      evaluacionId: input.evaluacionId,
      estudianteId: input.estudianteId,
      docenteId: evaluacion.curso.docenteId,
      motivo: input.motivo,
      argumento: input.argumento,
      preguntasMarcadas: input.preguntasMarcadas ?? [],
      examenNoLapiz: input.examenNoLapiz,
      notaAnterior: evaluacion.notaPublicada ?? 0,
      semestreAcademico: evaluacion.curso.semestre,
      estado: 'ENVIADO',
    },
    include: { evaluacion: { include: { curso: true } } },
  });
}

async function notificarReclamoRegistrado(
  reclamoId: string,
  estudianteId: string,
  evaluacion: { nombre: string; curso: { nombre: string; docenteId: string } }
) {
  await logEvento({
    reclamoId,
    actorId: estudianteId,
    accion: 'ESTUDIANTE_REGISTRO_CON_PDF',
    estadoNuevo: 'ENVIADO',
    metadata: { representantePresenciado: true },
  });

  await sendNotification({
    userId: evaluacion.curso.docenteId,
    reclamoId,
    titulo: 'Nuevo reclamo asignado',
    mensaje: `Reclamo registrado — ${evaluacion.nombre} (${evaluacion.curso.nombre})`,
  });

  await sendNotification({
    userId: estudianteId,
    reclamoId,
    titulo: 'Reclamo registrado',
    mensaje:
      'Tu solicitud y examen escaneado fueron enviados al docente. Puedes seguir el estado en Mis reclamos.',
  });
}

/** Paso 1: validar datos y reservar reclamo; devuelve URL firmada para subir PDF directo a Supabase. */
export async function prepararReclamoConArchivo(
  input: ReclamoEstudianteInput & { fileName: string; fileSize: number }
) {
  validarTamanoArchivo(input.fileSize);
  const reclamo = await crearReclamoBase(input);
  const upload = await crearUrlSubidaFirmada(reclamo.id, input.fileName);
  return { reclamoId: reclamo.id, ...upload };
}

/** Paso 2: confirmar archivo subido, guardar hash y notificar. */
export async function finalizarReclamoConArchivo(
  reclamoId: string,
  estudianteId: string,
  storageKey: string
) {
  const reclamo = await prisma.reclamo.findUniqueOrThrow({
    where: { id: reclamoId },
    include: { evaluacion: { include: { curso: true } } },
  });

  if (reclamo.estudianteId !== estudianteId) {
    throw new ValidacionError('AUTH', 'No autorizado');
  }
  if (reclamo.archivoPath) {
    return reclamoId;
  }

  const { hash } = await confirmarExamenSubido(storageKey);

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: {
      archivoPath: storageKey,
      archivoHash: hash,
      escaneadoAt: new Date(),
    },
  });

  await notificarReclamoRegistrado(reclamoId, estudianteId, reclamo.evaluacion);
  return reclamoId;
}

/** Elimina reclamo si la subida falló antes de completarse. */
export async function cancelarReclamoPendienteArchivo(
  reclamoId: string,
  estudianteId: string,
  storageKey?: string
) {
  const reclamo = await prisma.reclamo.findUnique({ where: { id: reclamoId } });
  if (!reclamo || reclamo.estudianteId !== estudianteId || reclamo.archivoPath) return;

  if (storageKey) {
    await eliminarExamenEscaneado(storageKey).catch(() => undefined);
  }

  await prisma.reclamoEvento.deleteMany({ where: { reclamoId } });
  await prisma.notificacion.deleteMany({ where: { reclamoId } });
  await prisma.reclamo.delete({ where: { id: reclamoId } });
}

export async function crearReclamoEstudiante(input: ReclamoEstudianteInput & {
  archivo: File;
}) {
  validarTamanoArchivo(input.archivo.size);
  const reclamo = await crearReclamoBase(input);
  const { path, hash } = await subirExamenEscaneado(reclamo.id, input.archivo);

  await prisma.reclamo.update({
    where: { id: reclamo.id },
    data: {
      archivoPath: path,
      archivoHash: hash,
      escaneadoAt: new Date(),
    },
  });

  await logEvento({
    reclamoId: reclamo.id,
    actorId: input.estudianteId,
    accion: 'ESTUDIANTE_REGISTRO_CON_PDF',
    estadoNuevo: 'ENVIADO',
    metadata: { hash, representantePresenciado: true },
  });

  await notificarReclamoRegistrado(reclamo.id, input.estudianteId, reclamo.evaluacion);
  return reclamo.id;
}

async function assertAccesoReclamo(
  reclamoId: string,
  userId: string,
  rol: Rol
) {
  const reclamo = await prisma.reclamo.findUniqueOrThrow({
    where: { id: reclamoId },
  });

  if (rol === 'daar') return reclamo;
  if (rol === 'docente' && reclamo.docenteId === userId) return reclamo;
  if (rol === 'estudiante' && reclamo.estudianteId === userId) return reclamo;

  throw new Error('No autorizado para acceder a este reclamo');
}

export async function tomarReclamo(
  reclamoId: string,
  docenteId: string,
  rol: Rol
) {
  const reclamo = await assertAccesoReclamo(reclamoId, docenteId, rol);

  if (reclamo.docenteId !== docenteId) {
    throw new Error('Este reclamo no está asignado a usted');
  }

  const estado = reclamo.estado as EstadoReclamo;
  if (!puedeTransicionar(estado, 'EN_REVISION', rol)) {
    throw new Error(`No se puede tomar un reclamo en estado ${estado}`);
  }

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: { estado: 'EN_REVISION' },
  });

  await logEvento({
    reclamoId,
    actorId: docenteId,
    accion: 'DOCENTE_TOMO_CASO',
    estadoAnterior: estado,
    estadoNuevo: 'EN_REVISION',
  });

  await sendNotification({
    userId: reclamo.estudianteId,
    reclamoId,
    titulo: 'Reclamo en revisión',
    mensaje: 'Un docente tomó tu caso y está revisando el examen',
  });
}

export async function resolverReclamo(input: {
  reclamoId: string;
  docenteId: string;
  rol: Rol;
  resultadoFinal: ResultadoFinal;
  notaNueva?: number;
  comentario?: string;
}) {
  const reclamo = await assertAccesoReclamo(
    input.reclamoId,
    input.docenteId,
    input.rol
  );

  if (reclamo.docenteId !== input.docenteId) {
    throw new Error('Este reclamo no está asignado a usted');
  }

  let estado = reclamo.estado as EstadoReclamo;

  if (estado === 'ENVIADO') {
    await prisma.reclamo.update({
      where: { id: input.reclamoId },
      data: { estado: 'EN_REVISION' },
    });
    estado = 'EN_REVISION';
  }

  if (estado !== 'EN_REVISION') {
    throw new Error(`No se puede resolver un reclamo en estado ${estado}`);
  }

  const { decision, notaNueva } = decisionDesdeResultado(
    input.resultadoFinal,
    reclamo.notaAnterior,
    input.notaNueva
  );

  if (input.resultadoFinal === 'procede_modifica' && notaNueva == null) {
    throw new Error('Debe indicar la nota nueva si el reclamo procede y modifica');
  }

  const resultadoFinal = calcularResultadoFinal(
    decision,
    reclamo.notaAnterior,
    notaNueva
  );

  await prisma.reclamo.update({
    where: { id: input.reclamoId },
    data: {
      decision,
      resultadoFinal,
      notaNueva,
      comentarioDocente: input.comentario?.trim() || null,
      estado: 'EN_VALIDACION',
    },
  });

  await logEvento({
    reclamoId: input.reclamoId,
    actorId: input.docenteId,
    accion: 'DOCENTE_RESOLVIO',
    estadoAnterior: estado,
    estadoNuevo: 'EN_VALIDACION',
    metadata: {
      resultadoFinal,
      decision,
      notaNueva,
    },
  });

  await sendToRole('daar', {
    reclamoId: input.reclamoId,
    titulo: 'Reclamo pendiente de cierre',
    mensaje: `El docente resolvió el reclamo #${input.reclamoId.slice(-6)}`,
  });

  const msgEstudiante =
    input.resultadoFinal === 'no_procede'
      ? 'Tu reclamo fue resuelto como no procedente. Esperando cierre DAAR.'
      : input.resultadoFinal === 'procede_sin_modifica'
        ? 'Tu reclamo fue resuelto como procedente sin modificación de nota. Esperando cierre DAAR.'
        : `Tu reclamo fue resuelto como procedente con modificación. Nueva nota propuesta: ${notaNueva}. Esperando cierre DAAR.`;

  await sendNotification({
    userId: reclamo.estudianteId,
    reclamoId: input.reclamoId,
    titulo: 'Docente resolvió tu reclamo',
    mensaje: msgEstudiante,
  });
}

export async function cerrarReclamo(
  reclamoId: string,
  operadorDaarId: string,
  rol: Rol
) {
  await assertAccesoReclamo(reclamoId, operadorDaarId, rol);

  const reclamo = await prisma.reclamo.findUniqueOrThrow({
    where: { id: reclamoId },
  });

  const estado = reclamo.estado as EstadoReclamo;
  if (!puedeTransicionar(estado, 'CERRADO', rol)) {
    throw new Error(`No se puede cerrar un reclamo en estado ${estado}`);
  }

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: { estado: 'CERRADO', operadorDaarId },
  });

  await logEvento({
    reclamoId,
    actorId: operadorDaarId,
    accion: 'DAAR_CERRO',
    estadoAnterior: estado,
    estadoNuevo: 'CERRADO',
  });

  if (reclamo.decision === 'no_procedente') {
    await aplicarSancionSiCorresponde(
      reclamo.estudianteId,
      reclamo.semestreAcademico,
      reclamo.motivo
    );
  }

  const notaFinal =
    reclamo.decision === 'procedente' && reclamo.notaNueva != null
      ? reclamo.notaNueva
      : reclamo.notaAnterior;

  await sendNotification({
    userId: reclamo.estudianteId,
    reclamoId,
    titulo: 'Reclamo concluido',
    mensaje: `Tu reclamo fue concluido por DAAR. Nota final registrada: ${notaFinal}`,
  });
}

export async function devolverADocente(
  reclamoId: string,
  operadorDaarId: string,
  rol: Rol,
  comentario?: string
) {
  await assertAccesoReclamo(reclamoId, operadorDaarId, rol);

  const reclamo = await prisma.reclamo.findUniqueOrThrow({
    where: { id: reclamoId },
  });

  const estado = reclamo.estado as EstadoReclamo;
  if (!puedeTransicionar(estado, 'EN_REVISION', rol)) {
    throw new Error(`No se puede devolver un reclamo en estado ${estado}`);
  }

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: { estado: 'EN_REVISION' },
  });

  await logEvento({
    reclamoId,
    actorId: operadorDaarId,
    accion: 'DAAR_DEVOLVIO_A_DOCENTE',
    estadoAnterior: estado,
    estadoNuevo: 'EN_REVISION',
    metadata: comentario ? { comentario } : undefined,
  });

  await sendNotification({
    userId: reclamo.docenteId,
    reclamoId,
    titulo: 'Reclamo devuelto por DAAR',
    mensaje: comentario || 'Se requiere revisión adicional del docente',
  });
}

export async function anularReclamoDaar(
  reclamoId: string,
  operadorDaarId: string,
  rol: Rol
) {
  await assertAccesoReclamo(reclamoId, operadorDaarId, rol);

  const reclamo = await prisma.reclamo.findUniqueOrThrow({
    where: { id: reclamoId },
  });

  const estado = reclamo.estado as EstadoReclamo;
  if (!puedeTransicionar(estado, 'ANULADO', rol)) {
    throw new Error(`No se puede anular un reclamo en estado ${estado}`);
  }

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: { estado: 'ANULADO' },
  });

  await logEvento({
    reclamoId,
    actorId: operadorDaarId,
    accion: 'ANULADO_POR_DAAR',
    estadoAnterior: estado,
    estadoNuevo: 'ANULADO',
  });

  await sendNotification({
    userId: reclamo.estudianteId,
    reclamoId,
    titulo: 'Solicitud anulada',
    mensaje:
      'Tu solicitud fue anulada por DAAR. Por favor, acércate a CAP para registrarla nuevamente.',
  });
}

export async function rechazarPorLapizDocente(
  reclamoId: string,
  docenteId: string,
  rol: Rol
) {
  const reclamo = await assertAccesoReclamo(reclamoId, docenteId, rol);

  if (reclamo.docenteId !== docenteId) {
    throw new Error('Este reclamo no está asignado a usted');
  }

  const estado = reclamo.estado as EstadoReclamo;
  if (!puedeTransicionar(estado, 'RECHAZADO', rol)) {
    throw new Error(`No se puede rechazar un reclamo en estado ${estado}`);
  }

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: {
      estado: 'RECHAZADO',
      comentarioDocente: 'Rechazado por docente: examen hecho con lápiz.',
    },
  });

  await logEvento({
    reclamoId,
    actorId: docenteId,
    accion: 'DOCENTE_RECHAZO_LAPIZ',
    estadoAnterior: estado,
    estadoNuevo: 'RECHAZADO',
  });

  await sendNotification({
    userId: reclamo.estudianteId,
    reclamoId,
    titulo: 'Reclamo rechazado',
    mensaje:
      'Tu reclamo fue rechazado: el docente confirmó que el examen fue hecho con lápiz (Art. 38).',
  });
}

export async function getReclamoById(reclamoId: string) {
  const reclamo = await prisma.reclamo.findUniqueOrThrow({
    where: { id: reclamoId },
    include: reclamoInclude,
  });
  return mapReclamo(reclamo);
}

export async function getBandejaDocente(docenteId: string) {
  const rows = await prisma.reclamo.findMany({
    where: {
      docenteId,
      estado: { in: ['ENVIADO', 'EN_REVISION'] },
    },
    include: reclamoInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapReclamo);
}

export async function getMisReclamos(estudianteId: string) {
  const rows = await prisma.reclamo.findMany({
    where: { estudianteId },
    include: reclamoInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapReclamo);
}

export async function getPendientesCierre() {
  const rows = await prisma.reclamo.findMany({
    where: { estado: 'EN_VALIDACION' },
    include: reclamoInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(mapReclamo);
}

export async function getTodosReclamos() {
  const rows = await prisma.reclamo.findMany({
    include: reclamoInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapReclamo);
}

/** Códigos de curso distintos matriculados (sin sección). */
export async function getCursosEstudiante(estudianteId: string) {
  const matriculas = await prisma.matricula.findMany({
    where: { estudianteId },
    include: { curso: { select: { codigo: true, nombre: true } } },
  });

  const porCodigo = new Map<string, { codigo: string; nombre: string }>();
  for (const m of matriculas) {
    if (esCursoExcluidoReclamoDigital(m.curso.nombre)) continue;
    if (!porCodigo.has(m.curso.codigo)) {
      porCodigo.set(m.curso.codigo, {
        codigo: m.curso.codigo,
        nombre: m.curso.nombre,
      });
    }
  }

  return [...porCodigo.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** Secciones matriculadas de un curso (cursoId = código UP). */
export async function getSeccionesEstudiante(estudianteId: string, codigoCurso: string) {
  const matriculas = await prisma.matricula.findMany({
    where: { estudianteId, curso: { codigo: codigoCurso } },
    include: {
      curso: {
        select: {
          id: true,
          seccion: true,
          docente: {
            select: {
              nombres: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              user: { select: { email: true } },
            },
          },
        },
      },
    },
    orderBy: { curso: { seccion: 'asc' } },
  });

  return matriculas.map((m) => ({
    cursoRowId: m.curso.id,
    seccion: m.curso.seccion,
    docente: {
      nombre: `${m.curso.docente.nombres} ${m.curso.docente.apellidoPaterno} ${m.curso.docente.apellidoMaterno}`.trim(),
      email: m.curso.docente.user.email,
    },
  }));
}

/** cursoId = código UP; seccion = letra/sección matriculada */
export async function getEvaluacionesEstudiante(
  estudianteId: string,
  codigoCurso?: string,
  seccion?: string
) {
  const matriculas = await prisma.matricula.findMany({
    where: {
      estudianteId,
      ...(codigoCurso ? { curso: { codigo: codigoCurso, ...(seccion ? { seccion } : {}) } } : {}),
    },
    include: {
      curso: {
        include: {
          evaluaciones: {
            where: { fechaLimiteReclamo: { gte: new Date() } },
            orderBy: { fechaLimiteReclamo: 'asc' },
          },
        },
      },
    },
  });

  const reclamosExistentes = await prisma.reclamo.findMany({
    where: { estudianteId },
    select: { evaluacion: { select: { curso: { select: { codigo: true } } } } },
  });
  const codigosConReclamo = new Set(
    reclamosExistentes.map((r) => r.evaluacion.curso.codigo)
  );

  function prioridadTipo(tipo: string): number {
    const t = tipo.toLowerCase();
    if (t.includes('parcial')) return 0;
    if (t.includes('final')) return 1;
    return 2;
  }

  const resultados: Array<
    (typeof matriculas)[number]['curso']['evaluaciones'][number] & {
      curso: { id: string; codigo: string; seccion: string; nombre: string };
    }
  > = [];

  for (const m of matriculas) {
    if (esCursoExcluidoReclamoDigital(m.curso.nombre)) continue;
    if (codigosConReclamo.has(m.curso.codigo)) continue;

    const disponibles = m.curso.evaluaciones;
    if (disponibles.length === 0) continue;

    const elegida = [...disponibles].sort(
      (a, b) => prioridadTipo(a.tipo) - prioridadTipo(b.tipo)
    )[0];

    resultados.push({
      ...elegida,
      curso: {
        id: m.curso.codigo,
        codigo: m.curso.codigo,
        seccion: m.curso.seccion,
        nombre: m.curso.nombre,
      },
    });
  }

  return resultados;
}

export async function getNotificaciones(usuarioId: string) {
  return prisma.notificacion.findMany({
    where: { usuarioId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function marcarNotificacionLeida(id: string, usuarioId: string) {
  await prisma.notificacion.updateMany({
    where: { id, usuarioId },
    data: { leida: true },
  });
}

export async function contarNotificacionesNoLeidas(usuarioId: string) {
  return prisma.notificacion.count({
    where: { usuarioId, leida: false },
  });
}

export async function solicitarExamenFisico(
  reclamoId: string,
  docenteId: string,
  rol: Rol
) {
  const reclamo = await assertAccesoReclamo(reclamoId, docenteId, rol);

  if (reclamo.docenteId !== docenteId) {
    throw new Error('Este reclamo no está asignado a usted');
  }

  const activo = ['ENVIADO', 'EN_REVISION', 'EN_VALIDACION'].includes(reclamo.estado);
  if (!activo) {
    throw new Error('No se puede solicitar examen físico en este estado');
  }

  const existente = await prisma.solicitudExamenFisico.findUnique({
    where: { reclamoId },
  });
  if (existente) {
    throw new Error('Ya existe una solicitud de examen físico para este reclamo');
  }

  await prisma.solicitudExamenFisico.create({
    data: { reclamoId, docenteId },
  });

  await logEvento({
    reclamoId,
    actorId: docenteId,
    accion: 'SOLICITUD_EXAMEN_FISICO',
    metadata: { solicitadoAt: new Date().toISOString() },
  });

  await sendToRole('daar', {
    reclamoId,
    titulo: 'Solicitud de entrega física',
    mensaje: `El docente solicitó entrega del examen físico — reclamo #${reclamoId.slice(-6)}`,
  });
}

export async function registrarEntregaFisica(input: {
  solicitudId: string;
  operadorDaarId: string;
  rol: Rol;
  procede: boolean;
}) {
  if (input.rol !== 'daar') {
    throw new Error('No autorizado');
  }

  const solicitud = await prisma.solicitudExamenFisico.findUniqueOrThrow({
    where: { id: input.solicitudId },
    include: { reclamo: true },
  });

  if (solicitud.entregadoAt) {
    throw new Error('Esta entrega ya fue registrada');
  }

  await prisma.solicitudExamenFisico.update({
    where: { id: input.solicitudId },
    data: {
      entregadoAt: new Date(),
      procede: input.procede,
      operadorDaarId: input.operadorDaarId,
    },
  });

  await logEvento({
    reclamoId: solicitud.reclamoId,
    actorId: input.operadorDaarId,
    accion: 'ENTREGA_FISICA_REGISTRADA',
    metadata: { procede: input.procede },
  });

  await sendNotification({
    userId: solicitud.docenteId,
    reclamoId: solicitud.reclamoId,
    titulo: 'Entrega física registrada',
    mensaje: input.procede
      ? 'DAAR entregó el examen físico. Resultado: procede.'
      : 'DAAR entregó el examen físico. Resultado: no procede.',
  });
}

export async function getImpedidoEstudiante(estudianteId: string) {
  const alumno = await prisma.alumno.findUnique({
    where: { userId: estudianteId },
    select: { impedidoHastaSemestre: true },
  });
  if (!alumno?.impedidoHastaSemestre) return null;

  const { estaImpedidoParaSemestre } = await import('@/lib/domain/semestre-academico');
  const semestreActual = process.env.SEMESTRE_ACTUAL ?? '2026-I';
  if (estaImpedidoParaSemestre(alumno.impedidoHastaSemestre, semestreActual)) {
    return alumno.impedidoHastaSemestre;
  }
  return null;
}
