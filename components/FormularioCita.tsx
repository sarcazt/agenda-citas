"use client";

import { useState } from "react";

type Estado = "confirmada" | "con_alerta" | "rechazada";

type Resultado =
  | { tipo: "exito"; estado: Estado; mensaje: string; cuposLibres: number; fecha: string; franja: string }
  | { tipo: "error"; mensaje: string };

const ETIQUETAS: Record<Estado, string> = {
  confirmada: "Cita confirmada",
  con_alerta: "Cita agendada con alerta",
  rechazada: "Sin cupo en esta franja",
};

const ESTILOS: Record<Estado, string> = {
  confirmada: "border-green-300 bg-green-50 text-green-900",
  con_alerta: "border-amber-300 bg-amber-50 text-amber-900",
  rechazada: "border-red-300 bg-red-50 text-red-900",
};

const ERROR_GENERICO = "No se pudo procesar la cita. Inténtalo de nuevo.";

export function FormularioCita({ franjas, hoy }: { franjas: string[]; hoy: string }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [franja, setFranja] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!correo.trim()) e.correo = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) e.correo = "Correo no válido";
    if (!fecha) e.fecha = "La fecha es obligatoria";
    else if (fecha < hoy) e.fecha = "La fecha no puede ser pasada";
    if (!franja) e.franja = "Selecciona una franja";
    return e;
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;

    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, fecha, franja, observaciones }),
      });
      const data = await res.json();

      if (res.status === 400 && data.campos) {
        const porCampo: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.campos as Record<string, string[]>)) {
          porCampo[k] = v[0];
        }
        setErrores(porCampo);
      } else if (res.ok && data.ok) {
        setResultado({
          tipo: "exito",
          estado: data.estado,
          mensaje: data.mensaje,
          cuposLibres: data.cupos_libres,
          fecha,
          franja,
        });
      } else {
        setResultado({ tipo: "error", mensaje: ERROR_GENERICO });
      }
    } catch {
      setResultado({ tipo: "error", mensaje: ERROR_GENERICO });
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      {resultado?.tipo === "exito" && (
        <div role="status" className={`rounded-md border p-4 ${ESTILOS[resultado.estado]}`}>
          <p className="font-semibold">{ETIQUETAS[resultado.estado]}</p>
          <p className="mt-1 text-sm">{resultado.mensaje}</p>
          {resultado.estado !== "rechazada" ? (
            <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
              <dt className="font-medium">Fecha</dt>
              <dd>{resultado.fecha}</dd>
              <dt className="font-medium">Franja</dt>
              <dd>{resultado.franja}</dd>
              <dt className="font-medium">Cupos libres</dt>
              <dd>{resultado.cuposLibres}</dd>
            </dl>
          ) : (
            <p className="mt-2 text-sm">Elige otra franja y vuelve a enviar; tus datos se conservaron.</p>
          )}
        </div>
      )}

      {resultado?.tipo === "error" && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {resultado.mensaje}
        </div>
      )}

      <form onSubmit={enviar} noValidate className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium">
            Nombre del dueño
          </label>
          <input id="nombre" className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          {errores.nombre && <p className="mt-1 text-xs text-red-700">{errores.nombre}</p>}
        </div>

        <div>
          <label htmlFor="correo" className="mb-1 block text-sm font-medium">
            Correo electrónico
          </label>
          <input
            id="correo"
            type="email"
            className={campo}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          {errores.correo && <p className="mt-1 text-xs text-red-700">{errores.correo}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fecha" className="mb-1 block text-sm font-medium">
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              min={hoy}
              className={campo}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            {errores.fecha && <p className="mt-1 text-xs text-red-700">{errores.fecha}</p>}
          </div>

          <div>
            <label htmlFor="franja" className="mb-1 block text-sm font-medium">
              Franja horaria
            </label>
            <select id="franja" className={campo} value={franja} onChange={(e) => setFranja(e.target.value)}>
              <option value="">Selecciona una franja</option>
              {franjas.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errores.franja && <p className="mt-1 text-xs text-red-700">{errores.franja}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="observaciones" className="mb-1 block text-sm font-medium">
            Observaciones <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="observaciones"
            rows={3}
            maxLength={500}
            className={campo}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Agendar cita"}
        </button>
      </form>
    </div>
  );
}
