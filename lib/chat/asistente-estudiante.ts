import type { ContextoEstudianteChat } from '@/lib/chat/contexto-estudiante';
import {
  detectarTema,
  hechosParaPrompt,
  respuestaTemplate,
  sugerenciasPorTema,
} from '@/lib/chat/conocimiento-reclamos';
import type { ChatChip, ChatMessage, ChatResponse, TemaChat } from '@/lib/chat/types';

export const MAX_MENSAJE_CHARS = 500;
export const MAX_HISTORIAL = 10;
export const MAX_TOKENS = 400;

/** Quita markdown y deja el texto listo para mostrar en el chat */
export function humanizarRespuesta(texto: string): string {
  return texto
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function primerNombre(nombre: string): string {
  return nombre.split(/\s+/)[0] ?? nombre;
}

export function validarMensajes(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (
      typeof m !== 'object' ||
      m == null ||
      !('role' in m) ||
      !('content' in m) ||
      (m.role !== 'user' && m.role !== 'assistant') ||
      typeof m.content !== 'string'
    ) {
      return null;
    }
    const content = m.content.trim().slice(0, MAX_MENSAJE_CHARS);
    if (!content) return null;
    out.push({ role: m.role, content });
  }

  return out.slice(-MAX_HISTORIAL);
}

export function truncarHistorial(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_HISTORIAL);
}

export function buildSystemPrompt(contexto: ContextoEstudianteChat): string {
  return `
Eres el asistente de ReclamoUP (Universidad del Pacífico). Ayudas a estudiantes con reclamos de exámenes.

ESTILO (OBLIGATORIO):
- Máximo 2-4 oraciones por respuesta, salvo que pidan "más detalle" o "explícame".
- Una sola idea o una pregunta de seguimiento por turno.
- NO listes más de 3 opciones ni enumeres todos los temas posibles.
- Tono cercano, natural y claro, como un compañero que orienta. Sin emojis.
- Escribe en texto plano: PROHIBIDO usar markdown, asteriscos, negritas o viñetas con guiones.
- Si preguntan algo fuera de reclamos de exámenes, responde en 1 frase que solo puedes ayudar con eso.
- Si el alumno está impedido y pregunta por qué no puede reclamar, menciona el semestre de impedimento y los cursos donde tuvo resultado No procede (están en el contexto).

CONTEXTO DEL ALUMNO (usa estos datos cuando pregunte por "mi reclamo", "mi nota", "puedo reclamar"):
${contexto.textoPrompt}

CONOCIMIENTO DEL PROCESO:
${hechosParaPrompt()}
`.trim();
}

function listarCursosNoProcedentes(
  reclamos: Array<{ curso: string; evaluacion: string }>
): string {
  if (reclamos.length === 0) return '';
  return reclamos.map((r) => `${r.curso} (${r.evaluacion})`).join(', ');
}

function respuestaImpedidoConDetalle(ctx: ContextoEstudianteChat): string {
  const nombre = primerNombre(ctx.nombre);
  const cursos = listarCursosNoProcedentes(ctx.reclamosNoProcedentes);

  if (!ctx.impedidoHasta) {
    return `Por ahora no estás impedido, ${nombre}. Solo ten en cuenta que tres reclamos no procedentes en un semestre implican sanción el siguiente. ¿Quieres revisar cómo van tus reclamos?`;
  }

  const base = `${nombre}, estás impedido de reclamar hasta el semestre ${ctx.impedidoHasta} por acumular tres reclamos no procedentes`;
  if (cursos) {
    return `${base}: ${cursos}. Cuando pase ese semestre podrás volver a registrar reclamos.`;
  }
  return `${base}. Cuando pase ese semestre podrás volver a registrar reclamos.`;
}

function respuestaMisReclamos(ctx: ContextoEstudianteChat): string {
  const nombre = primerNombre(ctx.nombre);

  if (ctx.impedidoHasta) {
    return respuestaImpedidoConDetalle(ctx);
  }

  if (ctx.reclamosActivos.length === 0) {
    if (ctx.reclamosCerrados > 0) {
      return `No tienes reclamos activos en este momento, ${nombre}. Ya tienes ${ctx.reclamosCerrados} cerrado(s); puedes ver el detalle en Mis reclamos. ¿Quieres presentar uno nuevo?`;
    }
    return `Por ahora no tienes reclamos registrados, ${nombre}. Si aún estás dentro del plazo, puedes crear uno desde Nuevo reclamo en el menú. ¿Te explico cómo?`;
  }

  if (ctx.reclamosActivos.length === 1) {
    const r = ctx.reclamosActivos[0];
    const nota =
      r.notaNueva != null
        ? ` Tu nota pasó de ${r.notaAnterior} a ${r.notaNueva}.`
        : ` Tu nota actual es ${r.notaAnterior}.`;
    return `Tu reclamo de ${r.curso} (${r.evaluacion}) está en ${r.estado}.${nota} ¿Quieres que te cuente qué sigue?`;
  }

  const detalle = ctx.reclamosActivos
    .map((r) => `${r.curso} (${r.evaluacion}) en ${r.estado}`)
    .join(', ');
  return `Tienes ${ctx.reclamosActivos.length} reclamos activos: ${detalle}. ¿Sobre cuál quieres saber más?`;
}

function respuestaImpedimento(ctx: ContextoEstudianteChat): string {
  return respuestaImpedidoConDetalle(ctx);
}

function respuestaOtro(): ChatResponse {
  return {
    reply:
      'Claro, cuéntame tu duda con calma. Puedo orientarte sobre plazos, estados, cómo reclamar o el Artículo 38.',
    suggestions: [
      { id: 'como_reclamar', label: 'Cómo reclamar', message: '¿Cómo presento un reclamo?' },
      { id: 'mis_reclamos', label: 'Mi reclamo', message: '¿En qué estado está mi reclamo?' },
      { id: 'plazos', label: 'Plazos', message: '¿Cuáles son los plazos?' },
    ],
  };
}

/** Respuesta sin LLM cuando el intent es claro */
export function tryResolveIntent(
  ultimoMensaje: string,
  ctx: ContextoEstudianteChat
): ChatResponse | null {
  const tema = detectarTema(ultimoMensaje);
  if (!tema) return null;

  let reply: string;
  switch (tema) {
    case 'mis_reclamos':
      reply = respuestaMisReclamos(ctx);
      break;
    case 'impedimento':
      reply = respuestaImpedimento(ctx);
      break;
    case 'otro': {
      const res = respuestaOtro();
      return { ...res, reply: humanizarRespuesta(res.reply) };
    }
    default:
      reply = respuestaTemplate(tema);
  }

  return {
    reply: humanizarRespuesta(reply),
    suggestions: sugerenciasPorTema(tema),
  };
}

export function sugerenciasGenericas(): ChatChip[] {
  return sugerenciasPorTema('otro');
}

export function temaDesdeChipId(chipId: string): TemaChat | null {
  const ids: TemaChat[] = [
    'como_reclamar',
    'plazos',
    'estados',
    'resultados',
    'art38',
    'impedimento',
    'mis_reclamos',
    'otro',
  ];
  return ids.includes(chipId as TemaChat) ? (chipId as TemaChat) : null;
}
