import { prisma } from '@/lib/db';
import { getAnalyticsDaar } from '@/lib/services/analytics-daar.service';
import type { ResultadoFinal } from '@/lib/types';
import { RESULTADO_FINAL_LABELS } from '@/lib/types';

export type DaarKpis = {
  total: number;
  pendientesDocente: number;
  enRevision: number;
  enValidacion: number;
  cerrados: number;
  anulados: number;
  rechazados: number;
};

export type PivotFila = {
  tipo: string;
  no_procede: number;
  procede_modifica: number;
  procede_sin_modifica: number;
  total: number;
  pctNoProcede: number;
};

export type PendienteDocente = {
  docenteId: string;
  codigo: string;
  nombre: string;
  pendientes: number;
  plazoProximo: Date | null;
};

export type PendienteCurso = {
  codigo: string;
  nombre: string;
  seccion: string;
  docenteCodigo: string;
  docenteNombre: string;
  count: number;
};

export type DeptGrupo = {
  departamento: string;
  docentes: {
    docenteId: string;
    nombre: string;
    cursos: { codigo: string; nombre: string; count: number }[];
    total: number;
  }[];
};

function filtroSemestre(semestre?: string) {
  return semestre ? { semestreAcademico: semestre } : {};
}

export async function getKpisDaar(semestre?: string): Promise<DaarKpis> {
  const where = filtroSemestre(semestre);
  const [total, pendientesDocente, enRevision, enValidacion, cerrados, anulados, rechazados] =
    await Promise.all([
      prisma.reclamo.count({ where }),
      prisma.reclamo.count({ where: { ...where, estado: 'ENVIADO' } }),
      prisma.reclamo.count({ where: { ...where, estado: 'EN_REVISION' } }),
      prisma.reclamo.count({ where: { ...where, estado: 'EN_VALIDACION' } }),
      prisma.reclamo.count({ where: { ...where, estado: 'CERRADO' } }),
      prisma.reclamo.count({ where: { ...where, estado: 'ANULADO' } }),
      prisma.reclamo.count({ where: { ...where, estado: 'RECHAZADO' } }),
    ]);
  return {
    total,
    pendientesDocente,
    enRevision,
    enValidacion,
    cerrados,
    anulados,
    rechazados,
  };
}

export async function getPivotPorTipo(semestre?: string): Promise<PivotFila[]> {
  const where = { ...filtroSemestre(semestre), estado: 'CERRADO' as const };
  const reclamos = await prisma.reclamo.findMany({
    where,
    select: {
      resultadoFinal: true,
      evaluacion: { select: { tipo: true } },
    },
  });

  const tipos = ['parcial', 'final'] as const;
  return tipos.map((tipo) => {
    const subset = reclamos.filter((r) =>
      r.evaluacion.tipo.toLowerCase().includes(tipo)
    );
    const counts = {
      no_procede: 0,
      procede_modifica: 0,
      procede_sin_modifica: 0,
    };
    for (const r of subset) {
      const key = (r.resultadoFinal ?? 'no_procede') as keyof typeof counts;
      if (key in counts) counts[key]++;
    }
    const total = subset.length;
    return {
      tipo: tipo.toUpperCase(),
      ...counts,
      total,
      pctNoProcede: total ? Math.round((counts.no_procede / total) * 100) : 0,
    };
  });
}

export async function getPendientesPorDocente(
  semestre?: string
): Promise<PendienteDocente[]> {
  const where = {
    ...filtroSemestre(semestre),
    estado: { in: ['ENVIADO', 'EN_REVISION'] as string[] },
  };
  const rows = await prisma.reclamo.findMany({
    where,
    select: {
      docenteId: true,
      docente: {
        select: {
          docente: {
            select: {
              codigo: true,
              nombres: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
            },
          },
        },
      },
      evaluacion: { select: { fechaLimiteReclamo: true } },
    },
  });

  const map = new Map<string, PendienteDocente>();
  for (const r of rows) {
    const d = r.docente.docente;
    const nombre = d
      ? `${d.nombres} ${d.apellidoPaterno} ${d.apellidoMaterno}`.trim()
      : 'Docente';
    const cur = map.get(r.docenteId) ?? {
      docenteId: r.docenteId,
      codigo: d?.codigo ?? '—',
      nombre,
      pendientes: 0,
      plazoProximo: null,
    };
    cur.pendientes++;
    const plazo = r.evaluacion.fechaLimiteReclamo;
    if (!cur.plazoProximo || plazo < cur.plazoProximo) cur.plazoProximo = plazo;
    map.set(r.docenteId, cur);
  }
  return [...map.values()].sort((a, b) => b.pendientes - a.pendientes);
}

export async function getPendientesPorCurso(semestre?: string): Promise<PendienteCurso[]> {
  const where = {
    ...filtroSemestre(semestre),
    estado: { in: ['ENVIADO', 'EN_REVISION', 'EN_VALIDACION'] as string[] },
  };
  const rows = await prisma.reclamo.findMany({
    where,
    select: {
      evaluacion: {
        select: {
          nombre: true,
          curso: {
            select: {
              codigo: true,
              nombre: true,
              seccion: true,
              docente: {
                select: { codigo: true, nombres: true, apellidoPaterno: true },
              },
            },
          },
        },
      },
    },
  });

  const map = new Map<string, PendienteCurso>();
  for (const r of rows) {
    const c = r.evaluacion.curso;
    const key = `${c.codigo}:${c.seccion}`;
    const cur = map.get(key) ?? {
      codigo: c.codigo,
      nombre: c.nombre,
      seccion: c.seccion,
      docenteCodigo: c.docente.codigo,
      docenteNombre: `${c.docente.nombres} ${c.docente.apellidoPaterno}`,
      count: 0,
    };
    cur.count++;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) =>
    a.codigo.localeCompare(b.codigo) || a.seccion.localeCompare(b.seccion)
  );
}

