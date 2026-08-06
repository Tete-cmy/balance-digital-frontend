import { useEffect, useState, type FormEvent } from "react";
import { Check, Plus, Target } from "lucide-react";

import {
  abonarMeta,
  crearMeta,
  obtenerMetas,
  type MetaAhorro,
  type ResumenMetas,
} from "../../services/metasService";

import "./Metas.css";

const iconos = ["🎯", "✈️", "🏠", "💻", "🚗", "💍", "📚", "🛡️", "🎸", "🏖️"];
const colores = [
  "#48C58D",
  "#54866F",
  "#8457F4",
  "#F59E0B",
  "#EF4444",
  "#0E8AC7",
  "#C45B4C",
  "#7A5A54",
];

const confetiPiezas = Array.from({ length: 70 }, (_, indice) => ({
  id: indice,
  izquierda: (indice * 37) % 100,
  retraso: (indice % 12) * 0.08,
  duracion: 2.4 + (indice % 7) * 0.16,
  giro: (indice * 47) % 360,
  forma: indice % 3,
}));

const resumenVacio: ResumenMetas = {
  enProgreso: 0,
  completadas: 0,
  totalAhorro: 0,
};

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

function fechaObjetivoTexto(fecha: string | null): string {
  if (!fecha) return "Sin fecha límite";

  const valor = new Date(`${fecha}T00:00:00`);
  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "numeric",
  }).format(valor);
}

function porcentajeLimitado(valor: number): number {
  return Math.max(0, Math.min(valor, 100));
}

