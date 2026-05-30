import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireRol } from '@/lib/auth';

const SYSTEM_PROMPT =
  'Eres un asistente de ReclamoUP, plataforma de reclamos de exámenes de la Universidad del Pacífico. Solo respondes preguntas sobre el proceso de reclamos: plazos, estados, reglas del Artículo 38 del Reglamento de Estudios de Pregrado, inhabilitación por 3 reclamos no procedentes (sanción hasta el semestre siguiente), los tres resultados posibles (No procede / Procede y modifica / Procede y NO modifica), devolución virtual del examen escaneado, y cómo usar la plataforma incluyendo el dashboard DAAR. Si te preguntan algo fuera de ese tema, indica amablemente que solo puedes ayudar con reclamos de exámenes.';

const CHAT_MODEL =
  process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

export async function POST(request: NextRequest) {
  try {
    await requireRol('estudiante');

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servicio de chat no configurado' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const messages = body.messages as { role: 'user' | 'assistant'; content: string }[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply = textBlock?.type === 'text' ? textBlock.text : 'No pude generar una respuesta.';

    return NextResponse.json({ reply });
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
