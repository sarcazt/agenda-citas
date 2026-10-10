import { esFechaValida } from "@/lib/fechas";
import { citasPorFecha } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const fecha = new URL(req.url).searchParams.get("fecha") ?? "";
  if (!esFechaValida(fecha)) {
    return Response.json({ ok: false, error: "Fecha no válida" }, { status: 400 });
  }

  try {
    const citas = await citasPorFecha(fecha);
    return Response.json({ ok: true, fecha, total: citas.length, citas });
  } catch (e) {
    console.error("[agenda]", e instanceof Error ? e.message : "error inesperado");
    return Response.json(
      { ok: false, error: "No se pudo cargar la agenda. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
