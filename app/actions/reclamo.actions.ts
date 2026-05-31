'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRol } from '@/lib/auth';
import {
  cancelarReclamoPendienteArchivo,
  cerrarReclamo,
  crearReclamoEstudiante,
  devolverADocente,
  finalizarReclamoConArchivo,
  prepararReclamoConArchivo,
  resolverReclamo,
  tomarReclamo,
  anularReclamoDaar,
  rechazarPorLapizDocente,
  registrarEntregaFisica,
  solicitarExamenFisico,
  ValidacionError,
  marcarNotificacionLeida,
} from '@/lib/services/reclamo.service';
import {
  crearReclamoEstudianteSchema,
  parsePreguntasMarcadas,
  resolverReclamoSchema,
} from '@/lib/validators/reclamo.schema';
import type { MotivoReclamo } from '@/lib/types';

export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

function revalidateReclamo(reclamoId: string) {
  revalidatePath('/estudiante');
  revalidatePath(`/estudiante/${reclamoId}`);
  revalidatePath('/estudiante/cap/nuevo');
  revalidatePath('/docente');
  revalidatePath(`/docente/${reclamoId}`);
  revalidatePath('/daar/dashboard');
  revalidatePath(`/daar/${reclamoId}`);
}

export async function crearReclamoEstudianteAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireRol('estudiante');

    const preguntasMarcadas = parsePreguntasMarcadas(formData.getAll('preguntasMarcadas'));

    const parsed = crearReclamoEstudianteSchema.safeParse({
      evaluacionId: formData.get('evaluacionId'),
      motivo: formData.get('motivo'),
      argumento: formData.get('argumento'),
      examenNoLapiz: formData.get('examenNoLapiz'),
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const archivo = formData.get('archivo');
    if (!(archivo instanceof File) || archivo.size === 0) {
      return { ok: false, error: 'Debe adjuntar el examen escaneado (PDF o imagen)' };
    }

    const id = await crearReclamoEstudiante({
      estudianteId: session.id,
      evaluacionId: parsed.data.evaluacionId,
      motivo: parsed.data.motivo as MotivoReclamo,
      argumento: parsed.data.argumento,
      preguntasMarcadas,
      examenNoLapiz: parsed.data.examenNoLapiz,
      archivo,
    });

    revalidateReclamo(id);
    return { ok: true, id };
  } catch (e) {
    if (e instanceof ValidacionError) {
      return { ok: false, error: `[${e.codigo}] ${e.message}` };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al crear reclamo',
    };
  }
}

function parseReclamoFormFields(formData: FormData) {
  return {
    parsed: crearReclamoEstudianteSchema.safeParse({
      evaluacionId: formData.get('evaluacionId'),
      motivo: formData.get('motivo'),
      argumento: formData.get('argumento'),
      examenNoLapiz: formData.get('examenNoLapiz'),
    }),
    preguntasMarcadas: parsePreguntasMarcadas(formData.getAll('preguntasMarcadas')),
  };
}

/** Paso 1 producción: reserva reclamo y devuelve URL firmada (PDF no pasa por Vercel). */
export async function prepararReclamoArchivoAction(
  _prev: ActionResult & { signedUrl?: string; path?: string; token?: string },
  formData: FormData
): Promise<ActionResult & { signedUrl?: string; path?: string; token?: string }> {
  try {
    const session = await requireRol('estudiante');
    const { parsed, preguntasMarcadas } = parseReclamoFormFields(formData);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const fileName = String(formData.get('fileName') ?? '');
    const fileSize = Number(formData.get('fileSize') ?? 0);
    if (!fileName || !fileSize) {
      return { ok: false, error: 'Debe adjuntar el examen escaneado (PDF o imagen)' };
    }

    const prep = await prepararReclamoConArchivo({
      estudianteId: session.id,
      evaluacionId: parsed.data.evaluacionId,
      motivo: parsed.data.motivo as MotivoReclamo,
      argumento: parsed.data.argumento,
      preguntasMarcadas,
      examenNoLapiz: parsed.data.examenNoLapiz,
      fileName,
      fileSize,
    });

    return {
      ok: true,
      id: prep.reclamoId,
      signedUrl: prep.signedUrl,
      path: prep.path,
      token: prep.token,
    };
  } catch (e) {
    if (e instanceof ValidacionError) {
      return { ok: false, error: `[${e.codigo}] ${e.message}` };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al preparar subida',
    };
  }
}

/** Paso 3 producción: confirma archivo en Storage y notifica. */
export async function finalizarReclamoArchivoAction(input: {
  reclamoId: string;
  storageKey: string;
}): Promise<ActionResult> {
  try {
    const session = await requireRol('estudiante');
    const id = await finalizarReclamoConArchivo(
      input.reclamoId,
      session.id,
      input.storageKey
    );
    revalidateReclamo(id);
    return { ok: true, id };
  } catch (e) {
    if (e instanceof ValidacionError) {
      return { ok: false, error: `[${e.codigo}] ${e.message}` };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al finalizar reclamo',
    };
  }
}