export default function Metas() {
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const [resumen, setResumen] = useState<ResumenMetas>(resumenVacio);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarNuevaMeta, setMostrarNuevaMeta] = useState(false);
  const [metaAbono, setMetaAbono] = useState<MetaAhorro | null>(null);

  const [icono, setIcono] = useState("🎯");
  const [color, setColor] = useState("#48C58D");
  const [nombre, setNombre] = useState("");
  const [montoObjetivo, setMontoObjetivo] = useState("");
  const [fechaObjetivo, setFechaObjetivo] = useState("");
  const [montoAbono, setMontoAbono] = useState("");
  const [mostrarCelebracion, setMostrarCelebracion] = useState(false);

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await obtenerMetas();
      setMetas(respuesta.metas);
      setResumen(respuesta.resumen);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar las metas"
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  function abrirNuevaMeta() {
    setIcono("🎯");
    setColor("#48C58D");
    setNombre("");
    setMontoObjetivo("");
    setFechaObjetivo("");
    setError("");
    setMostrarNuevaMeta(true);
    setMetaAbono(null);
  }

  async function guardarMeta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const formulario = new FormData(evento.currentTarget);
    const nombreFormulario = String(formulario.get("nombre") ?? "").trim();
    const montoFormulario = Number(formulario.get("montoObjetivo"));
    const fechaFormulario = String(
      formulario.get("fechaObjetivo") ?? ""
    ).trim();

    if (!nombreFormulario) {
      setError("Escribe el nombre de la meta");
      return;
    }

    if (!Number.isFinite(montoFormulario) || montoFormulario <= 0) {
      setError("El monto objetivo debe ser mayor a cero");
      return;
    }

    setProcesando(true);
    setError("");

    try {
      await crearMeta({
        nombre: nombreFormulario,
        montoObjetivo: montoFormulario,
        fechaObjetivo: fechaFormulario || null,
        icono,
        color,
      });

      setMostrarNuevaMeta(false);
      setNombre("");
      setMontoObjetivo("");
      setFechaObjetivo("");
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo crear la meta"
      );
    } finally {
      setProcesando(false);
    }
  }

  function abrirAbono(meta: MetaAhorro) {
    setMetaAbono(meta);
    setMontoAbono("");
    setMostrarNuevaMeta(false);
    setError("");
  }

  async function confirmarAbono(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!metaAbono) return;

    const montoNumero = Number(montoAbono);

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError("La cantidad a abonar debe ser mayor a cero");
      return;
    }

    setProcesando(true);
    setError("");

    try {
      const seCompleta = montoNumero >= metaAbono.faltante;

      await abonarMeta(metaAbono.id, montoNumero);
      setMetaAbono(null);
      await cargar();

      if (seCompleta) {
        setMostrarCelebracion(true);

        window.setTimeout(() => {
          setMostrarCelebracion(false);
        }, 3200);
      }
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo registrar el abono"
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="metas-page">
      {mostrarCelebracion ? (
        <div
          className="meta-celebracion"
          role="status"
          aria-live="polite"
          aria-label="Meta de ahorro completada"
        >
          <div className="meta-celebracion__confeti" aria-hidden="true">
            {confetiPiezas.map((pieza) => (
              <span
                key={pieza.id}
                className={`meta-celebracion__pieza meta-celebracion__pieza--${pieza.forma}`}
                style={{
                  left: `${pieza.izquierda}%`,
                  animationDelay: `${pieza.retraso}s`,
                  animationDuration: `${pieza.duracion}s`,
                  transform: `rotate(${pieza.giro}deg)`,
                }}
              />
            ))}
          </div>

          <div className="meta-celebracion__mensaje">
            <span className="meta-celebracion__icono">🎉</span>
            <strong>¡Meta completada!</strong>
            <p>Lo lograste. Sigue construyendo tus objetivos.</p>
          </div>
        </div>
      ) : null}
      <section className="metas-resumen">
        <article>
          <span className="metas-resumen__icono">🎯</span>
          <strong>{resumen.enProgreso}</strong>
          <p>En progreso</p>
        </article>

        <article>
          <span className="metas-resumen__icono">✅</span>
          <strong>{resumen.completadas}</strong>
          <p>Completadas</p>
        </article>

        <article>
          <span className="metas-resumen__icono">💰</span>
          <strong className="metas-resumen__total">
            {moneda(resumen.totalAhorro)}
          </strong>
          <p>Total ahorro</p>
        </article>
      </section>

      {error && !mostrarNuevaMeta && !metaAbono ? (
        <div className="metas-error">{error}</div>
      ) : null}

      <section className="metas-lista">
        {cargando ? (
          <div className="metas-vacio">Cargando metas...</div>
        ) : metas.length === 0 ? (
          <div className="metas-vacio">Todavía no tienes metas de ahorro.</div>
        ) : (
          metas.map((meta) => {
            const completada = meta.estado === "completada";

            return (
              <article
                key={meta.id}
                className={`meta-card ${completada ? "meta-card--completada" : ""}`}
              >
                <div className="meta-card__encabezado">
                  <div className="meta-card__titulo">
                    <span>{meta.icono}</span>
                    <div>
                      <h2>{meta.nombre}</h2>
                      <p>
                        {completada
                          ? "✓ Logrado"
                          : fechaObjetivoTexto(meta.fechaObjetivo)}
                      </p>
                    </div>
                  </div>

                  {completada ? (
                    <span className="meta-card__lograda">🎉 ¡Lograda!</span>
                  ) : null}
                </div>

                <div className="meta-card__cantidades">
                  <strong style={{ color: meta.color }}>
                    {moneda(meta.ahorrado)}
                  </strong>
                  <span>/ {moneda(meta.montoObjetivo)}</span>
                </div>

                <div className="meta-card__barra">
                  <span
                    style={{
                      width: `${porcentajeLimitado(meta.porcentaje)}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>

                <div className="meta-card__detalle">
                  <span>{Math.round(meta.porcentaje)}% completado</span>
                  {!completada ? <span>Faltan {moneda(meta.faltante)}</span> : null}
                </div>

                {!completada ? (
                  <>
                    {metaAbono?.id === meta.id ? (
                      <form className="meta-abono" onSubmit={confirmarAbono}>
                        <div className="meta-abono__monto">
                          <span>$</span>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Cantidad a abonar"
                            value={montoAbono}
                            onChange={(evento) => {
                              setMontoAbono(evento.target.value);
                              setError("");
                            }}
                            required
                          />
                        </div>

                        <div className="meta-abono__rapidos">
                          {[500, 1000, 2500].map((cantidad) => (
                            <button
                              key={cantidad}
                              type="button"
                              onClick={() => {
                                setMontoAbono(String(cantidad));
                                setError("");
                              }}
                            >
                              {moneda(cantidad)}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              setMontoAbono(String(meta.faltante));
                              setError("");
                            }}
                          >
                            Todo
                          </button>
                        </div>

                        {error ? <div className="metas-error">{error}</div> : null}

                        <div className="meta-abono__acciones">
                          <button
                            type="submit"
                            className="primario"
                            disabled={procesando}
                          >
                            {procesando ? "Guardando..." : "Confirmar abono"}
                          </button>

                          <button
                            type="button"
                            className="secundario"
                            onClick={() => setMetaAbono(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="meta-card__abonar"
                        onClick={() => abrirAbono(meta)}
                      >
                        + Abonar a esta meta
                      </button>
                    )}
                  </>
                ) : null}
              </article>
            );
          })
        )}
      </section>

      {mostrarNuevaMeta ? (
        <form className="meta-nueva" onSubmit={guardarMeta}>
          <header>
            <Target size={18} />
            <h2>Nueva meta de ahorro</h2>
          </header>

          <label>Ícono</label>
          <div className="meta-nueva__iconos">
            {iconos.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className={icono === opcion ? "activo" : ""}
                onClick={() => {
                  setIcono(opcion);
                  setError("");
                }}
              >
                {opcion}
              </button>
            ))}
          </div>

          <label>
            Nombre de la meta *
            <div className="meta-nueva__input">
              <span>{icono}</span>
              <input
                name="nombre"
                value={nombre}
                onChange={(evento) => {
                  setNombre(evento.target.value);
                  setError("");
                }}
                placeholder="Ej: Vacaciones, Auto, Casa..."
                required
              />
            </div>
          </label>

          <label>
            Monto objetivo (MXN) *
            <div className="meta-nueva__input">
              <span>$</span>
              <input
                name="montoObjetivo"
                type="number"
                min="1"
                step="0.01"
                value={montoObjetivo}
                onChange={(evento) => {
                  setMontoObjetivo(evento.target.value);
                  setError("");
                }}
                placeholder="0"
                required
              />
            </div>
          </label>

          <label>
            Fecha límite (opcional)
            <input
              name="fechaObjetivo"
              type="date"
              value={fechaObjetivo}
              onChange={(evento) => {
                setFechaObjetivo(evento.target.value);
                setError("");
              }}
            />
          </label>

          <label>Color</label>
          <div className="meta-nueva__colores">
            {colores.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className={color === opcion ? "activo" : ""}
                style={{ backgroundColor: opcion }}
                onClick={() => {
                  setColor(opcion);
                  setError("");
                }}
                aria-label={`Elegir color ${opcion}`}
              >
                {color === opcion ? <Check size={18} /> : null}
              </button>
            ))}
          </div>

          {error ? <div className="metas-error">{error}</div> : null}

          <div className="meta-nueva__acciones">
            <button
              type="submit"
              className="primario"
              disabled={procesando}
            >
              {procesando ? "Creando..." : "Crear meta"}
            </button>

            <button
              type="button"
              className="secundario"
              onClick={() => setMostrarNuevaMeta(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="metas-nueva-boton"
          onClick={abrirNuevaMeta}
        >
          <Plus size={20} />
          Nueva meta de ahorro
        </button>
      )}
    </div>
  );
}