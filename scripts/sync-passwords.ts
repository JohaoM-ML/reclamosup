import 'dotenv/config';
import { hashPassword } from '../lib/auth';
import { CONTRASENA_INICIAL } from '../lib/contrasena-inicial';
import { createPrismaClient } from '../lib/create-prisma-client';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

async function main() {
  const password = await hashPassword(CONTRASENA_INICIAL);
  const { count } = await prisma.user.updateMany({ data: { password } });
  console.log(`Contraseña sincronizada en ${count} usuario(s): "${CONTRASENA_INICIAL}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
