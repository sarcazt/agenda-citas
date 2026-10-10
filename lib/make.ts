import { isMock } from "./config";
import { guardarMock } from "./mock-store";
import { respuestaMakeSchema, type Cita, type RespuestaMake } from "./schemas";

const TIMEOUT_MS = 20_000;

export class MakeError extends Error {}

/** Respuestas simuladas por franja (MAKE_MOCK=true). */
function simular(cita: Cita): unknown {
  switch (cita.franja) {
    case "09:00":
      return { estado: "confirmada", mensaje: "Tu cita quedó confirmada.", cupos_libres: 2 };
    case "10:00":
      return {
        estado: "con_alerta",
        mensaje: "Tu cita quedó agendada, pero quedan pocos cupos en esta franja.",
        cupos_libres: 1,
      };
    case "11:00":
      return {
        estado: "rechazada",
        mensaje: "Para esa franja no se puede agendar una cita, elige otra franja.",
        cupos_libres: 0,
      };
    case "14:00":
      return { respuesta: "inesperada" }; // respuesta inválida
    case "15:00":
      throw new MakeError("Tiempo agotado (simulado)");
    default:
      return { estado: "confirmada", mensaje: "Tu cita quedó confirmada.", cupos_libres: 3 };
  }
}

/** Llama al webhook de Make y devuelve la respuesta ya validada. */
export async function agendarEnMake(cita: Cita): Promise<RespuestaMake> {
  let cuerpo: unknown;

  if (isMock()) {
    cuerpo = simular(cita);
  } else {
    const url = process.env.MAKE_WEBHOOK_URL;
    if (!url) throw new MakeError("MAKE_WEBHOOK_URL no está configurada");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cita),
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.status !== 200) throw new MakeError(`Make respondió ${res.status}`);
      cuerpo = JSON.parse(await res.text());
    } catch (e) {
      if (e instanceof MakeError) throw e;
      throw new MakeError(e instanceof Error ? e.name : "Error desconocido");
    } finally {
      clearTimeout(timer);
    }
  }

  const parsed = respuestaMakeSchema.safeParse(cuerpo);
  if (!parsed.success) throw new MakeError("Respuesta de Make inválida");

  // Make escribe la fila en la hoja; en modo simulado se guarda en memoria.
  if (isMock()) {
    guardarMock({
      fecha: cita.fecha,
      franja: cita.franja,
      nombre: cita.nombre,
      estado: parsed.data.estado,
    });
  }
  return parsed.data;
}
