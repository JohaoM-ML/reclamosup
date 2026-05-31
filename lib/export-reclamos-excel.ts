import { ESTADO_LABELS, RESULTADO_FINAL_LABELS, type EstadoReclamo, type ResultadoFinal } from '@/lib/types';
import type { getTodosReclamos } from '@/lib/services/reclamo.service';

export type ReclamoExportRow = Awaited<ReturnType<typeof getTodosReclamos>>[number];

function escapeCsv(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function estadoLabel(estado: string): string {
  return ESTADO_LABELS[estado as EstadoReclamo] ?? estado;
}

function resultadoLabel(resultado: string | null | undefined): string {
  if (!resultado) return '';
  return RESULTADO_FINAL_LABELS[resultado as ResultadoFinal] ?? resultado;
}

const HEADERS = [
  'ID',
  'Cód. alumno',
  'Estudiante',
  'Cód. curso',
  'Curso',
  'Sección',
  'Cód. docente',
  'Docente',
  'Estado',
  'Resultado',
  'Nota anterior',
  'Nota nueva',
  'Semestre',
  'Fecha registro',
];

function rowToCsv(r: ReclamoExportRow): string[] {
  return [
    r.id.slice(-6),
    r.estudiante.codigo ?? '',
    r.estudiante.nombre,
    r.evaluacion.curso.codigo,
    r.evaluacion.curso.nombre,
    r.evaluacion.curso.seccion,
    r.docente.codigo ?? '',
    r.docente.nombre,
    estadoLabel(r.estado),
    resultadoLabel(r.resultadoFinal),
    r.notaAnterior != null ? String(r.notaAnterior) : '',
    r.notaNueva != null ? String(r.notaNueva) : '',
    r.semestreAcademico,
    new Date(r.createdAt).toLocaleString('es-PE'),
  ];
}

export function exportReclamosToExcel(rows: ReclamoExportRow[], filenamePrefix = 'reclamos-daar') {
  const lines = [
    HEADERS.map(escapeCsv).join(','),
    ...rows.map((r) => rowToCsv(r).map(escapeCsv).join(',')),
  ];
  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const fecha = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${fecha}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export { HEADERS as RECLAMOS_EXPORT_HEADERS, rowToCsv as reclamoToExportRow };
