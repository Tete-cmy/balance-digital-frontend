
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  crearMovimiento,
  eliminarMovimiento,
  listarMovimientos,
  obtenerCategorias,
  type CategoriaMovimiento,
  type EstadoMovimiento,
  type Movimiento,
  type ResumenMovimientos,
  type TipoMovimiento,
} from "../../services/movimientosService";

import "./Movimientos.css";

const resumenVacio: ResumenMovimientos = {
  totalIngresos: 0,
  totalGastos: 0,
  balanceNeto: 0,
  cantidadIngresos: 0,
  cantidadGastos: 0,
  cantidadTotal: 0,
};

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(valor);
}

function fechaVisible(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia));
}

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimiento[]>([]);
  const [resumen, setResumen] = useState<ResumenMovimientos>(resumenVacio);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEliminar, setModalEliminar] = useState<Movimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [estado, setEstado] = useState<EstadoMovimiento>("confirmado");

  const categoriasDisponibles = useMemo(
    () => categorias,
    [categorias]
  );

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const [lista, categoriasLista] = await Promise.all([
        listarMovimientos({
          busqueda,
          tipo: tipoFiltro,
          estado: estadoFiltro,
        }),
        obtenerCategorias(),
      ]);

      setMovimientos(lista.movimientos);
      setResumen(lista.resumen);
      setCategorias(categoriasLista);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar los movimientos"
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargar();
    }, 250);

    return () => window.clearTimeout(temporizador);
  }, [busqueda, tipoFiltro, estadoFiltro]);

  useEffect(() => {
    const existe = categoriasDisponibles.some(
      (categoria) => String(categoria.id) === categoriaId
    );

    if (!existe) {
      setCategoriaId(
        categoriasDisponibles[0]
          ? String(categoriasDisponibles[0].id)
          : ""
      );
    }
  }, [categoriaId, categoriasDisponibles]);

  function abrirNuevo() {
    setTipo("ingreso");
    setDescripcion("");
    setMonto("");
    setEstado("confirmado");
    setError("");
    setModalNuevo(true);
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setError("");

    try {
      await crearMovimiento({
        tipo,
        descripcion,
        monto: Number(monto),
        categoriaId: Number(categoriaId),
        estado,
      });

      setModalNuevo(false);
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo registrar el movimiento"
      );
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    if (!modalEliminar) {
      return;
    }

    setGuardando(true);
    setError("");

    try {
      await eliminarMovimiento(modalEliminar.id);
      setModalEliminar(null);
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo eliminar el movimiento"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="movimientos-page">
      <section className="movimientos-toolbar">
        <div className="movimientos-search">
          <Search size={18} />
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar movimiento..."
          />
        </div>

        <button
          type="button"
          className="movimientos-filter-button"
          onClick={() => setMostrarFiltros((actual) => !actual)}
        >
          <Filter size={18} />
          Filtros
        </button>
      </section>

      {mostrarFiltros ? (
        <section className="movimientos-filtros">
          <select
            value={tipoFiltro}
            onChange={(evento) => setTipoFiltro(evento.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>

          <select
            value={estadoFiltro}
            onChange={(evento) => setEstadoFiltro(evento.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendiente">Pendientes</option>
            <option value="cancelado">Cancelados</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setTipoFiltro("");
              setEstadoFiltro("");
            }}
          >
            Limpiar filtros
          </button>
        </section>
      ) : null}

      {error && !modalNuevo && !modalEliminar ? (
        <div className="movimientos-error">{error}</div>
      ) : null}

      <section className="movimientos-table-card">
        <div className="movimientos-table-header">
          <span>Fecha</span>
          <span>Descripción</span>
          <span>Categoría</span>
          <span>Monto</span>
          <span>Estado</span>
          <span />
        </div>

        <div className="movimientos-table-body">
          {cargando ? (
            <div className="movimientos-empty">Cargando movimientos...</div>
          ) : movimientos.length === 0 ? (
            <div className="movimientos-empty">
              No hay movimientos registrados.
            </div>
          ) : (
            movimientos.map((movimiento) => (
              <article key={movimiento.id} className="movimientos-row">
                <span className="movimientos-fecha">
                  <CalendarDays size={15} />
                  {fechaVisible(movimiento.fecha)}
                </span>

                <div className="movimientos-descripcion">
                  <span
                    className={
                      movimiento.tipo === "ingreso"
                        ? "movimientos-tipo-icon ingreso"
                        : "movimientos-tipo-icon gasto"
                    }
                  >
                    {movimiento.tipo === "ingreso" ? (
                      <ArrowUpRight size={17} />
                    ) : (
                      <ArrowDownRight size={17} />
                    )}
                  </span>

                  <strong>{movimiento.descripcion}</strong>
                </div>

                <span
                  className="movimientos-categoria"
                  style={{
                    color: movimiento.categoria_color ?? "#64748B",
                    backgroundColor: `${
                      movimiento.categoria_color ?? "#64748B"
                    }18`,
                  }}
                >
                  {movimiento.categoria ?? "Sin categoría"}
                </span>

                <strong
                  className={
                    movimiento.tipo === "ingreso"
                      ? "movimientos-monto ingreso"
                      : "movimientos-monto gasto"
                  }
                >
                  {movimiento.tipo === "ingreso" ? "+" : "-"}
                  {moneda(movimiento.monto)}
                </strong>

                <span className={`movimientos-estado ${movimiento.estado}`}>
                  {movimiento.estado === "confirmado"
                    ? "Confirmado"
                    : movimiento.estado === "pendiente"
                      ? "Pendiente"
                      : "Cancelado"}
                </span>

                <button
                  type="button"
                  className="movimientos-delete"
                  onClick={() => setModalEliminar(movimiento)}
                  aria-label="Eliminar movimiento"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="movimientos-resumen">
        <article className="movimientos-total ingresos">
          <span>Total ingresos</span>
          <strong>{moneda(resumen.totalIngresos)}</strong>
          <small>{resumen.cantidadIngresos} transacciones</small>
        </article>

        <article className="movimientos-total gastos">
          <span>Total gastos</span>
          <strong>-{moneda(resumen.totalGastos)}</strong>
          <small>{resumen.cantidadGastos} transacciones</small>
        </article>

        <article className="movimientos-total balance">
          <span>Balance neto</span>
          <strong>{moneda(resumen.balanceNeto)}</strong>
          <small>{resumen.cantidadTotal} transacciones</small>
        </article>
      </section>

      <button type="button" className="movimientos-add" onClick={abrirNuevo}>
        <Plus size={22} />
        Agregar movimiento
      </button>

      {modalNuevo ? (
        <div className="movimientos-modal-backdrop">
          <form className="movimientos-modal movimientos-modal--figma" onSubmit={guardar}>
            <header>
              <div>
                <Plus size={20} />
                <h2>Nuevo movimiento</h2>
              </div>

              <button type="button" onClick={() => setModalNuevo(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="movimientos-modal-body">
              <div className="movimientos-tipo-selector">
                <button
                  type="button"
                  className={tipo === "ingreso" ? "active ingreso" : ""}
                  onClick={() => setTipo("ingreso")}
                >
                  💰 Ingreso
                </button>

                <button
                  type="button"
                  className={tipo === "gasto" ? "active gasto" : ""}
                  onClick={() => setTipo("gasto")}
                >
                  💸 Gasto
                </button>
              </div>

              <label>
                Descripción
                <input
                  value={descripcion}
                  onChange={(evento) => setDescripcion(evento.target.value)}
                  placeholder="Ej: Supermercado, Nómina..."
                  required
                />
              </label>

              <label>
                Monto (MXN)
                <div className="movimientos-money-input">
                  <span>$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(evento) => setMonto(evento.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </label>

              <label>
                Categoría
                <select
                  value={categoriaId}
                  onChange={(evento) => setCategoriaId(evento.target.value)}
                  required
                >
                  {categoriasDisponibles.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <div className="movimientos-estado-selector">
                <button
                  type="button"
                  className={estado === "confirmado" ? "active confirmado" : ""}
                  onClick={() => setEstado("confirmado")}
                >
                  Confirmado
                </button>

                <button
                  type="button"
                  className={estado === "pendiente" ? "active pendiente" : ""}
                  onClick={() => setEstado("pendiente")}
                >
                  Pendiente
                </button>
              </div>

              {error ? <div className="movimientos-error">{error}</div> : null}

              <button
                type="submit"
                className="movimientos-submit-figma"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Agregar movimiento"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {modalEliminar ? (
        <div className="movimientos-modal-backdrop">
          <div className="movimientos-confirm">
            <div className="movimientos-confirm-icon">
              <Trash2 size={24} />
            </div>

            <h2>Eliminar movimiento</h2>

            <p>
              Se eliminará permanentemente “{modalEliminar.descripcion}”.
            </p>

            {error ? <div className="movimientos-error">{error}</div> : null}

            <div>
              <button
                type="button"
                className="secondary"
                onClick={() => setModalEliminar(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="danger"
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