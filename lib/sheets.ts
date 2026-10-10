/** Cita tal como se muestra en la agenda: sin correo. */
export type CitaAgenda = {
  id: string;
  fecha: string;
  hora: string;
  propietario: string;
  mascota: string;
  especie: string;
  servicio: string;
};

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

/**
 * Lee la hoja pública (cualquiera con el enlace puede ver) como CSV y devuelve
 * las citas de una fecha (AAAA-MM-DD), ordenadas por hora.
 */
export async function citasPorFecha(fecha: string): Promise<CitaAgenda[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Falta GOOGLE_SHEET_ID");
  const tab = process.env.GOOGLE_SHEET_TAB || "citas";

  const url =
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google respondió ${res.status}`);
  if (!(res.headers.get("content-type") ?? "").includes("csv")) {
    throw new Error("La hoja no es pública o no se pudo leer como CSV");
  }

  const [encabezado = [], ...filas] = parsearCsv(await res.text());

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
    if (normalizarFecha(celda(fila, "fecha")) !== fecha) continue;
    citas.push({
      id: celda(fila, "id_cita"),
      fecha,
      hora: normalizarHora(celda(fila, "hora")),
      propietario: celda(fila, "propietario"),
      mascota: celda(fila, "mascota"),
      especie: celda(fila, "especie"),
      servicio: celda(fila, "servicio"),
    });
  }

  return citas.sort((a, b) => a.hora.localeCompare(b.hora));
}