export async function getReclamosPendientesDocenteDaar(docenteId: string, semestre?: string) {
  const docenteUser = await prisma.user.findUnique({
    where: { id: docenteId },
    select: {
      email: true,
      docente: {
        select: { codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true },
      },
    },
  });

  if (!docenteUser?.docente) {
    return { docente: null, reclamos: [] };
  }

  const d = docenteUser.docente;
  const nombre = `${d.nombres} ${d.apellidoPaterno} ${d.apellidoMaterno}`.trim();

  const rows = await prisma.reclamo.findMany({
    where: {
      docenteId,
      ...filtroSemestre(semestre),
      estado: { in: ['ENVIADO', 'EN_REVISION'] },
    },
    select: {
      id: true,
      estado: true,
      estudiante: {
        select: {
          alumno: { select: { nombres: true, apellidoPaterno: true, codigo: true } },
          email: true,
        },
      },
      evaluacion: {
        select: {
          nombre: true,
          fechaLimiteReclamo: true,
          curso: { select: { codigo: true, nombre: true, seccion: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    docente: { codigo: d.codigo, nombre },
    reclamos: rows.map((r) => ({
      id: r.id,
      estado: r.estado,
      estudianteCodigo: r.estudiante.alumno?.codigo ?? '—',
      estudianteNombre: r.estudiante.alumno
        ? `${r.estudiante.alumno.nombres} ${r.estudiante.alumno.apellidoPaterno}`
        : r.estudiante.email,
      cursoCodigo: r.evaluacion.curso.codigo,
      cursoNombre: r.evaluacion.curso.nombre,
      seccion: r.evaluacion.curso.seccion,
      evaluacionNombre: r.evaluacion.nombre,
      plazo: r.evaluacion.fechaLimiteReclamo,
    })),
  };
}

export async function getAgrupadoPorDepartamento(
  semestre?: string
): Promise<DeptGrupo[]> {
  const where = filtroSemestre(semestre);
  const rows = await prisma.reclamo.findMany({
    where,
    select: {
      docenteId: true,
      docente: {
        select: {
          docente: {
            select: { nombres: true, apellidoPaterno: true, apellidoMaterno: true },
          },
        },
      },
      evaluacion: {
        select: {
          curso: { select: { codigo: true, nombre: true, departamento: true } },
        },
      },
    },
  });

  const deptMap = new Map<string, DeptGrupo>();
  for (const r of rows) {
    const dept = r.evaluacion.curso.departamento;
    const d = r.docente.docente;
    const nombreDoc = d
      ? `${d.nombres} ${d.apellidoPaterno} ${d.apellidoMaterno}`.trim()
      : 'Docente';

    if (!deptMap.has(dept)) {
      deptMap.set(dept, { departamento: dept, docentes: [] });
    }
    const grupo = deptMap.get(dept)!;
    let doc = grupo.docentes.find((x) => x.docenteId === r.docenteId);
    if (!doc) {
      doc = { docenteId: r.docenteId, nombre: nombreDoc, cursos: [], total: 0 };
      grupo.docentes.push(doc);
    }
    doc.total++;
    const cur = doc.cursos.find((c) => c.codigo === r.evaluacion.curso.codigo);
    if (cur) cur.count++;
    else
      doc.cursos.push({
        codigo: r.evaluacion.curso.codigo,
        nombre: r.evaluacion.curso.nombre,
        count: 1,
      });
  }
  return [...deptMap.values()].sort((a, b) => a.departamento.localeCompare(b.departamento));
}

export async function getEntregasFisicasPendientes() {
  return prisma.solicitudExamenFisico.findMany({
    where: { entregadoAt: null },
    include: {
      reclamo: {
        include: {
          evaluacion: { include: { curso: { select: { nombre: true, codigo: true } } } },
          estudiante: {
            select: {
              email: true,
              alumno: { select: { nombres: true, apellidoPaterno: true } },
            },
          },
        },
      },
      docente: { select: { nombres: true, apellidoPaterno: true } },
    },
    orderBy: { solicitadoAt: 'asc' },
  });
}

export function labelResultado(r: ResultadoFinal | null | undefined): string {
  if (!r) return '—';
  return RESULTADO_FINAL_LABELS[r];
}

export async function getDashboardDaarData(semestre?: string) {
  const s = semestre ?? '2026-I';
  const [kpis, pivot, porDocente, porCurso, porDepartamento, entregasFisicas, analytics] =
    await Promise.all([
      getKpisDaar(s),
      getPivotPorTipo(s),
      getPendientesPorDocente(s),
      getPendientesPorCurso(s),
      getAgrupadoPorDepartamento(s),
      getEntregasFisicasPendientes(),
      getAnalyticsDaar(s),
    ]);
  return { kpis, pivot, porDocente, porCurso, porDepartamento, entregasFisicas, analytics };
}
