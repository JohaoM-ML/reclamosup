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
- Tono cercano y claro. Sin emojis.
- Si preguntan algo fuera de reclamos de exámenes, responde en 1 frase que solo puedes ayudar con eso.

CONTEXTO DEL ALUMNO (usa estos datos cuando pregunte por "mi reclamo", "mi nota", "puedo reclamar"):
${contexto.textoPrompt}

CONOCIMIENTO DEL PROCESO:
${hechosParaPrompt()}
`.trim();
}

function respuestaMisReclamos(ctx: ContextoEstudianteChat): string {
  if (ctx.impedidoHasta) {
    return `Estás impedido de reclamar hasta el semestre **${ctx.impedidoHasta}** (3 no procedentes). No podrás registrar nuevos reclamos hasta entonces.`;
  }

  if (ctx.reclamosActivos.length === 0) {
    if (ctx.reclamosCerrados > 0) {
      return `No tienes reclamos activos ahora. Tienes ${ctx.reclamosCerrados} reclamo(s) ya cerrado(s). Revisa el detalle en **Mis reclamos**.\n\n¿Quieres presentar uno nuevo?`;
    }
    return `Aún no tienes reclamos registrados. Puedes crear uno en **Nuevo reclamo (CAP)** si estás dentro del plazo.\n\n¿Te explico cómo hacerlo?`;
  }

  if (ctx.reclamosActivos.length === 1) {
    const r = ctx.reclamosActivos[0];
    const nota =
      r.notaNueva != null
        ? ` Nota: ${r.notaAnterior} → ${r.notaNueva}.`
        : ` Nota actual: ${r.notaAnterior}.`;
    return `Tu reclamo de **${r.curso}** (${r.evaluacion}) está en: **${r.estado}**.${nota}\n\n¿Quieres saber qué sigue en ese estado?`;
  }

  const lista = ctx.reclamosActivos
    .map((r) => `• ${r.curso} (${r.evaluacion}): ${r.estado}`)
    .join('\n');
  return `Tienes ${ctx.reclamosActivos.length} reclamos activos:\n${lista}\n\n¿Sobre cuál quieres más detalle?`;
}

function respuestaImpedimento(ctx: ContextoEstudianteChat): string {
  if (ctx.impedidoHasta) {
    return `Sí: estás **impedido** de reclamar hasta el semestre **${ctx.impedidoHasta}** por acumular 3 reclamos no procedentes.\n\n¿Tienes otra duda sobre el reglamento?`;
  }
  return `Por ahora **no** estás impedido. Recuerda: 3 reclamos no procedentes en un semestre implican sanción el semestre siguiente.\n\n¿Quieres revisar tus reclamos actuales?`;
}

function respuestaOtro(): ChatResponse {
  return {
    reply:
      'Cuéntame tu duda en pocas palabras. Puedo orientarte sobre plazos, estados, cómo reclamar o el Art. 38.',
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
    case 'otro':
      return respuestaOtro();
    default:
      reply = respuestaTemplate(tema);
  }

  return {
    reply,
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
