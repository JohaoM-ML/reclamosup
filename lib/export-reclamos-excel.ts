import * as XLSX from 'xlsx';
import { ESTADO_LABELS, RESULTADO_FINAL_LABELS, type EstadoReclamo, type ResultadoFinal } from '@/lib/types';
import type { getTodosReclamos } from '@/lib/services/reclamo.service';

export type ReclamoExportRow = Awaited<ReturnType<typeof getTodosReclamos>>[number];

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

function rowToCells(r: ReclamoExportRow): (string | number)[] {
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
    r.notaAnterior ?? '',
    r.notaNueva ?? '',
    r.semestreAcademico,
    new Date(r.createdAt).toLocaleString('es-PE'),
  ];
}

export function exportReclamosToExcel(rows: ReclamoExportRow[], filenamePrefix = 'reclamos-daar') {
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows.map(rowToCells)]);
  sheet['!cols'] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 28 },
    { wch: 10 },
    { wch: 32 },
    { wch: 8 },
    { wch: 12 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Reclamos');

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}-${fecha}.xlsx`);
}

export { HEADERS as RECLAMOS_EXPORT_HEADERS, rowToCells as reclamoToExportRow };
