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
    cuerpo = JSON.parse(await res.text());
  } catch (e) {
    if (e instanceof MakeError) throw e;
    throw new MakeError(e instanceof Error ? e.name : "Error desconocido");
  } finally {
    clearTimeout(timer);
  }

  const parsed = respuestaMakeSchema.safeParse(cuerpo);
  if (!parsed.success) throw new MakeError("Respuesta de Make inválida");
  return parsed.data;
}
