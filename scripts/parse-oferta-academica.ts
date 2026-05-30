/**
 * Extrae secciones de la Oferta Académica UP 2026-I desde el PDF.
 * Uso: npx tsx scripts/parse-oferta-academica.ts
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

export type OfertaSeccion = {
  codigo: string;
  nombre: string;
  seccion: string;
  creditos: number;
  profesor: string;
};

const SKIP =
  /^(Secc|CURSOS ACADÉMICOS|Horarios ofertados|Dirección de Asuntos|-- \d+ of \d+ --|Se sugiere revisar)/i;

const COURSE_LINE = /^(\d{6})\s*-\s*(.+)$/;
const CREDITS_LINE = /^(\d+,\d{2})$/;
const SECTION_PROF =
  /^(?:([A-Z])Virtual\s*(.+,.+)|Virtual\s*(.+,.+)|([A-Z])([A-ZÁÉÍÓÚÑ].+,.+))$/;

function parseSeccionProfesor(linea: string): { seccion: string; profesor: string } | null {
  if (/^(FINAL|PARCIAL|CLASE)/i.test(linea)) return null;

  const m = linea.match(SECTION_PROF);
  if (!m) return null;

  if (m[1] && m[2]) return { seccion: 'Virtual', profesor: m[2].trim() };
  if (m[3]) return { seccion: 'Virtual', profesor: m[3].trim() };
  if (m[4] && m[5]) return { seccion: m[4], profesor: m[5].trim() };
  return null;
}

function limpiarNombreProfesor(raw: string): string {
  return raw
    .replace(/\s+(CLASE|FINAL|PARCIAL)\s.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLineas(texto: string): OfertaSeccion[] {
  const lineas = texto.split(/\r?\n/);
  const resultado: OfertaSeccion[] = [];
  let pendiente: { codigo: string; nombre: string } | null = null;
  let cursoActual: { codigo: string; nombre: string; creditos: number } | null = null;

  for (const lineaRaw of lineas) {
    const linea = lineaRaw.trim();
    if (!linea || SKIP.test(linea)) continue;
    if (/^(CLASE|FINAL|PARCIAL)\s/i.test(linea)) continue;
    if (/^PREREQUISITO:/i.test(linea)) continue;

    const matchCurso = linea.match(COURSE_LINE);
    if (matchCurso) {
      let nombre = matchCurso[2].trim();
      const inlineCred = nombre.match(/^(.+?)\s+(\d+,\d{2})(?:\s+PREREQUISITO|\s*$)/);
      if (inlineCred) {
        cursoActual = {
          codigo: matchCurso[1],
          nombre: inlineCred[1].trim(),
          creditos: parseFloat(inlineCred[2].replace(',', '.')),
        };
        pendiente = null;
      } else {
        pendiente = { codigo: matchCurso[1], nombre };
        cursoActual = null;
      }
      continue;
    }

    const matchCred = linea.match(CREDITS_LINE);
    if (matchCred && pendiente) {
      cursoActual = {
        codigo: pendiente.codigo,
        nombre: pendiente.nombre,
        creditos: parseFloat(matchCred[1].replace(',', '.')),
      };
      pendiente = null;
      continue;
    }

    if (!cursoActual) continue;

    const parsed = parseSeccionProfesor(linea);
    if (parsed) {
      const principal = parsed.profesor.split(/\s*\/\s*/)[0].trim();
      const key = `${cursoActual.codigo}-${parsed.seccion}-${principal}`;
      if (resultado.some((r) => `${r.codigo}-${r.seccion}-${r.profesor}` === key)) continue;
      resultado.push({
        codigo: cursoActual.codigo,
        nombre: cursoActual.nombre,
        seccion: parsed.seccion,
        creditos: cursoActual.creditos,
        profesor: principal,
      });
    }
  }

  return resultado;
}

export async function cargarOfertaAcademica(
  pdfPath?: string
): Promise<OfertaSeccion[]> {
  const resolved =
    pdfPath ??
    path.resolve(__dirname, '../../Oferta-Academica-2026-I-V5.pdf');

  if (!fs.existsSync(resolved)) {
    throw new Error(`PDF no encontrado: ${resolved}`);
  }

  const buffer = fs.readFileSync(resolved);
  const { text } = await pdfParse(buffer);
  return parseLineas(text);
}

async function main() {
  const secciones = await cargarOfertaAcademica();
  const outDir = path.resolve(__dirname, '../prisma/data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'oferta-2026-1.json');
  fs.writeFileSync(outPath, JSON.stringify(secciones, null, 2), 'utf-8');

  const cursosUnicos = new Set(secciones.map((s) => s.codigo)).size;
  const docentesUnicos = new Set(secciones.map((s) => s.profesor)).size;
  console.log(`✅ ${secciones.length} secciones parseadas`);
  console.log(`   Cursos distintos: ${cursosUnicos}`);
  console.log(`   Docentes distintos: ${docentesUnicos}`);
  console.log(`   Guardado: ${outPath}`);
}

if (process.argv[1]?.includes('parse-oferta-academica')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
