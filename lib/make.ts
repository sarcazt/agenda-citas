import { respuestaMakeSchema, type Cita, type RespuestaMake } from "./schemas";

const TIMEOUT_MS = 20_000;

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
      body: JSON.stringify(cita),
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
