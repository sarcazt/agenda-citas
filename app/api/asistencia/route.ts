import { MakeError, registrarAsistenciaEnMake } from "@/lib/make";

export const dynamic = "force-dynamic";

/** POST /api/asistencia  { id_cita: string, asistio: boolean } */
export async function POST(req: Request) {
  let body: { id_cita?: unknown; asistio?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Solicitud no válida" }, { status: 400 });
  }

  const id = typeof body.id_cita === "string" ? body.id_cita.trim() : "";
  if (!id || id.length > 100 || typeof body.asistio !== "boolean") {
    return Response.json({ ok: false, error: "Datos no válidos" }, { status: 400 });
  }

  try {
    await registrarAsistenciaEnMake(id, body.asistio);
    console.log(`[asistencia] ${id} -> ${body.asistio ? "Sí" : "No"}`);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[asistencia]", e instanceof MakeError ? e.message : "error inesperado");
    return Response.json(
      { ok: false, error: "No se pudo registrar la asistencia. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
