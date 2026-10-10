"use client";

import { useEffect, useState } from "react";

type Estado = "confirmada" | "con_alerta" | "rechazada";
type Cita = { id: string; franja: string; nombre: string; estado: Estado };

const ETIQUETAS: Record<Estado, { texto: string; estilo: string }> = {
  confirmada: { texto: "Confirmada", estilo: "bg-green-100 text-green-800" },
  con_alerta: { texto: "Con alerta", estilo: "bg-amber-100 text-amber-800" },
  rechazada: { texto: "Rechazada", estilo: "bg-red-100 text-red-800" },
};

export function VistaAgenda({ hoy }: { hoy: string }) {
  const [fecha, setFecha] = useState(hoy);
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fecha) return;
    const controller = new AbortController();
    setCitas(null);
    setError(null);

    fetch(`/api/agenda?fecha=${encodeURIComponent(fecha)}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");
        setCitas(data.citas);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError("No se pudo cargar la agenda. Inténtalo de nuevo.");
      });

    return () => controller.abort();
  }, [fecha]);

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="fecha" className="mb-1 block text-sm font-medium">
          Fecha
        </label>
        <input
          id="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {!error && citas === null && <p className="text-sm text-slate-500">Cargando...</p>}

      {citas && citas.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          No hay citas para esta fecha.
        </p>
      )}

      {citas && citas.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-slate-600">
            Total de citas: <strong>{citas.length}</strong>
          </p>
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {citas.map((c, i) => (
              <li key={`${c.id}-${i}`} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-baseline gap-4">
                  <span className="w-14 font-mono text-sm">{c.franja}</span>
                  <span className="text-sm">{c.nombre}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ETIQUETAS[c.estado].estilo}`}>
                  {ETIQUETAS[c.estado].texto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