export async function cancelarReclamoArchivoAction(input: {
  reclamoId: string;
  storageKey?: string;
}): Promise<void> {
  try {
    const session = await requireRol('estudiante');
    await cancelarReclamoPendienteArchivo(
      input.reclamoId,
      session.id,
      input.storageKey
    );
  } catch {
    /* best effort */
  }
}

export async function tomarReclamoAction(reclamoId: string): Promise<ActionResult> {
  try {
    const session = await requireRol('docente');
    await tomarReclamo(reclamoId, session.id, session.rol);
    revalidateReclamo(reclamoId);
    return { ok: true, id: reclamoId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al tomar caso',
    };
  }
}

export async function resolverReclamoAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireRol('docente');
    const parsed = resolverReclamoSchema.safeParse({
      reclamoId: formData.get('reclamoId'),
      resultadoFinal: formData.get('resultadoFinal'),
      notaNueva: formData.get('notaNueva'),
      comentario: formData.get('comentario'),
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    if (
      parsed.data.resultadoFinal === 'procede_modifica' &&
      parsed.data.notaNueva == null
    ) {
      return { ok: false, error: 'Indique la nota nueva si procede y modifica' };
    }

    await resolverReclamo({
      reclamoId: parsed.data.reclamoId,
      docenteId: session.id,
      rol: session.rol,
      resultadoFinal: parsed.data.resultadoFinal,
      notaNueva: parsed.data.notaNueva,
      comentario:
        parsed.data.resultadoFinal === 'procede_modifica'
          ? undefined
          : parsed.data.comentario?.trim(),
    });

    revalidateReclamo(parsed.data.reclamoId);
    return { ok: true, id: parsed.data.reclamoId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al resolver',
    };
  }
}

export async function cerrarReclamoAction(reclamoId: string): Promise<ActionResult> {
  try {
    const session = await requireRol('daar');
    await cerrarReclamo(reclamoId, session.id, session.rol);
    revalidateReclamo(reclamoId);
    return { ok: true, id: reclamoId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al cerrar',
    };
  }
}

export async function devolverADocenteAction(
  reclamoId: string,
  comentario?: string
): Promise<ActionResult> {
  try {
    const session = await requireRol('daar');
    await devolverADocente(reclamoId, session.id, session.rol, comentario);
    revalidateReclamo(reclamoId);
    return { ok: true, id: reclamoId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al devolver',
    };
  }
}

export async function tomarReclamoFormAction(reclamoId: string): Promise<void> {
  await tomarReclamoAction(reclamoId);
}

export async function cerrarReclamoFormAction(reclamoId: string): Promise<void> {
  const result = await cerrarReclamoAction(reclamoId);
  if (result.ok) {
    redirect(`/daar/${reclamoId}`);
  }
}

export async function devolverADocenteFormAction(
  reclamoId: string,
  comentario?: string
): Promise<void> {
  await devolverADocenteAction(reclamoId, comentario);
}

export async function anularReclamoDaarAction(reclamoId: string): Promise<ActionResult> {
  try {
    const session = await requireRol('daar');
    await anularReclamoDaar(reclamoId, session.id, session.rol);
    revalidateReclamo(reclamoId);
    return { ok: true, id: reclamoId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al anular solicitud',
    };
  }
}

export async function rechazarPorLapizDocenteAction(reclamoId: string): Promise<void> {
  const session = await requireRol('docente');
  await rechazarPorLapizDocente(reclamoId, session.id, session.rol);
  revalidateReclamo(reclamoId);
  redirect('/docente');
}

export async function marcarLeidaAction(notificacionId: string) {
  const session = await requireRol('estudiante', 'docente', 'daar');
  await marcarNotificacionLeida(notificacionId, session.id);
  revalidatePath('/');
}

export async function solicitarExamenFisicoAction(reclamoId: string): Promise<ActionResult> {
  try {
    const session = await requireRol('docente');
    await solicitarExamenFisico(reclamoId, session.id, session.rol);
    revalidateReclamo(reclamoId);
    return { ok: true, id: reclamoId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al solicitar examen físico',
    };
  }
}

export async function registrarEntregaFisicaAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireRol('daar');
    const solicitudId = String(formData.get('solicitudId') ?? '');
    const procede = formData.get('procede') === 'true';

    await registrarEntregaFisica({
      solicitudId,
      operadorDaarId: session.id,
      rol: session.rol,
      procede,
    });

    revalidatePath('/daar/dashboard');
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al registrar entrega',
    };
  }
}

export async function registrarEntregaFisicaFormAction(formData: FormData): Promise<void> {
  await registrarEntregaFisicaAction({ ok: false }, formData);
}
