import { getFranjas } from "@/lib/config";
import { hoyBogota } from "@/lib/fechas";
import { MakeError, agendarEnMake } from "@/lib/make";
import { z } from "zod";
import { citaSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Solicitud no válida" }, { status: 400 });
  }

  const parsed = citaSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Datos no válidos", campos: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const cita = parsed.data;

  const campos: Record<string, string[]> = {};
  if (cita.fecha < hoyBogota()) campos.fecha = ["La fecha no puede ser pasada"];
  if (!getFranjas().includes(cita.hora)) campos.hora = ["Franja no disponible"];
  if (Object.keys(campos).length > 0) {
    console.warn("[agendar] datos no válidos:", JSON.stringify(campos));
    return Response.json({ ok: false, error: "Datos no válidos", campos }, { status: 400 });
  }

  // El log no incluye el correo para no dejar datos personales en los registros.
  const inicio = Date.now();
  console.log(
    `[agendar] enviando a Make: ${cita.fecha} ${cita.hora} · ${cita.propietario} / ${cita.mascota} (${cita.especie}) · ${cita.servicio}`,
  );

  try {
    const r = await agendarEnMake(cita);
    console.log(
      `[agendar] Make respondió en ${Date.now() - inicio} ms: estado=${r.estado} cupos_libres=${r.cupos_libres ?? "(no enviado)"} mensaje="${r.mensaje}"`,
    );
    return Response.json({ ok: true, ...r });
  } catch (e) {
    // Solo se registra en el servidor; al cliente va un mensaje genérico.
    console.error(
      `[agendar] ERROR tras ${Date.now() - inicio} ms:`,
      e instanceof MakeError ? e.message : "error inesperado",
    );
    return Response.json(
      { ok: false, error: "No se pudo procesar la cita. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
