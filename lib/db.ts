import { createPrismaClient } from '@/lib/create-prisma-client';
import type { PrismaClient } from '@/app/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  // Invalidate cache from pre-refactor schema (User without Alumno/Docente tables)
  if (cached && 'alumno' in cached) {
    return cached;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
