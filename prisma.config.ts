import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// DIRECT_URL para migraciones/CLI; fallback para prisma generate sin .env de Supabase
const databaseUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
