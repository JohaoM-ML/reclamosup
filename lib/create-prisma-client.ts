import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma/client';

/** Cliente Prisma para PostgreSQL (Supabase). Usa DATABASE_URL en runtime. */
export function createPrismaClient(connectionString?: string) {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL no está definida. Configura Supabase en .env (ver CONECTAR-SUPABASE.txt).'
    );
  }
  if (url.startsWith('file:')) {
    throw new Error(
      'SQLite ya no se usa. Configura Supabase en .env — ver CONECTAR-SUPABASE.txt'
    );
  }
  if (url.includes('[PASSWORD]') || url.includes('[PROJECT-REF]')) {
    throw new Error(
      'Completa DATABASE_URL y DIRECT_URL en .env con tus datos de Supabase.'
    );
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}
