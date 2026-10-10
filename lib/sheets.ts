import { google } from "googleapis";
import { isMock } from "./config";
import { citasMockPorFecha } from "./mock-store";
import { ESTADOS, type Estado } from "./schemas";

/** Cita tal como se muestra en la agenda: sin correo. */
export type CitaAgenda = {
  id: string;
  fecha: string;
  franja: string;
  nombre: string;
  estado: Estado;
};

function cliente() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !key || !sheetId) {
    throw new Error("Faltan variables de Google Sheets");
  }

  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return { sheets: google.sheets({ version: "v4", auth }), sheetId };
}

/** Lee la hoja y devuelve las citas de una fecha (YYYY-MM-DD), ordenadas por franja. */
export async function citasPorFecha(fecha: string): Promise<CitaAgenda[]> {
  if (isMock()) return citasMockPorFecha(fecha);

  const { sheets, sheetId } = cliente();
  const tab = process.env.GOOGLE_SHEET_TAB || "Citas";

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${tab}'!A:G`,
  });
  const [encabezado = [], ...filas] = res.data.values ?? [];

  // Se ubican las columnas por nombre de encabezado.
  const col = (nombre: string) => encabezado.findIndex((h) => String(h).trim() === nombre);
  const iId = col("id");
  const iFecha = col("fecha");
  const iFranja = col("franja");
  const iNombre = col("nombre");
  const iEstado = col("estado");
  if ([iFecha, iFranja, iNombre, iEstado].includes(-1)) {
    throw new Error("La hoja no tiene los encabezados esperados");
  }

  const celda = (fila: unknown[], i: number) => (i >= 0 ? String(fila[i] ?? "").trim() : "");

  const citas: CitaAgenda[] = [];
  for (const fila of filas) {
    if (celda(fila, iFecha) !== fecha) continue;
    const estado = celda(fila, iEstado);
    if (!(ESTADOS as readonly string[]).includes(estado)) {
      console.warn("[sheets] fila con estado desconocido omitida:", estado);
      continue;
    }
    citas.push({
      id: celda(fila, iId),
      fecha,
      franja: celda(fila, iFranja),
      nombre: celda(fila, iNombre),
      estado: estado as Estado,
    });
  }

  return citas.sort((a, b) => a.franja.localeCompare(b.franja));
}
