import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';
import { sendEmailToUser } from '../lib/services/email.service';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

/** Días antes del plazo para enviar recordatorio */
const DIAS_ANTES = 3;

async function main() {
  const ahora = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_ANTES);

  const reclamos = await prisma.reclamo.findMany({
    where: {
      estado: { in: ['ENVIADO', 'EN_REVISION'] },
      evaluacion: {
        fechaLimiteReclamo: { lte: limite },
      },
    },
    include: {
      docente: { select: { id: true, email: true } },
      evaluacion: {
        select: {
          nombre: true,
          fechaLimiteReclamo: true,
          curso: { select: { nombre: true } },
        },
      },
    },
  });

  const porDocente = new Map<
    string,
    { email: string; casos: typeof reclamos }
  >();

  for (const r of reclamos) {
    const cur = porDocente.get(r.docenteId) ?? {
      email: r.docente.email,
      casos: [],
    };
    cur.casos.push(r);
    porDocente.set(r.docenteId, cur);
  }

  let enviados = 0;
  for (const [, { email, casos }] of porDocente) {
    const lista = casos
      .map(
        (c) =>
          `• ${c.evaluacion.curso.nombre} — ${c.evaluacion.nombre} (plazo: ${c.evaluacion.fechaLimiteReclamo.toLocaleDateString('es-PE')})`
      )
      .join('\n');

    const titulo = 'Recordatorio: reclamos pendientes de resolver';
    const mensaje = `Tiene ${casos.length} reclamo(s) pendiente(s) con plazo próximo o vencido:\n\n${lista}\n\nIngrese a ReclamoUP para resolverlos.`;

    await prisma.notificacion.create({
      data: {
        usuarioId: casos[0].docenteId,
        titulo,
        mensaje,
      },
    });

    await sendEmailToUser(email, titulo, mensaje);
    enviados++;
  }

  console.log(`Recordatorios enviados a ${enviados} docente(s) (${reclamos.length} reclamo(s)).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
