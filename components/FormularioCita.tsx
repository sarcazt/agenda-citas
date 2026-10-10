"use client";

import { useState } from "react";

type Estado = "confirmada" | "con_alerta" | "rechazada";

type Resultado =
  | { tipo: "exito"; estado: Estado; mensaje: string; cuposLibres: number; fecha: string; hora: string }
  | { tipo: "error"; mensaje: string };

const ETIQUETAS: Record<Estado, string> = {
  confirmada: "Cita confirmada",
  con_alerta: "Cita agendada con alerta",
  rechazada: "Franja no disponible",
};

const ESTILOS: Record<Estado, string> = {
  confirmada: "border-green-300 bg-green-50 text-green-900",
  con_alerta: "border-amber-300 bg-amber-50 text-amber-900",
  rechazada: "border-red-300 bg-red-50 text-red-900",
};

// Datos de prueba para llenar el formulario con un clic. `hora` es un índice
// dentro de las franjas configuradas, así siempre queda una franja válida.
const PRUEBAS = [
  {
    etiqueta: "María López · Luna (Gato) · Consulta general",
    propietario: "María López",
    correo: "maria@example.com",
    mascota: "Luna",
    especie: "Gato",
    servicio: "Consulta general",
    hora: 2,
  },
  {
    etiqueta: "Carlos Pérez · Rocky (Perro) · Vacunación",
    propietario: "Carlos Pérez",
    correo: "carlos@example.com",
    mascota: "Rocky",
    especie: "Perro",
    servicio: "Vacunación",
    hora: 0,
  },
  {
    etiqueta: "Ana Gómez · Kiwi (Ave) · Control",
    propietario: "Ana Gómez",
    correo: "ana@example.com",
    mascota: "Kiwi",
    especie: "Ave",
    servicio: "Control",
    hora: 4,
  },
  {
    etiqueta: "Juan Torres · Thor (Perro) · Cirugía",
    propietario: "Juan Torres",
    correo: "juan@example.com",
    mascota: "Thor",
    especie: "Perro",
    servicio: "Cirugía",
    hora: 1,
  },
];

const MENSAJE_RECHAZADA ="Para esa franja no se puede agendar una cita, elige otra franja.";
const ERROR_GENERICO = "No se pudo procesar la cita. Inténtalo de nuevo.";

export function FormularioCita({ franjas, hoy }: { franjas: string[]; hoy: string }) {
  const [propietario, setPropietario] = useState("");
  const [correo, setCorreo] = useState("");
  const [mascota, setMascota] = useState("");
  const [especie, setEspecie] = useState("");
  const [servicio, setServicio] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [hora, setHora] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!propietario.trim()) e.propietario = "El nombre del propietario es obligatorio";
    if (!correo.trim()) e.correo = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) e.correo = "Correo no válido";
    if (!mascota.trim()) e.mascota = "El nombre de la mascota es obligatorio";
    if (!especie.trim()) e.especie = "La especie es obligatoria";
    if (!servicio.trim()) e.servicio = "El servicio es obligatorio";
    if (!fecha) e.fecha = "La fecha es obligatoria";
    else if (fecha < hoy) e.fecha = "La fecha no puede ser pasada";
    if (!hora) e.hora = "Selecciona una franja";
    return e;
  }

  function cargarPrueba(indice: string) {
    const p = PRUEBAS[Number(indice)];
    if (!p) return;
    setPropietario(p.propietario);
    setCorreo(p.correo);
    setMascota(p.mascota);
    setEspecie(p.especie);
    setServicio(p.servicio);
    setFecha(hoy);
    setHora(franjas[p.hora % franjas.length] ?? "");
    setObservaciones("");
    setErrores({});
    setResultado(null);
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
        body: JSON.stringify({
          propietario,
          correo,
          mascota,
          especie,
          servicio,
          fecha,
          hora,
          observaciones,
        }),
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
          hora,
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
  const etiqueta = "mb-1 block text-sm font-medium";
  const msgError = "mt-1 text-xs text-red-700";

  return (
    <div className="space-y-6">
      {resultado?.tipo === "exito" && (
        <div role="status" className={`rounded-md border p-4 ${ESTILOS[resultado.estado]}`}>
          <p className="font-semibold">{ETIQUETAS[resultado.estado]}</p>
          <p className="mt-1 text-sm">
            {resultado.estado === "rechazada" ? MENSAJE_RECHAZADA : resultado.mensaje}
          </p>
          {resultado.estado !== "rechazada" ? (
            <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
              <dt className="font-medium">Fecha</dt>
              <dd>{resultado.fecha}</dd>
              <dt className="font-medium">Franja</dt>
              <dd>{resultado.hora}</dd>
              <dt className="font-medium">Cupos libres</dt>
              <dd>{resultado.cuposLibres}</dd>
            </dl>
          ) : (
            <p className="mt-2 text-sm">Tus datos se conservaron; solo cambia la franja y vuelve a enviar.</p>
          )}
        </div>
      )}

      {resultado?.tipo === "error" && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {resultado.mensaje}
        </div>
      )}

      <div className="rounded-md border border-dashed border-slate-300 bg-white p-4">
        <label htmlFor="prueba" className={etiqueta}>
          Datos de prueba
        </label>
        <select
          id="prueba"
          className={campo}
          value=""
          onChange={(e) => cargarPrueba(e.target.value)}
        >
          <option value="">Selecciona para llenar el formulario...</option>
          {PRUEBAS.map((p, i) => (
            <option key={p.etiqueta} value={i}>
              {p.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={enviar} noValidate className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="propietario" className={etiqueta}>
              Nombre del propietario
            </label>
            <input
              id="propietario"
              className={campo}
              value={propietario}
              onChange={(e) => setPropietario(e.target.value)}
            />
            {errores.propietario && <p className={msgError}>{errores.propietario}</p>}
          </div>

          <div>
            <label htmlFor="correo" className={etiqueta}>
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              className={campo}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            {errores.correo && <p className={msgError}>{errores.correo}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mascota" className={etiqueta}>
              Nombre de la mascota
            </label>
            <input
              id="mascota"
              className={campo}
              placeholder="Luna"
              value={mascota}
              onChange={(e) => setMascota(e.target.value)}
            />
            {errores.mascota && <p className={msgError}>{errores.mascota}</p>}
          </div>

          <div>
            <label htmlFor="especie" className={etiqueta}>
              Especie
            </label>
            <input
              id="especie"
              className={campo}
              placeholder="Gato"
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
            />
            {errores.especie && <p className={msgError}>{errores.especie}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="servicio" className={etiqueta}>
            Servicio
          </label>
          <input
            id="servicio"
            className={campo}
            placeholder="Consulta general"
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
          />
          {errores.servicio && <p className={msgError}>{errores.servicio}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fecha" className={etiqueta}>
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
            {errores.fecha && <p className={msgError}>{errores.fecha}</p>}
          </div>

          <div>
            <label htmlFor="hora" className={etiqueta}>
              Franja horaria
            </label>
            <select id="hora" className={campo} value={hora} onChange={(e) => setHora(e.target.value)}>
              <option value="">Selecciona una franja</option>
              {franjas.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errores.hora && <p className={msgError}>{errores.hora}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="observaciones" className={etiqueta}>
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
