/** Cita tal como se muestra en la agenda: sin correo. */
export type CitaAgenda = {
  id: string;
  fecha: string;
  hora: string;
  propietario: string;
  mascota: string;
  especie: string;
  servicio: string;
  /** Estado tal como está en la hoja (p. ej. "Aprobada" o "Rechazada"). */
  estado: string;
  /** Columna "asistencia" de la hoja: true si la recepcionista la marcó como asistió. */
  asistio: boolean;
};

/** "Sí", "si", "asistió", "true", "x"... -> true. Vacío o "No" -> false. */
function leerAsistencia(valor: string): boolean {
  const v = valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return ["si", "s", "x", "1", "true", "yes", "asistio"].includes(v);
}

/** Una cita cuenta (calendario y cupos) solo si está aprobada. */
export function esAprobada(cita: Pick<CitaAgenda, "estado">): boolean {
  const e = cita.estado
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return e.startsWith("aprobad") || e === "confirmada" || e === "con_alerta";
}

/** Parser CSV mínimo: comillas dobles, comillas escapadas ("") y saltos de línea dentro de campos. */
function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        enComillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      enComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}

/** Acepta AAAA-MM-DD o D/M/AAAA (formato regional de Sheets) y devuelve AAAA-MM-DD. */
function normalizarFecha(valor: string): string {
  const v = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return v;
}

/** Acepta H:MM, HH:MM o HH:MM:SS y devuelve HH:MM. */
function normalizarHora(valor: string): string {
  const m = valor.trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : valor.trim();
}

/** Descarga una pestaña de la hoja pública como CSV. `destino` es `sheet=<nombre>` o `gid=<id>`. */
async function descargarCsv(destino: string): Promise<string[][]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Falta GOOGLE_SHEET_ID");

  const url =
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq` +
    `?tqx=out:csv&${destino}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google respondió ${res.status}`);
  if (!(res.headers.get("content-type") ?? "").includes("csv")) {
    throw new Error("La hoja no es pública o no se pudo leer como CSV");
  }
  return parsearCsv(await res.text());
}

/** Cupo de una franja, tal como lo lleva Make en la pestaña de cupos. */
export type CupoFranja = {
  fecha: string;
  franja: string;
  cupo: number;
  ocupados: number;
  libres: number;
};

/**
 * Lee la pestaña de cupos (columnas: franja, fecha, hora, cupo, ocupados).
 * Es la que Make mantiene al aprobar o rechazar, así que es la fuente de verdad
 * para las notificaciones. Se identifica por `GOOGLE_SHEET_CUPOS_GID` (por
 * defecto 0, la primera pestaña).
 */
export async function cuposPorFranja(): Promise<CupoFranja[]> {
  const gid = process.env.GOOGLE_SHEET_CUPOS_GID || "0";
  const [encabezado = [], ...filas] = await descargarCsv(`gid=${encodeURIComponent(gid)}`);

  const col = (nombre: string) => encabezado.findIndex((h) => h.trim() === nombre);
  const iFecha = col("fecha");
  const iHora = col("hora");
  const iCupo = col("cupo");
  const iOcupados = col("ocupados");
  if ([iFecha, iHora, iCupo, iOcupados].includes(-1)) {
    throw new Error("La pestaña de cupos no tiene los encabezados esperados (fecha, hora, cupo, ocupados)");
  }

  const cupos: CupoFranja[] = [];
  for (const fila of filas) {
    const fecha = normalizarFecha((fila[iFecha] ?? "").trim());
    const cupo = Number.parseInt((fila[iCupo] ?? "").trim(), 10);
    const ocupados = Number.parseInt((fila[iOcupados] ?? "").trim(), 10) || 0;
    if (!fecha || !Number.isFinite(cupo)) continue;
    cupos.push({
      fecha,
      franja: normalizarHora((fila[iHora] ?? "").trim()),
      cupo,
      ocupados,
      libres: Math.max(cupo - ocupados, 0),
    });
  }
  return cupos;
}

/**
 * Lee la hoja pública (cualquiera con el enlace puede ver) como CSV y devuelve
 * todas las citas, con la fecha (AAAA-MM-DD) y la hora (HH:MM) normalizadas.
 */
export async function todasLasCitas(): Promise<CitaAgenda[]> {
  const tab = process.env.GOOGLE_SHEET_TAB || "citas";
  const [encabezado = [], ...filas] = await descargarCsv(`sheet=${encodeURIComponent(tab)}`);

  // Las columnas se ubican por el nombre del encabezado.
  const col = (nombre: string) => encabezado.findIndex((h) => h.trim() === nombre);
  const iFecha = col("fecha");
  const iHora = col("hora");
  const iPropietario = col("propietario");
  if ([iFecha, iHora, iPropietario].includes(-1)) {
    throw new Error("La hoja no tiene los encabezados esperados (fecha, hora, propietario)");
  }
  const celda = (fila: string[], nombre: string) => (fila[col(nombre)] ?? "").trim();

  const citas: CitaAgenda[] = [];
  for (const fila of filas) {
    const fecha = normalizarFecha(celda(fila, "fecha"));
    if (!fecha) continue;
    citas.push({
      id: celda(fila, "id_cita"),
      fecha,
      hora: normalizarHora(celda(fila, "hora")),
      propietario: celda(fila, "propietario"),
      mascota: celda(fila, "mascota"),
      especie: celda(fila, "especie"),
      servicio: celda(fila, "servicio"),
      estado: celda(fila, "estado"),
      asistio: leerAsistencia(celda(fila, "asistencia")),
    });
  }

  return citas;
}

/** Citas aprobadas de una fecha (AAAA-MM-DD), ordenadas por hora. */
export async function citasPorFecha(fecha: string): Promise<CitaAgenda[]> {
  const citas = await todasLasCitas();
  return citas
    .filter((c) => c.fecha === fecha && esAprobada(c))
    .sort((a, b) => a.hora.localeCompare(b.hora));
}
