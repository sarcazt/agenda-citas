import { ahoraBogota } from "./fechas";
import { respuestaMakeSchema, type Cita, type RespuestaMake } from "./schemas";

const TIMEOUT_MS = 20_000;

/**
 * Un mismo webhook de Make recibe dos tipos de envío; esta clave los distingue.
 * Si en Make la llamas distinto, cámbiala aquí.
 */
export const CLAVE_ACCION = "accion";
export const ACCION_AGENDAR = "agendar";
export const ACCION_ASISTENCIA = "asistencia";

export class MakeError extends Error {}

/** Llama al webhook de Make y devuelve la respuesta ya validada. */
export async function agendarEnMake(cita: Cita): Promise<RespuestaMake> {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) throw new MakeError("MAKE_WEBHOOK_URL no está configurada");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let cuerpo: unknown;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // La fecha_solicitud la genera el servidor, no el navegador.
      body: JSON.stringify({ [CLAVE_ACCION]: ACCION_AGENDAR, ...cita, fecha_solicitud: ahoraBogota() }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status !== 200) throw new MakeError(`Make respondió ${res.status}`);
    const texto = await res.text();
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      // Solo va al log del servidor, nunca al cliente.
      throw new MakeError(`Make respondió 200 pero el cuerpo no es JSON: "${texto.slice(0, 200)}"`);
    }
  } catch (e) {
    if (e instanceof MakeError) throw e;
    throw new MakeError(e instanceof Error ? e.name : "Error desconocido");
  } finally {
    clearTimeout(timer);
  }

  const parsed = respuestaMakeSchema.safeParse(cuerpo);
  if (!parsed.success) {
    throw new MakeError(`Respuesta de Make fuera del contrato: ${JSON.stringify(cuerpo).slice(0, 200)}`);
  }
  return parsed.data;
}

/**
 * Registra la asistencia de una cita: mismo webhook que agendar, con
 * accion = "asistencia". Make debe actualizar la columna "asistencia" de la
 * fila con ese id_cita y responder 200. Si responde un JSON con ok:false, es error.
 */
export async function registrarAsistenciaEnMake(idCita: string, asistio: boolean): Promise<void> {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) throw new MakeError("MAKE_WEBHOOK_URL no está configurada");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [CLAVE_ACCION]: ACCION_ASISTENCIA,
        id_cita: idCita,
        asistencia: asistio ? "Sí" : "No",
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status !== 200) throw new MakeError(`Make respondió ${res.status} al registrar la asistencia`);

    const texto = await res.text();
    try {
      const cuerpo = JSON.parse(texto) as { ok?: unknown };
      if (cuerpo && cuerpo.ok === false) throw new MakeError(`Make rechazó la asistencia: ${texto.slice(0, 200)}`);
    } catch (e) {
      if (e instanceof MakeError) throw e;
      // El cuerpo no es JSON: basta con el código 200.
    }
  } catch (e) {
    if (e instanceof MakeError) throw e;
    throw new MakeError(e instanceof Error ? e.name : "Error desconocido");
  } finally {
    clearTimeout(timer);
  }
}
