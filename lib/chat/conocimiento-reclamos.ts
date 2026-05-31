import type { ChatChip, TemaChat } from '@/lib/chat/types';

export const MENSAJE_BIENVENIDA =
  'Hola, soy el asistente de ReclamoUP. ¿En qué te ayudo con tu reclamo de examen?';

export const CHIPS_INICIALES: ChatChip[] = [
  {
    id: 'como_reclamar',
    label: 'Cómo presentar un reclamo',
    message: '¿Cómo presento un reclamo?',
  },
  {
    id: 'plazos',
    label: 'Plazos y fechas',
    message: '¿Cuáles son los plazos para reclamar?',
  },
  {
    id: 'mis_reclamos',
    label: 'Estado de mi reclamo',
    message: '¿En qué estado está mi reclamo?',
  },
  {
    id: 'art38',
    label: 'Artículo 38 (lápiz)',
    message: '¿Qué dice el Artículo 38 sobre el lápiz?',
  },
  {
    id: 'resultados',
    label: 'Resultados posibles',
    message: '¿Qué resultados puede dar el docente?',
  },
  {
    id: 'otro',
    label: 'Tengo otra duda',
    message: 'Tengo otra pregunta sobre reclamos',
  },
];

const RESPUESTAS_TEMPLATE: Record<TemaChat, string> = {
  como_reclamar:
    'Ve al CAP, inicia sesión y entra a **Nuevo reclamo (CAP)**. Elige curso, sección y evaluación (Parcial o Final), escribe tu argumento, adjunta el PDF del examen escaneado y confirma que no fue hecho con lápiz (Art. 38). Al enviar, el reclamo llega directo al docente.\n\n¿Quieres que te explique algún paso en particular?',
  plazos:
    'Solo puedes reclamar mientras la evaluación tenga **fecha límite vigente** en el sistema. Si el plazo ya venció, no podrás registrar el reclamo.\n\n¿Quieres revisar el estado de alguna evaluación tuya?',
  estados:
    'Tu reclamo avanza así: **Enviado al docente** → **En revisión** → **En validación DAAR** → **Concluido**. También puede quedar Rechazado o Anulado.\n\n¿Quieres saber en qué etapa está el tuyo?',
  resultados:
    'El docente puede resolver: **No procede**, **Procede y modifica** (cambia la nota) o **Procede y NO modifica** (procede pero la nota se mantiene). Luego DAAR valida y cierra el trámite.\n\n¿Te explico alguno con más detalle?',
  art38:
    'Si tu examen fue hecho con **lápiz u otro medio borrable**, el reclamo **no procede** según el Art. 38. Debes marcar la casilla de confirmación al registrar el reclamo.\n\n¿Tienes duda sobre otro requisito?',
  impedimento:
    'Si acumulas **3 reclamos no procedentes** en un semestre, quedas **impedido** de reclamar el semestre siguiente.\n\n¿Quieres saber si esto te aplica a ti?',
  mis_reclamos:
    'Puedes ver todos tus reclamos en **Mis reclamos** (menú izquierdo). Ahí aparece el estado, curso y evaluación de cada uno.\n\n¿Quieres que revise el estado de tus reclamos actuales?',
  otro:
    'Cuéntame tu duda en una frase y te oriento. Recuerda que solo puedo ayudarte con el proceso de reclamos de exámenes en ReclamoUP.',
};

const SEGUIMIENTO_POR_TEMA: Record<TemaChat, ChatChip[]> = {
  como_reclamar: [
    { id: 'plazos', label: '¿Y los plazos?', message: '¿Cuáles son los plazos para reclamar?' },
    { id: 'art38', label: 'Art. 38 lápiz', message: '¿Qué dice el Artículo 38?' },
  ],
  plazos: [
    { id: 'mis_reclamos', label: 'Ver mi reclamo', message: '¿En qué estado está mi reclamo?' },
    { id: 'como_reclamar', label: 'Cómo reclamar', message: '¿Cómo presento un reclamo?' },
  ],
  estados: [
    { id: 'mis_reclamos', label: '¿Y el mío?', message: '¿En qué estado está mi reclamo?' },
    { id: 'resultados', label: 'Resultados', message: '¿Qué resultados puede dar el docente?' },
  ],
  resultados: [
    { id: 'estados', label: 'Estados del trámite', message: '¿Cuáles son los estados de un reclamo?' },
    { id: 'mis_reclamos', label: 'Mi reclamo', message: '¿En qué estado está mi reclamo?' },
  ],
  art38: [
    { id: 'como_reclamar', label: 'Cómo reclamar', message: '¿Cómo presento un reclamo?' },
  ],
  impedimento: [
    { id: 'mis_reclamos', label: 'Mis reclamos', message: '¿En qué estado está mi reclamo?' },
  ],
  mis_reclamos: [
    { id: 'estados', label: 'Explicar estados', message: '¿Qué significa cada estado?' },
    { id: 'resultados', label: 'Resultados', message: '¿Qué resultados puede dar el docente?' },
  ],
  otro: CHIPS_INICIALES.slice(0, 4),
};

export function respuestaTemplate(tema: TemaChat): string {
  return RESPUESTAS_TEMPLATE[tema];
}

export function sugerenciasPorTema(tema: TemaChat): ChatChip[] {
  return SEGUIMIENTO_POR_TEMA[tema] ?? [];
}

export function detectarTema(mensaje: string): TemaChat | null {
  const t = mensaje.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

  if (
    /como (presento|hago|registro|envio)|nuevo reclamo|pasos para reclamar/.test(t)
  ) {
    return 'como_reclamar';
  }
  if (/plazo|fecha limite|hasta cuando|cuando puedo reclamar/.test(t)) {
    return 'plazos';
  }
  if (
    /estado de mi|mi reclamo|mis reclamos|como va mi|en que estado/.test(t) ||
    (/estado/.test(t) && /mi|mio|mía/.test(t))
  ) {
    return 'mis_reclamos';
  }
  if (/estado|etapa|enviado|revision|validacion|concluido/.test(t) && !/mi reclamo/.test(t)) {
    return 'estados';
  }
  if (/resultado|procede|no procede|modifica|nota nueva/.test(t)) {
    return 'resultados';
  }
  if (/articulo 38|art\.?\s*38|lapiz|lápiz|borrable/.test(t)) {
    return 'art38';
  }
  if (/impedido|impedimento|3 reclamo|puedo reclamar|sancion/.test(t)) {
    return 'impedimento';
  }
  if (/hola|buenas|ayuda|otra duda|otra pregunta/.test(t) && t.length < 40) {
    return 'otro';
  }

  return null;
}

export function hechosParaPrompt(): string {
  return `
FLUJO ACTUAL (ReclamoUP):
1. Estudiante va al CAP, inicia sesión, entra a "Nuevo reclamo (CAP)".
2. Selecciona curso, sección y evaluación (Parcial/Final) dentro del plazo.
3. Indica motivo, argumento(s), adjunta PDF del examen escaneado.
4. Confirma Art. 38 (examen NO hecho con lápiz). Envía → estado "Enviado al docente".
5. Docente revisa el PDF y decide → "En validación DAAR".
6. DAAR cierra → "Concluido".

REGLAS CLAVE:
- Un reclamo por evaluación.
- Solo cursos matriculados.
- 3 no procedentes en el semestre → impedido el semestre siguiente.
- Resultados docente: No procede / Procede y modifica / Procede y NO modifica.

NO MENCIONAR: representante de aula, escaneo por DAAR, "Tomar caso" del docente.
`.trim();
}
