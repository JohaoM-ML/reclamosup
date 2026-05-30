import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';
import {
  EXAMENES_BUCKET,
  getSupabaseAdmin,
  isSupabaseStorageConfigured,
} from '../lib/supabase-admin';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

async function borrarArchivosStorage(reclamoIds: string[]) {
  if (!isSupabaseStorageConfigured() || reclamoIds.length === 0) return;

  const supabase = getSupabaseAdmin();
  const paths = reclamoIds.flatMap((id) => [`${id}/examen.pdf`, `${id}/examen.png`, `${id}/examen.jpg`, `${id}/examen.jpeg`]);

  const { error } = await supabase.storage.from(EXAMENES_BUCKET).remove(paths);
  if (error) {
    console.warn('  Aviso Storage:', error.message);
  }
}

async function main() {
  const reclamos = await prisma.reclamo.findMany({
    select: { id: true, archivoPath: true },
  });

  console.log(`Eliminando ${reclamos.length} reclamo(s) y datos relacionados...`);

  await borrarArchivosStorage(reclamos.map((r) => r.id));

  const notif = await prisma.notificacion.deleteMany({
    where: { reclamoId: { not: null } },
  });
  const eventos = await prisma.reclamoEvento.deleteMany();
  const reclamosDeleted = await prisma.reclamo.deleteMany();

  console.log(`  Notificaciones: ${notif.count}`);
  console.log(`  Eventos:        ${eventos.count}`);
  console.log(`  Reclamos:       ${reclamosDeleted.count}`);
  console.log('Listo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
