"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Alerta = { fecha: string; franja: string; ocupadas: number; cupo: number; libres: number };

/** AAAA-MM-DD -> DD/MM/AAAA */
function formatoFecha(fecha: string): string {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}

/**
 * Notificaciones de cupos de cualquier día (hoy en adelante), sin depender de la
 * fecha seleccionada: queda 1 cupo -> aviso; 0 -> agotada.
 */
export function CampanaNotificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[] | null>(null);
  const [fallo, setFallo] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const lista = alertas ?? [];

  const cargar = useCallback(() => {
    fetch("/api/agenda/alertas", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");
        setAlertas(data.alertas);
        setFallo(false);
      })
      .catch(() => setFallo(true));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

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

  function alternar() {
    // Al abrir se vuelven a pedir, para ver los cupos más recientes.
    if (!abierto) cargar();
    setAbierto(!abierto);
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={alternar}
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
            Cupos de los próximos días
          </p>
          {fallo ? (
            <p className="px-3 pb-3 text-sm text-red-700">No se pudieron cargar las notificaciones.</p>
          ) : alertas === null ? (
            <p className="px-3 pb-3 text-sm text-slate-500">Cargando...</p>
          ) : lista.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-slate-600">
              Sin novedades: ninguna franja está por agotarse.
            </p>
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {lista.map((a) => {
                const agotada = a.libres === 0;
                return (
                  <li
                    key={`${a.fecha}-${a.franja}`}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                      agotada ? "bg-red-50" : "bg-amber-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        agotada ? "bg-red-600" : "bg-amber-500"
                      }`}
                      aria-hidden="true"
                    >
                      {agotada ? "✕" : "!"}
                    </span>
                    <div className="text-sm">
                      <p className={`font-semibold ${agotada ? "text-red-900" : "text-amber-900"}`}>
                        Franja {formatoFecha(a.fecha)} · {a.franja}
                      </p>
                      <p className={agotada ? "text-red-800" : "text-amber-800"}>
                        {agotada
                          ? "Ya no hay cupos en esta franja."
                          : "Esta franja se está quedando sin cupos (queda 1)."}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
