"use client";

import { useEffect, useMemo, useState } from "react";
import { CampanaNotificaciones } from "./CampanaNotificaciones";

type Cita = {
  id: string;
  fecha: string;
  hora: string;
  propietario: string;
  mascota: string;
  especie: string;
  servicio: string;
  asistio: boolean;
};

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Mes siguiente o anterior de un AAAA-MM. */
function moverMes(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Celdas del calendario (semana desde el lunes): null = hueco, o el AAAA-MM-DD del día. */
function celdasDelMes(mes: string): (string | null)[] {
  const [a, m] = mes.split("-").map(Number);
  const primero = new Date(Date.UTC(a, m - 1, 1)).getUTCDay(); // 0 = domingo
  const huecos = (primero + 6) % 7;
  const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const celdas: (string | null)[] = Array(huecos).fill(null);
  for (let d = 1; d <= dias; d++) celdas.push(`${mes}-${String(d).padStart(2, "0")}`);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

/** AAAA-MM-DD -> "14 de octubre de 2026" */
function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

export function VistaAgenda({ hoy }: { hoy: string }) {
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<Set<string>>(new Set());
  const [errorAsistencia, setErrorAsistencia] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCitas(null);
    setError(null);

    fetch(`/api/agenda?mes=${encodeURIComponent(mes)}`, { signal: controller.signal })
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
  }, [mes]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, Cita[]>();
    for (const c of citas ?? []) {
      const lista = mapa.get(c.fecha) ?? [];
      lista.push(c);
      mapa.set(c.fecha, lista);
    }
    return mapa;
  }, [citas]);

  const celdas = useMemo(() => celdasDelMes(mes), [mes]);
  const [anio, numMes] = mes.split("-").map(Number);
  const citasDelDia = porDia.get(seleccionado) ?? [];

  /** Marca la asistencia de una cita: se refleja de inmediato y se revierte si falla. */
  async function marcarAsistencia(id: string, asistio: boolean) {
    if (!id || guardando.has(id)) return;
    const anterior = citas?.find((c) => c.id === id)?.asistio ?? false;
    if (anterior === asistio) return;

    const poner = (valor: boolean) =>
      setCitas((lista) => lista && lista.map((c) => (c.id === id ? { ...c, asistio: valor } : c)));
    const enCurso = (activo: boolean) =>
      setGuardando((prev) => {
        const sig = new Set(prev);
        if (activo) sig.add(id);
        else sig.delete(id);
        return sig;
      });

    setErrorAsistencia(null);
    poner(asistio);
    enCurso(true);
    try {
      const res = await fetch("/api/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cita: id, asistio }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");
    } catch {
      poner(anterior);
      setErrorAsistencia("No se pudo registrar la asistencia. Inténtalo de nuevo.");
    } finally {
      enCurso(false);
    }
  }

  function irAMes(nuevo: string) {
    setMes(nuevo);
    setSeleccionado(nuevo === hoy.slice(0, 7) ? hoy : `${nuevo}-01`);
  }

  const botonNav =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

  return (
    <div className="space-y-6">
      {/* Barra del calendario */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => irAMes(moverMes(mes, -1))} className={botonNav} aria-label="Mes anterior">
            ‹
          </button>
          <button type="button" onClick={() => irAMes(moverMes(mes, 1))} className={botonNav} aria-label="Mes siguiente">
            ›
          </button>
          <h2 className="ml-2 text-xl font-bold capitalize tracking-tight">
            {MESES[numMes - 1]} {anio}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => irAMes(hoy.slice(0, 7))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            Hoy
          </button>
          {citas && (
            <div className="rounded-xl bg-indigo-50 px-4 py-1.5 text-right">
              <p className="text-xl font-bold leading-none text-indigo-700">{citas.length}</p>
              <p className="mt-0.5 text-xs font-medium text-indigo-800">
                {citas.length === 1 ? "cita" : "citas"} en el mes
              </p>
            </div>
          )}
          <CampanaNotificaciones />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Cuadrícula del mes */}
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity ${
          citas === null && !error ? "opacity-60" : ""
        }`}
        aria-busy={citas === null && !error}
      >
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {celdas.map((dia, i) => {
            if (!dia) {
              return <div key={`h-${i}`} className="min-h-16 border-b border-r border-slate-100 bg-slate-50/60 sm:min-h-28" />;
            }
            const lista = porDia.get(dia) ?? [];
            const esHoy = dia === hoy;
            const activo = dia === seleccionado;
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setSeleccionado(dia)}
                aria-pressed={activo}
                aria-label={`${fechaLarga(dia)}: ${lista.length} ${lista.length === 1 ? "cita" : "citas"}`}
                className={`flex min-h-16 flex-col items-stretch gap-1 border-b border-r border-slate-100 p-1.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:min-h-28 sm:p-2 ${
                  activo ? "bg-indigo-50 ring-2 ring-inset ring-indigo-500" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
                    esHoy ? "bg-indigo-600 text-white" : "text-slate-700"
                  }`}
                >
                  {Number(dia.slice(8))}
                </span>

                {/* Móvil: solo el número de citas */}
                {lista.length > 0 && (
                  <span className="w-fit rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white sm:hidden">
                    {lista.length}
                  </span>
                )}

                {/* Escritorio: las primeras citas del día */}
                <span className="hidden flex-col gap-1 sm:flex">
                  {lista.slice(0, 2).map((c, k) => (
                    <span
                      key={`${c.id}-${k}`}
                      className="truncate rounded-md bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium text-indigo-900"
                    >
                      {c.hora} · {c.mascota || c.propietario}
                    </span>
                  ))}
                  {lista.length > 2 && (
                    <span className="px-1 text-[11px] font-semibold text-indigo-700">+{lista.length - 2} más</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <section aria-live="polite">
        <h3 className="mb-3 text-lg font-semibold">
          Citas del {fechaLarga(seleccionado)}
          {citas && (
            <span className="ml-2 rounded-full bg-indigo-100 px-2.5 py-0.5 align-middle text-xs font-bold text-indigo-800">
              {citasDelDia.length}
            </span>
          )}
        </h3>

        {citas === null && !error && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        )}

        {citas && citasDelDia.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
            <p className="text-3xl" aria-hidden="true">
              🗓️
            </p>
            <p className="mt-2 font-medium text-slate-800">No hay citas para este día</p>
            <p className="mt-1 text-sm text-slate-500">Selecciona otro día del calendario.</p>
          </div>
        )}

        {errorAsistencia && (
          <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errorAsistencia}
          </div>
        )}

        {citasDelDia.length > 0 && (
          <ul className="space-y-3">
            {citasDelDia.map((c, i) => (
              <li
                key={`${c.id}-${i}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
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

                <div
                  role="group"
                  aria-label={`Asistencia de ${c.propietario}`}
                  className="flex w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 text-sm font-medium sm:w-auto"
                >
                  <button
                    type="button"
                    disabled={!c.id || guardando.has(c.id)}
                    aria-pressed={c.asistio}
                    onClick={() => marcarAsistencia(c.id, true)}
                    className={`flex-1 px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${
                      c.asistio ? "bg-green-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Asistió
                  </button>
                  <button
                    type="button"
                    disabled={!c.id || guardando.has(c.id)}
                    aria-pressed={!c.asistio}
                    onClick={() => marcarAsistencia(c.id, false)}
                    className={`flex-1 border-l border-slate-200 px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${
                      !c.asistio ? "bg-slate-200 text-slate-800" : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    No asistió
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
