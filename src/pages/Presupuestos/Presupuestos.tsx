import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Trash2, X } from "lucide-react";

import {
  eliminarPresupuesto,
  guardarPresupuesto,
  obtenerPresupuestos,
  type Presupuesto,
  type ResumenPresupuestos,
} from "../../services/presupuestosService";

import "./Presupuestos.css";

const categorias = [
  { nombre: "Alimentación", icono: "🛒", color: "#48C58D" },
  { nombre: "Vivienda", icono: "🏠", color: "#54866F" },
  { nombre: "Transporte", icono: "🚗", color: "#7A5A54" },
  { nombre: "Entretenimiento", icono: "🎬", color: "#C95749" },
  { nombre: "Salud", icono: "💊", color: "#1399D6" },
  { nombre: "Educación", icono: "📚", color: "#8B5CF6" },
] as const;

const resumenVacio: ResumenPresupuestos = {
  totalLimite: 0,
  totalGastado: 0,
  disponible: 0,
  porcentaje: 0,
};

const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

function limitarPorcentaje(valor: number): number {
  return Math.max(0, Math.min(valor, 100));
}

export default function Presupuestos() {
  const ahora = useMemo(() => new Date(), []);
  const [mes] = useState(ahora.getMonth() + 1);
  const [anio] = useState(ahora.getFullYear());

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [resumen, setResumen] = useState<ResumenPresupuestos>(resumenVacio);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEliminar, setModalEliminar] = useState<Presupuesto | null>(null);
  const [categoriaNombre, setCategoriaNombre] = useState("Alimentación");
  const [limiteMonto, setLimiteMonto] = useState("");

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await obtenerPresupuestos(mes, anio);
      setPresupuestos(respuesta.presupuestos);
      setResumen(respuesta.resumen);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar los presupuestos"
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, [mes, anio]);

  function abrirNuevo() {
    setCategoriaNombre("Alimentación");
    setLimiteMonto("");
    setError("");
    setModalNuevo(true);
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!categoriaNombre) {
      setError("Selecciona un tipo de presupuesto");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      await guardarPresupuesto({
        categoriaNombre,
        limiteMonto: Number(limiteMonto),
        mes,
        anio,
        alertaPorcentaje: 80,
      });

      setModalNuevo(false);
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo guardar el presupuesto"
      );
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    if (!modalEliminar) return;

    setGuardando(true);
    setError("");

    try {
      await eliminarPresupuesto(modalEliminar.id);
      setModalEliminar(null);
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo eliminar el presupuesto"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="presupuestos-page">
      {error && !modalNuevo && !modalEliminar ? (
        <div className="presupuestos-error">{error}</div>
      ) : null}

      <section className="presupuestos-total">
        <div className="presupuestos-total__encabezado">
          <h2>Presupuesto Total</h2>
          <span>{nombresMeses[mes - 1]} {anio}</span>
        </div>

        <div className="presupuestos-total__cantidades">
          <strong>{moneda(resumen.totalGastado)}</strong>
          <span>/ {moneda(resumen.totalLimite)}</span>
        </div>

        <div className="presupuestos-barra">
          <span style={{ width: `${limitarPorcentaje(resumen.porcentaje)}%` }} />
        </div>

        <p>
          {resumen.disponible >= 0
            ? `✓ Te quedan ${moneda(resumen.disponible)} disponibles`
            : `⚠ Excedido por ${moneda(Math.abs(resumen.disponible))}`}
        </p>
      </section>

      <section className="presupuestos-lista">
        {cargando ? (
          <div className="presupuestos-vacio">Cargando presupuestos...</div>
        ) : presupuestos.length === 0 ? (
          <div className="presupuestos-vacio">
            Todavía no hay presupuestos para este mes.
          </div>
        ) : (
          presupuestos.map((presupuesto) => (
            <article
              key={presupuesto.id}
              className={`presupuesto-card ${
                presupuesto.excedido ? "presupuesto-card--excedido" : ""
              }`}
            >
              <div className="presupuesto-card__fila">
                <div className="presupuesto-card__categoria">
                  <span>{presupuesto.icono}</span>
                  <strong>{presupuesto.categoria}</strong>
                </div>

                <div className="presupuesto-card__montos">
                  <strong>{moneda(presupuesto.gastado)}</strong>
                  <span>/ {moneda(presupuesto.limite)}</span>
                </div>

                <button
                  type="button"
                  className="presupuesto-card__eliminar"
                  onClick={() => setModalEliminar(presupuesto)}
                  aria-label={`Eliminar presupuesto de ${presupuesto.categoria}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="presupuesto-card__barra">
                <span
                  style={{
                    width: `${limitarPorcentaje(presupuesto.porcentaje)}%`,
                    backgroundColor: presupuesto.excedido
                      ? "#C95749"
                      : presupuesto.color,
                  }}
                />
              </div>

              {presupuesto.excedido ? (
                <p className="presupuesto-card__alerta">
                  <AlertTriangle size={14} />
                  Excedido por {moneda(presupuesto.excedidoPor)}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>

      <button type="button" className="presupuestos-nuevo" onClick={abrirNuevo}>
        <Plus size={21} />
        Nuevo presupuesto
      </button>

      {modalNuevo ? (
        <div className="presupuestos-modal-fondo">
          <form className="presupuestos-modal" onSubmit={guardar}>
            <header>
              <div>
                <Plus size={20} />
                <h2>Nuevo presupuesto</h2>
              </div>

              <button type="button" onClick={() => setModalNuevo(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="presupuestos-modal__contenido">
              <div className="presupuestos-tipos">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.nombre}
                    type="button"
                    className={
                      categoriaNombre === categoria.nombre
                        ? "presupuestos-tipo activo"
                        : "presupuestos-tipo"
                    }
                    onClick={() => setCategoriaNombre(categoria.nombre)}
                  >
                    <span>{categoria.icono}</span>
                    <strong>{categoria.nombre}</strong>
                  </button>
                ))}
              </div>

              <label>
                Límite mensual (MXN)
                <div className="presupuestos-monto">
                  <span>$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={limiteMonto}
                    onChange={(evento) => setLimiteMonto(evento.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </label>

              <div className="presupuestos-periodo">
                {nombresMeses[mes - 1]} {anio}
              </div>

              {error ? <div className="presupuestos-error">{error}</div> : null}

              <button
                type="submit"
                className="presupuestos-modal__guardar"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar presupuesto"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {modalEliminar ? (
        <div className="presupuestos-modal-fondo">
          <div className="presupuestos-confirmacion">
            <div className="presupuestos-confirmacion__icono">
              <Trash2 size={24} />
            </div>

            <h2>Eliminar presupuesto</h2>
            <p>Se eliminará el presupuesto de “{modalEliminar.categoria}”.</p>

            <div className="presupuestos-confirmacion__acciones">
              <button
                type="button"
                className="secundario"
                onClick={() => setModalEliminar(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="peligro"
                disabled={guardando}
                onClick={() => void confirmarEliminacion()}
              >
                {guardando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}