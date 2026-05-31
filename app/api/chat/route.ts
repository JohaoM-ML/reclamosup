import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireRol } from '@/lib/auth';
import {
  buildSystemPrompt,
  humanizarRespuesta,
  MAX_TOKENS,
  truncarHistorial,
  tryResolveIntent,
  validarMensajes,
} from '@/lib/chat/asistente-estudiante';
import { detectarTema, sugerenciasPorTema } from '@/lib/chat/conocimiento-reclamos';
import { getContextoEstudianteChat } from '@/lib/chat/contexto-estudiante';

const CHAT_MODEL =
  process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

export async function POST(request: NextRequest) {
  try {
    const session = await requireRol('estudiante');

    const body = await request.json();
    const messages = validarMensajes(body.messages);

    if (!messages) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    const contexto = await getContextoEstudianteChat(session.id);
    const ultimoUsuario = [...messages].reverse().find((m) => m.role === 'user');

    if (ultimoUsuario) {
      const intent = tryResolveIntent(ultimoUsuario.content, contexto);
      if (intent) {
        return NextResponse.json({
          ...intent,
          reply: humanizarRespuesta(intent.reply),
        });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servicio de chat no configurado' },
        { status: 503 }
      );
    }

    const historial = truncarHistorial(messages);
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt(contexto),
      messages: historial.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw =
      textBlock?.type === 'text' ? textBlock.text : 'No pude generar una respuesta.';
    const reply = humanizarRespuesta(raw);

    const tema = ultimoUsuario ? detectarTema(ultimoUsuario.content) : null;
    const suggestions = tema ? sugerenciasPorTema(tema) : undefined;

    return NextResponse.json({ reply, suggestions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'No autenticado' || msg === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('[api/chat]', e);
    return NextResponse.json(
      { error: 'Error al consultar el asistente. Intenta de nuevo.' },
      { status: 502 }
    );
  }
}
