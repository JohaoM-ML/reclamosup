/**
 * Verifica conexión a Supabase. Uso: npm run db:check
 */
import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url || url.includes('[PASSWORD]') || url.includes('[PROJECT-REF]')) {
    console.error('❌ Edita reclamoup/.env con tus URLs reales de Supabase.');
    console.error('   Guía: SUPABASE.md o CONECTAR-SUPABASE.txt');
    process.exit(1);
  }

  const prisma = createPrismaClient(url);
  try {
    const count = await prisma.user.count();
    console.log('✅ Conexión OK — Supabase responde');
    console.log(`   Usuarios en BD: ${count}`);
  } catch (e) {
    console.error('❌ Error de conexión:', e instanceof Error ? e.message : e);
    console.error('   Revisa DIRECT_URL (5432) y la contraseña en .env');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
