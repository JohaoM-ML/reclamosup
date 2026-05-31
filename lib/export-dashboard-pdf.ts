import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';

type DashboardData = Awaited<ReturnType<typeof getDashboardDaarData>>;

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

const MARGIN = 16;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const UP_NAVY: [number, number, number] = [0, 32, 91];
const UP_BLUE: [number, number, number] = [0, 114, 206];
const TEXT_MUTED: [number, number, number] = [90, 90, 90];

const TABLE_OPTS = {
  theme: 'plain' as const,
  styles: {
    fontSize: 10,
    cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
    lineColor: [220, 225, 230] as [number, number, number],
    lineWidth: 0.2,
  },
  headStyles: {
    fillColor: UP_NAVY,
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: 'bold' as const,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252] as [number, number, number],
  },
  margin: { left: MARGIN, right: MARGIN },
};

function tableEndY(doc: DocWithTable, fallback: number) {
  return doc.lastAutoTable?.finalY ?? fallback;
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed > 275) {
    doc.addPage();
    return MARGIN + 8;
  }
  return y;
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `ReclamoUP · Universidad del Pacífico · Página ${pageNum} de ${totalPages}`,
    MARGIN,
    290
  );
}

function addMetadataBlock(doc: jsPDF, semestre: string, fecha: string, tab?: string) {
  let y = 38;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);

  const lines = [
    `Semestre académico: ${semestre}`,
    `Fecha de generación: ${fecha}`,
    ...(tab ? [`Sección del dashboard: ${tab}`] : []),
  ];

  for (const line of lines) {
    doc.text(line, MARGIN, y);
    y += 5.5;
  }

  doc.setDrawColor(...UP_BLUE);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);

  return y + 10;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...UP_NAVY);
  doc.text(title, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  return y + 6;
}

function addTable(
  doc: DocWithTable,
  y: number,
  head: string[][],
  body: string[][]
) {
  autoTable(doc, {
    startY: y,
    head,
    body,
    ...TABLE_OPTS,
  });
  return tableEndY(doc, y + 20) + 10;
}

function addInsightBlock(doc: jsPDF, y: number, insights: string[]) {
  y = ensureSpace(doc, y, 20);
  y = addSectionTitle(doc, 'Insights', y);

  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);

  for (const insight of insights) {
    const wrapped = doc.splitTextToSize(`• ${insight}`, CONTENT_W);
    const blockH = wrapped.length * 4.5 + 3;
    y = ensureSpace(doc, y, blockH);
    doc.text(wrapped, MARGIN, y);
    y += blockH;
  }

  return y;
}

export function exportDashboardPdf(data: DashboardData, semestre: string, tab?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocWithTable;
  const fecha = new Date().toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  // Encabezado institucional
  doc.setFillColor(...UP_NAVY);
  doc.rect(0, 0, PAGE_W, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Dashboard DAAR — ReclamoUP', MARGIN, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Universidad del Pacífico · Reclamos de evaluaciones Pregrado', MARGIN, 18);

  let y = addMetadataBlock(doc, semestre, fecha, tab);

  const { kpis, analytics } = data;

  y = addSectionTitle(doc, 'Indicadores operativos', y);
  y = addTable(doc, y, [['Indicador', 'Valor']], [
    ['Total recibidos', String(kpis.total)],
    ['Pendientes docente', String(kpis.pendientesDocente)],
    ['En revisión', String(kpis.enRevision)],
    ['En validación DAAR', String(kpis.enValidacion)],
    ['Cerrados', String(kpis.cerrados)],
    ['Anulados', String(kpis.anulados)],
    ['Rechazados', String(kpis.rechazados)],
  ]);

  if (analytics) {
    const sections: Array<{ title: string; rows: string[][] }> = [
      {
        title: 'Tiempos',
        rows: [
          ['Promedio resolución (días)', String(analytics.tiempos.promedioResolucion)],
          ['Respuesta docente (días)', String(analytics.tiempos.promedioRespuestaDocente)],
          ['Meta resolución', `≤ ${analytics.tiempos.metaResolucion} días`],
        ],
      },
      {
        title: 'Volumen',
        rows: [
          ['Total reclamos', String(analytics.volumen.total)],
          ['Parcial', String(analytics.volumen.parcial)],
          ['Final', String(analytics.volumen.final)],
        ],
      },
      {
        title: 'Calidad',
        rows: [
          ['Nota sube', `${analytics.calidad.pctSube}%`],
          ['Sin cambio', `${analytics.calidad.pctSinCambio}%`],
          ['Nota baja', `${analytics.calidad.pctBaja}%`],
        ],
      },
      {
        title: 'Cumplimiento',
        rows: [
          ['Formularios correctos', `${analytics.cumplimiento.pctFormulariosOk}%`],
          ['Docentes en plazo', `${analytics.cumplimiento.pctDocentesPlazo}%`],
          ['Registrado en sistema', `${analytics.cumplimiento.pctPowerCampus}%`],
          ['Reincidencia', `${analytics.cumplimiento.pctReincidencia}%`],
        ],
      },
      {
        title: 'Eficiencia',
        rows: [
          ['Backlog actual', String(analytics.eficiencia.backlog)],
          ['Pico semanal', String(analytics.eficiencia.picoSemanal)],
          ['SLA cierre global', `${analytics.eficiencia.pctSlaGlobal}%`],
        ],
      },
    ];

    for (const section of sections) {
      y = ensureSpace(doc, y, 28);
      y = addSectionTitle(doc, section.title, y);
      y = addTable(doc, y, [['Métrica', 'Valor']], section.rows);
    }

    y = addInsightBlock(doc, y, [
      analytics.tiempos.insight,
      analytics.volumen.insight,
      analytics.calidad.insight,
      analytics.cumplimiento.insight,
      analytics.eficiencia.insight,
    ]);
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  const safeSemestre = semestre.replace(/[^\w-]/g, '');
  doc.save(`dashboard-daar-${safeSemestre}-${Date.now()}.pdf`);
}
