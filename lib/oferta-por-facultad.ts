import type { OfertaSeccion } from '../scripts/parse-oferta-academica';
import { PREFIJOS_OFERTA } from './departamento';
import { esCursoExcluidoReclamoDigital } from './cursos-reclamo-estandar';

export { PREFIJOS_OFERTA as PREFIJOS_FACULTAD };

/**
 * Selecciona secciones de la oferta repartidas entre áreas (prefijo de código UP),
 * p. ej. 4 cursos por prefijo 12, 13, … 18 → cursos con código real de la oferta.
 */
export function seleccionarOfertaPorFacultad(
  oferta: OfertaSeccion[],
  opts: {
    cursosPorPrefijo?: number;
    minSeccionesPorCurso?: number;
    maxSeccionesPorCurso?: number;
    prefijos?: readonly string[];
    /** Si se indica, solo incluye estos códigos UP (6 dígitos). */
    soloCodigos?: Set<string>;
  } = {}
): OfertaSeccion[] {
  const {
    cursosPorPrefijo = 4,
    minSeccionesPorCurso = 2,
    maxSeccionesPorCurso = 4,
    prefijos = PREFIJOS_OFERTA,
    soloCodigos,
  } = opts;

  const elegible = oferta.filter((s) => !esCursoExcluidoReclamoDigital(s.nombre));

  const porCodigo = new Map<string, OfertaSeccion[]>();
  for (const s of elegible) {
    if (soloCodigos && !soloCodigos.has(s.codigo)) continue;
    const list = porCodigo.get(s.codigo) ?? [];
    list.push(s);
    porCodigo.set(s.codigo, list);
  }

  const porPrefijo = new Map<string, string[]>();
  for (const codigo of [...porCodigo.keys()].sort()) {
    const pref = codigo.slice(0, 2);
    if (!prefijos.includes(pref)) continue;
    const list = porPrefijo.get(pref) ?? [];
    if (list.length < cursosPorPrefijo) {
      list.push(codigo);
      porPrefijo.set(pref, list);
    }
  }

  const codigosElegidos = [...porPrefijo.values()].flat().sort();
  const out: OfertaSeccion[] = [];

  for (const codigo of codigosElegidos) {
    const vistosSeccion = new Set<string>();
    const secciones = [...(porCodigo.get(codigo) ?? [])]
      .sort((a, b) => a.seccion.localeCompare(b.seccion))
      .filter((s) => {
        if (vistosSeccion.has(s.seccion)) return false;
        vistosSeccion.add(s.seccion);
        return true;
      });
    const cantidad = Math.min(
      maxSeccionesPorCurso,
      Math.max(minSeccionesPorCurso, secciones.length)
    );
    out.push(...secciones.slice(0, cantidad));
  }

  return out;
}

export function agruparOfertaPorPrefijo(oferta: OfertaSeccion[]) {
  const porPrefijo = new Map<string, Map<string, OfertaSeccion[]>>();
  for (const s of oferta) {
    if (esCursoExcluidoReclamoDigital(s.nombre)) continue;
    const pref = s.codigo.slice(0, 2);
    const codigos = porPrefijo.get(pref) ?? new Map();
    const list = codigos.get(s.codigo) ?? [];
    list.push(s);
    codigos.set(s.codigo, list);
    porPrefijo.set(pref, codigos);
  }
  return porPrefijo;
}
