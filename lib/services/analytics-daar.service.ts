import { prisma } from '@/lib/db';
import { facultadDesdeDepartamento, FACULTADES_ORDEN } from '@/lib/facultad';
import {
  bucketDiasResolucion,
  CICLO_TOTAL_SEMANAS,
  diasEntre,
  etiquetasSemanas,
  META_RESOLUCION_DIAS,
  META_RESPUESTA_DOCENTE_DIAS,
  PLAZO_DOCENTE_DIAS,
  semanaDelCiclo,
  SLA_CIERRE_DIAS,
} from '@/lib/domain/ciclo-semanas';

const filtroSemestre = (semestre?: string) =>
  semestre ? { semestreAcademico: semestre } : {};

type EventoRow = { accion: string; createdAt: Date };

function evento(eventos: EventoRow[], accion: string): Date | null {
  const ev = eventos.find((e) => e.accion === accion);
  return ev ? ev.createdAt : null;
}

async function reclamosConContexto(semestre?: string) {
  return prisma.reclamo.findMany({
    where: filtroSemestre(semestre),
    select: {
      id: true,
      estado: true,
      createdAt: true,
      updatedAt: true,
      estudianteId: true,
      docenteId: true,
      decision: true,
      notaAnterior: true,
      notaNueva: true,
      resultadoFinal: true,
      argumento: true,
      examenNoLapiz: true,
      archivoPath: true,
      evaluacion: {
        select: {
          tipo: true,
          fechaLimiteReclamo: true,
          curso: { select: { nombre: true, codigo: true, departamento: true } },
        },
      },
      docente: {
        select: {
          docente: { select: { nombres: true, apellidoPaterno: true } },
        },
      },
      eventos: { select: { accion: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
    },
  });
}

function facultad(r: { evaluacion: { curso: { departamento: string } } }) {
  return facultadDesdeDepartamento(r.evaluacion.curso.departamento);
}

function esParcial(tipo: string) {
  return tipo.toLowerCase().includes('parcial');
}

function calidadCategoria(notaAnterior: number, notaNueva: number | null): 'sube' | 'sin_cambio' | 'baja' | null {
  if (notaNueva == null) return null;
  if (notaNueva > notaAnterior) return 'sube';
  if (notaNueva < notaAnterior) return 'baja';
  return 'sin_cambio';
}

function promedio(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function pct(parte: number, total: number): number {
  return total ? Math.round((parte / total) * 100) : 0;
}

export async function getAnalyticsTiempos(semestre = '2026-I') {
  const rows = await reclamosConContexto(semestre);
  const tiemposResolucion: number[] = [];
  const tiemposDocente: number[] = [];
  const buckets: Record<string, number> = { '1-2': 0, '3-5': 0, '6-10': 0, '+10': 0 };
  const porFacultad = new Map<string, number[]>();
  const porSemana = new Map<number, number[]>();

  for (const r of rows) {
    if (r.estado !== 'CERRADO') continue;
    const cierre = evento(r.eventos, 'DAAR_CERRO') ?? r.updatedAt;
    const dias = diasEntre(r.createdAt, cierre);
    tiemposResolucion.push(dias);
    buckets[bucketDiasResolucion(dias)]++;

    const fac = facultad(r);
    const listF = porFacultad.get(fac) ?? [];
    listF.push(dias);
    porFacultad.set(fac, listF);

    const sem = semanaDelCiclo(cierre, semestre);
    const listS = porSemana.get(sem) ?? [];
    listS.push(dias);
    porSemana.set(sem, listS);

    const tomo = evento(r.eventos, 'DOCENTE_TOMO_CASO');
    const resolvio = evento(r.eventos, 'DOCENTE_RESOLVIO');
    const inicioDoc = tomo ?? r.createdAt;
    const finDoc = resolvio ?? r.updatedAt;
    if (resolvio || r.decision) {
      tiemposDocente.push(diasEntre(inicioDoc, finDoc));
    }
  }

  const evolucionSemanal = etiquetasSemanas().map((label, i) => ({
    semana: label,
    promedio: promedio(porSemana.get(i + 1) ?? []),
  }));

  const porFacultadArr = FACULTADES_ORDEN.filter((f) => porFacultad.has(f)).map((f) => ({
    facultad: f,
    promedio: promedio(porFacultad.get(f) ?? []),
  }));

  const peorFacultad = [...porFacultadArr].sort((a, b) => b.promedio - a.promedio)[0];

  return {
    promedioResolucion: promedio(tiemposResolucion),
    promedioRespuestaDocente: promedio(tiemposDocente),
    metaResolucion: META_RESOLUCION_DIAS,
    metaDocente: META_RESPUESTA_DOCENTE_DIAS,
    distribucion: Object.entries(buckets).map(([rango, count]) => ({ rango, count })),
    porFacultad: porFacultadArr,
    evolucionSemanal,
    insight: peorFacultad && peorFacultad.promedio > META_RESOLUCION_DIAS
      ? `${peorFacultad.facultad} supera la meta de ${META_RESOLUCION_DIAS} días. Requiere atención prioritaria.`
      : 'Los tiempos de resolución están dentro de la meta general.',
  };
}

export async function getAnalyticsVolumen(semestre = '2026-I') {
  const rows = await reclamosConContexto(semestre);
  let parcial = 0;
  let final = 0;
  const porFacultad = new Map<string, number>();
  const porCurso = new Map<string, number>();
  const porDocente = new Map<string, { nombre: string; count: number }>();
  const parcialFinalFac = new Map<string, { parcial: number; final: number }>();

  for (const r of rows) {
    const fac = facultad(r);
    porFacultad.set(fac, (porFacultad.get(fac) ?? 0) + 1);

    const curso = r.evaluacion.curso.nombre;
    porCurso.set(curso, (porCurso.get(curso) ?? 0) + 1);

    const d = r.docente.docente;
    const nombreDoc = d ? `${d.nombres} ${d.apellidoPaterno}` : 'Docente';
    const curD = porDocente.get(r.docenteId) ?? { nombre: nombreDoc, count: 0 };
    curD.count++;
    porDocente.set(r.docenteId, curD);

    const pf = parcialFinalFac.get(fac) ?? { parcial: 0, final: 0 };
    if (esParcial(r.evaluacion.tipo)) {
      parcial++;
      pf.parcial++;
    } else {
      final++;
      pf.final++;
    }
    parcialFinalFac.set(fac, pf);
  }

  const topCursos = [...porCurso.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([nombre, count]) => ({ nombre, count }));

  const topDocentes = [...porDocente.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((d) => ({ nombre: d.nombre, count: d.count }));

  const parcialFinalPorFacultad = FACULTADES_ORDEN.filter((f) => parcialFinalFac.has(f)).map(
    (f) => ({
      facultad: f,
      ...(parcialFinalFac.get(f) ?? { parcial: 0, final: 0 }),
    })
  );

  const totalGeneral = rows.length;
  const topCurso = topCursos[0];

  return {
    total: totalGeneral,
    parcial,
    final,
    porFacultad: FACULTADES_ORDEN.filter((f) => porFacultad.has(f)).map((f) => ({
      facultad: f,
      count: porFacultad.get(f) ?? 0,
    })),
    topCursos,
    topDocentes,
    parcialFinalPorFacultad,
    insight: topCurso
      ? `${topCurso.nombre} concentra ${topCurso.count} reclamos — revisar criterios de corrección.`
      : 'Sin reclamos registrados en el ciclo.',
  };
}

export async function getAnalyticsCalidad(semestre = '2026-I') {
  const rows = await reclamosConContexto(semestre);
  const cerrados = rows.filter((r) => r.estado === 'CERRADO' && r.decision);
  let sube = 0;
  let sinCambio = 0;
  let baja = 0;
  const deltaPorFacultad = new Map<string, number[]>();
  const porDocente = new Map<string, { nombre: string; sube: number; sinCambio: number; baja: number }>();

  for (const r of cerrados) {
    const cat = calidadCategoria(r.notaAnterior, r.notaNueva);
    if (!cat) continue;
    if (cat === 'sube') sube++;
    else if (cat === 'sin_cambio') sinCambio++;
    else baja++;

    if (r.decision === 'procedente' && r.notaNueva != null) {
      const fac = facultad(r);
      const deltas = deltaPorFacultad.get(fac) ?? [];
      deltas.push(r.notaNueva - r.notaAnterior);
      deltaPorFacultad.set(fac, deltas);
    }

    const d = r.docente.docente;
    const nombreDoc = d ? `${d.nombres} ${d.apellidoPaterno}` : 'Docente';
    const cur = porDocente.get(r.docenteId) ?? { nombre: nombreDoc, sube: 0, sinCambio: 0, baja: 0 };
    cur[cat === 'sin_cambio' ? 'sinCambio' : cat]++;
    porDocente.set(r.docenteId, cur);
  }

  const total = sube + sinCambio + baja;

  const topDocentes = [...porDocente.values()]
    .sort((a, b) => b.sube + b.sinCambio + b.baja - (a.sube + a.sinCambio + a.baja))
    .slice(0, 5)
    .map((d) => {
      const t = d.sube + d.sinCambio + d.baja;
      return {
        nombre: d.nombre,
        sube: pct(d.sube, t),
        sinCambio: pct(d.sinCambio, t),
        baja: pct(d.baja, t),
        subeCount: d.sube,
        sinCambioCount: d.sinCambio,
        bajaCount: d.baja,
      };
    });

  const deltaFac = FACULTADES_ORDEN.filter((f) => deltaPorFacultad.has(f)).map((f) => ({
    facultad: f,
    delta: promedio(deltaPorFacultad.get(f) ?? []),
  }));

  const maxDelta = [...deltaFac].sort((a, b) => b.delta - a.delta)[0];

  return {
    pctSube: pct(sube, total),
    pctSinCambio: pct(sinCambio, total),
    pctBaja: pct(baja, total),
    total,
    donut: [
      { name: 'Nota sube', value: sube, pct: pct(sube, total) },
      { name: 'Sin cambio', value: sinCambio, pct: pct(sinCambio, total) },
      { name: 'Nota baja', value: baja, pct: pct(baja, total) },
    ],
    deltaPorFacultad: deltaFac,
    topDocentes,
    insight: maxDelta
      ? `${maxDelta.facultad} muestra el mayor delta de puntos (+${maxDelta.delta}). Revisar criterios de corrección.`
      : 'Sin datos de recalificación cerrados.',
  };
}

export async function getAnalyticsCumplimiento(semestre = '2026-I') {
  const rows = await reclamosConContexto(semestre);
  const total = rows.length;
  let formulariosOk = 0;
  let docentesPlazo = 0;
  let docentesEvaluados = 0;
  let cerrados = 0;

  const formOkPorFac = new Map<string, { ok: number; total: number }>();
  const docPlazoPorFac = new Map<string, { ok: number; total: number }>();
  const formOkPorSemana = new Map<number, { ok: number; total: number }>();

  const alumnosConReclamo = new Set<string>();
  const alumnosReincidentes = new Set<string>();
  const noProcPorAlumno = new Map<string, number>();

  for (const r of rows) {
    alumnosConReclamo.add(r.estudianteId);
    const fac = facultad(r);

    const formOk =
      r.examenNoLapiz && !!r.archivoPath && r.argumento.length >= 10;
    if (formOk) formulariosOk++;

    const ff = formOkPorFac.get(fac) ?? { ok: 0, total: 0 };
    ff.total++;
    if (formOk) ff.ok++;
    formOkPorFac.set(fac, ff);

    const sem = semanaDelCiclo(r.createdAt, semestre);
    const fs = formOkPorSemana.get(sem) ?? { ok: 0, total: 0 };
    fs.total++;
    if (formOk) fs.ok++;
    formOkPorSemana.set(sem, fs);

    const resolvio = evento(r.eventos, 'DOCENTE_RESOLVIO');
    if (resolvio) {
      docentesEvaluados++;
      const plazoDocente = new Date(r.evaluacion.fechaLimiteReclamo);
      plazoDocente.setDate(plazoDocente.getDate() + PLAZO_DOCENTE_DIAS);
      const enPlazo = resolvio <= plazoDocente;
      if (enPlazo) docentesPlazo++;

      const dp = docPlazoPorFac.get(fac) ?? { ok: 0, total: 0 };
      dp.total++;
      if (enPlazo) dp.ok++;
      docPlazoPorFac.set(fac, dp);
    }

    if (r.estado === 'CERRADO') cerrados++;

    if (r.estado === 'CERRADO' && r.decision === 'no_procedente') {
      const n = (noProcPorAlumno.get(r.estudianteId) ?? 0) + 1;
      noProcPorAlumno.set(r.estudianteId, n);
      if (n >= 2) alumnosReincidentes.add(r.estudianteId);
    }
  }

  const evolucionFormularios = etiquetasSemanas().map((label, i) => {
    const s = formOkPorSemana.get(i + 1) ?? { ok: 0, total: 0 };
    return { semana: label, pct: pct(s.ok, s.total) };
  });

  const docentesPorFacultad = FACULTADES_ORDEN.filter((f) => docPlazoPorFac.has(f)).map(
    (f) => {
      const d = docPlazoPorFac.get(f)!;
      return { facultad: f, pct: pct(d.ok, d.total) };
    }
  );

  const criticas = docentesPorFacultad.filter((d) => d.pct < 90);

  return {
    pctFormulariosOk: pct(formulariosOk, total),
    metaFormularios: 95,
    pctDocentesPlazo: pct(docentesPlazo, docentesEvaluados),
    metaDocentes: 90,
    pctPowerCampus: pct(cerrados, total),
    metaPowerCampus: 100,
    pctReincidencia: pct(alumnosReincidentes.size, alumnosConReclamo.size),
    docentesPorFacultad,
    evolucionFormularios,
    insight:
      criticas.length > 0
        ? `${criticas.map((c) => c.facultad).join(' e ')} por debajo de la meta (90%).`
        : 'Cumplimiento de plazos docente dentro de rangos aceptables.',
  };
}

export async function getAnalyticsEficiencia(semestre = '2026-I') {
  const rows = await reclamosConContexto(semestre);
  const backlog = rows.filter((r) =>
    ['ENVIADO', 'EN_REVISION', 'EN_VALIDACION'].includes(r.estado)
  ).length;

  const porSemanaCreados = new Map<number, number>();
  const porSemanaCerrados = new Map<number, number>();
  const slaPorSemana = new Map<number, { ok: number; total: number }>();

  for (const r of rows) {
    const semC = semanaDelCiclo(r.createdAt, semestre);
    porSemanaCreados.set(semC, (porSemanaCreados.get(semC) ?? 0) + 1);

    if (r.estado === 'CERRADO') {
      const cierre = evento(r.eventos, 'DAAR_CERRO') ?? r.updatedAt;
      const semCi = semanaDelCiclo(cierre, semestre);
      porSemanaCerrados.set(semCi, (porSemanaCerrados.get(semCi) ?? 0) + 1);

      const dias = diasEntre(r.createdAt, cierre);
      const sla = slaPorSemana.get(semCi) ?? { ok: 0, total: 0 };
      sla.total++;
      if (dias <= SLA_CIERRE_DIAS) sla.ok++;
      slaPorSemana.set(semCi, sla);
    }
  }

  let pico = 0;
  let semanaPico = 1;
  for (let s = 1; s <= CICLO_TOTAL_SEMANAS; s++) {
    const c = porSemanaCreados.get(s) ?? 0;
    if (c > pico) {
      pico = c;
      semanaPico = s;
    }
  }

  let acumCreados = 0;
  let acumCerrados = 0;
  const backlogVsResuelto = etiquetasSemanas().map((label, i) => {
    acumCreados += porSemanaCreados.get(i + 1) ?? 0;
    acumCerrados += porSemanaCerrados.get(i + 1) ?? 0;
    return { semana: label, creados: acumCreados, cerrados: acumCerrados };
  });

  const slaSemanal = etiquetasSemanas().map((label, i) => {
    const s = slaPorSemana.get(i + 1) ?? { ok: 0, total: 0 };
    return { semana: label, pct: pct(s.ok, s.total) };
  });

  const minSla = slaSemanal.reduce(
    (min, cur) => (cur.pct > 0 && cur.pct < min.pct ? cur : min),
    { semana: 'S1', pct: 100 }
  );

  const totalCerrados = rows.filter((r) => r.estado === 'CERRADO').length;
  let slaOk = 0;
  for (const r of rows) {
    if (r.estado !== 'CERRADO') continue;
    const cierre = evento(r.eventos, 'DAAR_CERRO') ?? r.updatedAt;
    if (diasEntre(r.createdAt, cierre) <= SLA_CIERRE_DIAS) slaOk++;
  }

  return {
    backlog,
    picoSemanal: pico,
    semanaPico,
    pctSlaGlobal: pct(slaOk, totalCerrados),
    metaSla: 85,
    picoPorSemana: etiquetasSemanas().map((label, i) => ({
      semana: label,
      count: porSemanaCreados.get(i + 1) ?? 0,
    })),
    backlogVsResuelto,
    slaSemanal,
    insight:
      minSla.pct < 85
        ? `La ${minSla.semana} coincide con presión de volumen y caída del SLA (${minSla.pct}%). Correlación directa.`
        : 'SLA de cierre estable durante el ciclo.',
  };
}

export async function getAnalyticsDaar(semestre = '2026-I') {
  const [tiempos, volumen, calidad, cumplimiento, eficiencia] = await Promise.all([
    getAnalyticsTiempos(semestre),
    getAnalyticsVolumen(semestre),
    getAnalyticsCalidad(semestre),
    getAnalyticsCumplimiento(semestre),
    getAnalyticsEficiencia(semestre),
  ]);
  return { tiempos, volumen, calidad, cumplimiento, eficiencia };
}
