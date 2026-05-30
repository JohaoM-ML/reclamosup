'use client';

import { useEffect, useRef, useState } from 'react';
import { inputClass } from '@/lib/types';

type Message = { role: 'user' | 'assistant'; content: string };

export function ChatbotFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, escribiendo]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || escribiendo) return;

    const nuevosMensajes: Message[] = [...mensajes, { role: 'user', content: texto }];
    setMensajes(nuevosMensajes);
    setInput('');
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
        return;
      }

      setMensajes((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setError('No se pudo conectar con el asistente');
    } finally {
      setEscribiendo(false);
    }
  }

  return (
    <>
      {abierto && (
        <div className="fixed bottom-20 right-4 z-50 w-[min(100vw-2rem,380px)] rounded-lg border border-gray-200 bg-white shadow-xl flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Asistente ReclamoUP</h3>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </div>

          <div ref={listaRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensajes.length === 0 && (
              <p className="text-sm text-gray-500">
                Pregúntame sobre plazos, estados de reclamo, el Artículo 38 o cómo usar la
                plataforma.
              </p>
            )}
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 max-w-[90%] ${
                  m.role === 'user'
                    ? 'ml-auto bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {m.content}
              </div>
            ))}
            {escribiendo && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                Escribiendo...
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}
          </div>

          <form onSubmit={enviar} className="border-t border-gray-200 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className={`${inputClass} flex-1`}
              disabled={escribiendo}
            />
            <button
              type="submit"
              disabled={escribiendo || !input.trim()}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-indigo-700"
      >
        {abierto ? 'Cerrar chat' : 'Asistente'}
      </button>
    </>
  );
}
