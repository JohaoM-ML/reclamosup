export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatChip = {
  id: string;
  label: string;
  /** Mensaje que se envía al pulsar el chip */
  message: string;
};

export type ChatResponse = {
  reply: string;
  suggestions?: ChatChip[];
};

export type TemaChat =
  | 'como_reclamar'
  | 'plazos'
  | 'estados'
  | 'resultados'
  | 'art38'
  | 'impedimento'
  | 'mis_reclamos'
  | 'otro';
