import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';

type DashboardData = Awaited<ReturnType<typeof getDashboardDaarData>>;

export function exportDashboardPdf(data: DashboardData, semestre: string, tab?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const fecha = new Date().toLocaleString('es-PE');
  let y = 14;

  doc.setFontSize(16);
  doc.text('Dashboard DAAR — ReclamoUP', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Semestre: ${semestre}  |  Generado: ${fecha}`, 14, y);
  if (tab) doc.text(`  |  Pestaña: ${tab}`, 80, y);
  doc.setTextColor(0);
  y += 10;

  const { kpis, analytics } = data;

  doc.setFontSize(12);
  doc.text('Indicadores operativos', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: [
      ['Total recibidos', String(kpis.total)],
      ['Pendientes docente', String(kpis.pendientesDocente)],
      ['En revisión', String(kpis.enRevision)],
      ['En validación DAAR', String(kpis.enValidacion)],
      ['Cerrados', String(kpis.cerrados)],
      ['Anulados', String(kpis.anulados)],
      ['Rechazados', String(kpis.rechazados)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  y += 10;

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
      if (y > 250) {
        doc.addPage();
        y = 14;
      }
      doc.setFontSize(12);
      doc.text(section.title, 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Métrica', 'Valor']],
        body: section.rows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        margin: { left: 14, right: 14 },
      });
      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
      y += 8;
    }

    if (y > 240) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(11);
    doc.text('Insights', 14, y);
    y += 5;
    doc.setFontSize(9);
    const insights = [
      analytics.tiempos.insight,
      analytics.volumen.insight,
      analytics.calidad.insight,
      analytics.cumplimiento.insight,
      analytics.eficiencia.insight,
    ];
    for (const line of insights) {
      const wrapped = doc.splitTextToSize(`• ${line}`, 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 4 + 2;
    }
  }

  doc.save(`dashboard-daar-${semestre}-${Date.now()}.pdf`);
}
