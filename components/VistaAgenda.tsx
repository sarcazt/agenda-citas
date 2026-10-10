"use client";

import { useEffect, useRef, useState } from "react";

type Cita = {
  id: string;
  hora: string;
  propietario: string;
  mascota: string;
  especie: string;
  servicio: string;
};

type Cupo = { franja: string; cupo: number; ocupadas: number; libres: number };

/** Notificaciones de cupos: queda 1 -> aviso; 0 -> agotada. */
function notificaciones(cupos: Cupo[]) {
  return cupos
    .filter((c) => c.libres <= 1)
    .map((c) => ({
      franja: c.franja,
      agotada: c.libres === 0,
      texto:
        c.libres === 0
          ? "Ya no hay cupos en esta franja."
          : "Esta franja se está quedando sin cupos (queda 1).",
    }));
}

function CampanaNotificaciones({ cupos }: { cupos: Cupo[] | null }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const lista = cupos ? notificaciones(cupos) : [];

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label={`Notificaciones de cupos${lista.length ? `, ${lista.length} nuevas` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
          />
        </svg>
        {lista.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {lista.length}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="region"
          aria-label="Notificaciones de cupos"
          className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cupos de la fecha
          </p>
          {cupos === null ? (
            <p className="px-3 pb-3 text-sm text-slate-500">Cargando...</p>
          ) : lista.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-slate-600">Sin novedades: todas las franjas tienen cupos.</p>
          ) : (
            <ul className="space-y-1">
              {lista.map((n) => (
                <li
                  key={n.franja}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                    n.agotada ? "bg-red-50" : "bg-amber-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      n.agotada ? "bg-red-600" : "bg-amber-500"
                    }`}
                    aria-hidden="true"
                  >
                    {n.agotada ? "✕" : "!"}
                  </span>
                  <div className="text-sm">
                    <p className={`font-semibold ${n.agotada ? "text-red-900" : "text-amber-900"}`}>
                      Franja {n.franja}
                    </p>
                    <p className={n.agotada ? "text-red-800" : "text-amber-800"}>{n.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function VistaAgenda({ hoy }: { hoy: string }) {
  const [fecha, setFecha] = useState(hoy);
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [cupos, setCupos] = useState<Cupo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fecha) return;
    const controller = new AbortController();
    setCitas(null);
    setCupos(null);
    setError(null);

    fetch(`/api/agenda?fecha=${encodeURIComponent(fecha)}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");
        setCitas(data.citas);
        setCupos(data.cupos);
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-3">
          {citas && (
            <div className="rounded-xl bg-indigo-50 px-4 py-2 text-right">
              <p className="text-2xl font-bold leading-none text-indigo-700">{citas.length}</p>
              <p className="mt-1 text-xs font-medium text-indigo-800">
                {citas.length === 1 ? "cita" : "citas"} este día
              </p>
            </div>
          )}
          <CampanaNotificaciones cupos={cupos} />
        </div>
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
              <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-mono text-base font-semibold text-white">
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
