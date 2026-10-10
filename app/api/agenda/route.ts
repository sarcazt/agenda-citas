import { esFechaValida } from "@/lib/fechas";
import { citasPorFecha, esAprobada, todasLasCitas } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/**
 * GET /api/agenda?fecha=AAAA-MM-DD  -> citas de ese día
 * GET /api/agenda?mes=AAAA-MM       -> citas de todo el mes (para el calendario)
 * Nunca incluye el correo.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const mes = params.get("mes");
  const fecha = params.get("fecha") ?? "";

  if (mes !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    return Response.json({ ok: false, error: "Mes no válido" }, { status: 400 });
  }
  if (mes === null && !esFechaValida(fecha)) {
    return Response.json({ ok: false, error: "Fecha no válida" }, { status: 400 });
  }

  try {
    if (mes !== null) {
      const citas = (await todasLasCitas())
        .filter((c) => c.fecha.startsWith(`${mes}-`) && esAprobada(c))
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
      return Response.json({ ok: true, mes, total: citas.length, citas });
    }

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
