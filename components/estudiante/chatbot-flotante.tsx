'use client';

import { useEffect, useRef, useState } from 'react';
import { CHIPS_INICIALES, MENSAJE_BIENVENIDA } from '@/lib/chat/conocimiento-reclamos';
import type { ChatChip, ChatMessage } from '@/lib/chat/types';
import { inputClass } from '@/lib/types';

function ChipsSugerencias({
  chips,
  onSelect,
  disabled,
}: {
  chips: ChatChip[];
  onSelect: (chip: ChatChip) => void;
  disabled: boolean;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className="rounded-full border border-up-border bg-up-surface px-3 py-1.5 text-xs text-up-text-secondary hover:border-up-blue hover:text-up-blue disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

export function ChatbotFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [sugerencias, setSugerencias] = useState<ChatChip[]>(CHIPS_INICIALES);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, escribiendo, sugerencias]);

  async function enviarTexto(texto: string) {
    const trimmed = texto.trim();
    if (!trimmed || escribiendo) return;

    const nuevosMensajes: ChatMessage[] = [...mensajes, { role: 'user', content: trimmed }];
    setMensajes(nuevosMensajes);
    setInput('');
    setSugerencias([]);
    setEscribiendo(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nuevosMensajes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al obtener respuesta');
        setSugerencias(CHIPS_INICIALES);
        return;
      }

      setMensajes((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setSugerencias(
        Array.isArray(data.suggestions) && data.suggestions.length > 0
          ? data.suggestions
          : CHIPS_INICIALES.slice(0, 3)
      );
    } catch {
      setError('No se pudo conectar con el asistente');
      setSugerencias(CHIPS_INICIALES);
    } finally {
      setEscribiendo(false);
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    void enviarTexto(input);
  }

  function seleccionarChip(chip: ChatChip) {
    void enviarTexto(chip.message);
  }

  return (
    <>
      {abierto && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[480px] w-[min(100vw-2rem,380px)] flex-col rounded-lg border border-up-border bg-up-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-up-border bg-up-navy px-4 py-3 text-white">
            <h3 className="font-semibold">Asistente ReclamoUP</h3>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="text-white/70 hover:text-white text-xl leading-none"
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </div>

          <div ref={listaRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-sm rounded-lg px-3 py-2 max-w-[90%] bg-up-surface-muted text-up-text">
              <span className="whitespace-pre-wrap break-words">{MENSAJE_BIENVENIDA}</span>
              {mensajes.length === 0 && (
                <ChipsSugerencias
                  chips={sugerencias}
                  onSelect={seleccionarChip}
                  disabled={escribiendo}
                />
              )}
            </div>

            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 max-w-[90%] ${
                  m.role === 'user'
                    ? 'ml-auto bg-up-blue text-white'
                    : 'bg-up-surface-muted text-up-text'
                }`}
              >
                <span className="whitespace-pre-wrap break-words">{m.content}</span>
              </div>
            ))}

            {!escribiendo && mensajes.length > 0 && (
              <ChipsSugerencias
                chips={sugerencias}
                onSelect={seleccionarChip}
                disabled={escribiendo}
              />
            )}

            {escribiendo && (
              <div className="text-sm text-up-text-muted flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-up-blue border-t-transparent" />
                Escribiendo...
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}
          </div>

          <form onSubmit={enviar} className="border-t border-up-border p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className={`${inputClass} flex-1`}
              disabled={escribiendo}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={escribiendo || !input.trim()}
              className="rounded-md bg-up-blue px-3 py-2 text-sm text-white hover:bg-up-blue-hover disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-up-blue px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-up-blue-hover"
      >
        {abierto ? 'Cerrar chat' : 'Asistente'}
      </button>
    </>
  );
}
