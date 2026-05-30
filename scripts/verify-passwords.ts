import 'dotenv/config';
import { verifyPassword } from '../lib/auth';
import { CONTRASENA_INICIAL } from '../lib/contrasena-inicial';
import { createPrismaClient } from '../lib/create-prisma-client';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, password: true, rol: true },
    take: 5,
  });

  const all = await prisma.user.findMany({ select: { password: true } });
  const hashesUnicos = new Set(all.map((u) => u.password));

  console.log(`Total usuarios: ${all.length}`);
  console.log(`Hashes distintos en columna password: ${hashesUnicos.size}`);
  console.log('');
  console.log('Nota: la columna password NUNCA muestra "demo123".');
  console.log('Se guarda el hash bcrypt (cadena larga). Eso es correcto y seguro.');
  console.log('');

  let ok = 0;
  for (const u of users) {
    const valid = await verifyPassword(CONTRASENA_INICIAL, u.password);
    console.log(`${valid ? 'OK' : 'FAIL'} ${u.rol.padEnd(11)} ${u.email}`);
    if (valid) ok++;
  }

  console.log('');
  console.log(`Verificación demo123: ${ok}/${users.length} muestra OK`);
  if (hashesUnicos.size === 1) {
    console.log('Todos comparten el mismo hash en la base (tras db:sync-passwords).');
  } else if (hashesUnicos.size > 1) {
    console.log('Hay varios hashes distintos, pero demo123 puede funcionar igual (sal distinta por usuario).');
    console.log('Ejecuta: npm run db:sync-passwords  → unifica el hash en todos.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
