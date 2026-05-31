import {
  getCursosEstudiante,
  getImpedidoEstudiante,
  getMisReclamos,
} from '@/lib/services/reclamo.service';
import { ESTADO_LABELS, RESULTADO_FINAL_LABELS, type EstadoReclamo, type ResultadoFinal } from '@/lib/types';
import { getNombreUser, userDisplaySelect } from '@/lib/user-profile';
import { prisma } from '@/lib/db';

export type ContextoEstudianteChat = {
  nombre: string;
  impedidoHasta: string | null;
  cantidadCursos: number;
  nombresCursos: string[];
  reclamosActivos: Array<{
    curso: string;
    evaluacion: string;
    estado: string;
    notaAnterior: number;
    notaNueva: number | null;
  }>;
  reclamosCerrados: number;
  reclamosNoProcedentes: Array<{ curso: string; evaluacion: string }>;
  textoPrompt: string;
};

const ACTIVOS = new Set<EstadoReclamo>(['ENVIADO', 'EN_REVISION', 'EN_VALIDACION']);

export async function getContextoEstudianteChat(
  estudianteId: string
): Promise<ContextoEstudianteChat> {
  const [user, reclamos, cursos, impedidoHasta] = await Promise.all([
    prisma.user.findUnique({
      where: { id: estudianteId },
      select: userDisplaySelect,
    }),
    getMisReclamos(estudianteId),
    getCursosEstudiante(estudianteId),
    getImpedidoEstudiante(estudianteId),
  ]);

  const nombre = user ? getNombreUser(user) : 'Estudiante';

  const activos = reclamos
    .filter((r) => ACTIVOS.has(r.estado as EstadoReclamo))
    .slice(0, 5)
    .map((r) => ({
      curso: r.evaluacion.curso.nombre,
      evaluacion: r.evaluacion.nombre,
      estado: ESTADO_LABELS[r.estado as EstadoReclamo] ?? r.estado,
      notaAnterior: r.notaAnterior,
      notaNueva: r.notaNueva,
    }));

  const cerrados = reclamos.filter(
    (r) => !ACTIVOS.has(r.estado as EstadoReclamo)
  ).length;

  const noProcedentes = reclamos
    .filter((r) => r.resultadoFinal === 'no_procede')
    .map((r) => ({
      curso: r.evaluacion.curso.nombre,
      evaluacion: r.evaluacion.nombre,
    }));

  const lineas: string[] = [
    `Alumno: ${nombre}`,
    `Impedido hasta semestre: ${impedidoHasta ?? 'ninguno (puede reclamar)'}`,
    `Cursos matriculados (${cursos.length}): ${cursos.map((c) => c.nombre).join(', ') || 'ninguno'}`,
  ];

  if (activos.length === 0) {
    lineas.push('Reclamos activos: ninguno');
  } else {
    lineas.push('Reclamos activos:');
    for (const r of activos) {
      const nota =
        r.notaNueva != null ? `nota ${r.notaAnterior} → ${r.notaNueva}` : `nota ${r.notaAnterior}`;
      lineas.push(`  - ${r.curso}, ${r.evaluacion}: ${r.estado} (${nota})`);
    }
  }

  lineas.push(`Reclamos cerrados/rechazados: ${cerrados}`);

  if (noProcedentes.length > 0) {
    lineas.push('Reclamos no procedentes (causan impedimento si son 3 en el semestre):');
    for (const r of noProcedentes) {
      lineas.push(`  - ${r.curso}, ${r.evaluacion}`);
    }
  }

  const ultimoCerrado = reclamos.find((r) => r.estado === 'CERRADO');
  if (ultimoCerrado?.resultadoFinal) {
    lineas.push(
      `Último resultado cerrado: ${RESULTADO_FINAL_LABELS[ultimoCerrado.resultadoFinal as ResultadoFinal]}`
    );
  }

  return {
    nombre,
    impedidoHasta,
    cantidadCursos: cursos.length,
    nombresCursos: cursos.map((c) => c.nombre),
    reclamosActivos: activos,
    reclamosCerrados: cerrados,
    reclamosNoProcedentes: noProcedentes,
    textoPrompt: lineas.join('\n'),
  };
}
