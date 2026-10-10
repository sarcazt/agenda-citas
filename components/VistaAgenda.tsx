"use client";

import { useEffect, useState } from "react";

type Cita = {
  id: string;
  hora: string;
  propietario: string;
  mascota: string;
  especie: string;
  servicio: string;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="fecha" className="mb-1.5 block text-sm font-medium text-slate-700">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        {citas && (
          <div className="rounded-xl bg-teal-50 px-4 py-2 text-right">
            <p className="text-2xl font-bold leading-none text-teal-700">{citas.length}</p>
            <p className="mt-1 text-xs font-medium text-teal-800">
              {citas.length === 1 ? "cita" : "citas"} este día
            </p>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && citas === null && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {citas && citas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
          <p className="text-4xl" aria-hidden="true">
            🗓️
          </p>
          <p className="mt-3 font-medium text-slate-800">No hay citas para esta fecha</p>
          <p className="mt-1 text-sm text-slate-500">Prueba con otro día para ver su agenda.</p>
        </div>
      )}

      {citas && citas.length > 0 && (
        <ul className="space-y-3">
          {citas.map((c, i) => (
            <li
              key={`${c.id}-${i}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-teal-600 font-mono text-base font-semibold text-white">
                {c.hora}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.propietario}</p>
                <p className="truncate text-sm text-slate-600">
                  {c.mascota} <span className="text-slate-400">({c.especie})</span>
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {c.servicio}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
