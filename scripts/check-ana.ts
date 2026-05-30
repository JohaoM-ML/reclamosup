import 'dotenv/config';
import { createPrismaClient } from '../lib/create-prisma-client';
import { getCursosEstudiante, getEvaluacionesEstudiante } from '../lib/services/reclamo.service';

const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

async function main() {
  const ana = await prisma.alumno.findFirst({
    where: { nombres: 'Ana', apellidoPaterno: 'García' },
    include: { user: true },
  });
  if (!ana) {
    console.log('Estudiante Ana García no encontrada — ejecuta npm run db:seed');
    return;
  }

  const cursos = await getCursosEstudiante(ana.userId);
  console.log('Cursos matriculados:', cursos.length);
  cursos.forEach((c) => console.log(' -', c.codigo, c.nombre));

  const evals = await getEvaluacionesEstudiante(ana.userId);
  console.log('Evaluaciones disponibles (todos cursos):', evals.length);

  for (const c of cursos.slice(0, 3)) {
    const secciones = await prisma.matricula.findMany({
      where: { estudianteId: ana.userId, curso: { codigo: c.codigo } },
      include: { curso: { select: { seccion: true } } },
    });
    for (const s of secciones) {
      const ev = await getEvaluacionesEstudiante(ana.userId, c.codigo, s.curso.seccion);
      console.log(`Curso ${c.nombre} (${c.codigo}) secc. ${s.curso.seccion}: ${ev.length} eval`);
    }
  }

  const reclamos = await prisma.reclamo.findMany({
    where: { estudianteId: ana.userId },
    include: { evaluacion: { include: { curso: true } } },
  });
  console.log('Reclamos Ana:', reclamos.length);
  reclamos.forEach((r) => console.log(' -', r.evaluacion.curso.nombre, r.estado));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
