import {
  Bell,
  Check,
  CheckCheck,
  CircleDollarSign,
  Flame,
  Goal,
  Lightbulb,
  LoaderCircle,
  Medal,
  RefreshCw,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  eliminarNotificacion,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  type Notificacion,
  type ResumenNotificaciones,
  type TipoNotificacion,
} from "../../services/notificacionesService";

import "./PanelNotificaciones.css";

interface PanelNotificacionesProps {
  abierto: boolean;
  onCerrar: () => void;
}

type FiltroVisible = "todas" | "no_leidas";

const resumenVacio: ResumenNotificaciones = {
  total: 0,
  noLeidas: 0,
  leidas: 0,
};

function fechaRelativa(fecha: string): string {
  const valor = new Date(fecha);
  const minutos = Math.floor((Date.now() - valor.getTime()) / 60000);

  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `Hace ${dias} d`;

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(valor);
}

function IconoNotificacion({ tipo }: { tipo: TipoNotificacion }) {
  switch (tipo) {
    case "ingreso":
    case "gasto":
      return <CircleDollarSign size={18} />;
    case "presupuesto":
      return <WalletCards size={18} />;
    case "meta":
      return <Goal size={18} />;
    case "racha":
      return <Flame size={18} />;
    case "logro":
      return <Medal size={18} />;
    case "recordatorio":
      return <Bell size={18} />;
    case "consejo":
      return <Lightbulb size={18} />;
    default:
      return <Sparkles size={18} />;
  }
}

export default function PanelNotificaciones({
  abierto,
  onCerrar,
}: PanelNotificacionesProps) {
  const [filtro, setFiltro] = useState<FiltroVisible>("todas");
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [resumen, setResumen] = useState<ResumenNotificaciones>(resumenVacio);
  const [cargando, setCargando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function cargar(): Promise<void> {
    setCargando(true);
    setError("");

    try {
      const respuesta = await listarNotificaciones(filtro);
      setNotificaciones(respuesta.notificaciones);
      setResumen(respuesta.resumen);

      window.dispatchEvent(
        new CustomEvent("balance-digital:notificaciones-actualizadas", {
          detail: { noLeidas: respuesta.resumen.noLeidas },
        })
      );
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar tus notificaciones"
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (abierto) void cargar();
  }, [abierto, filtro]);

  async function marcarLeida(notificacion: Notificacion): Promise<void> {
    if (notificacion.leida) return;

    setProcesandoId(notificacion.id);
    try {
      await marcarNotificacionLeida(notificacion.id);
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo marcar la notificación"
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function marcarTodas(): Promise<void> {
    if (resumen.noLeidas === 0) return;

    setCargando(true);
    try {
      await marcarTodasLeidas();
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron marcar todas"
      );
    } finally {
      setCargando(false);
    }
  }

  async function eliminar(id: number): Promise<void> {
    setProcesandoId(id);
    try {
      await eliminarNotificacion(id);
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo eliminar la notificación"
      );
    } finally {
      setProcesandoId(null);
    }
  }

  if (!abierto) return null;

  return (
    <div
      className="bdn-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <aside className="bdn-panel" role="dialog" aria-modal="true">
        <header className="bdn-header">
          <div className="bdn-title">
            <Bell size={20} strokeWidth={1.9} />
            <h2>Notificaciones</h2>
            {resumen.noLeidas > 0 ? <span>{resumen.noLeidas}</span> : null}
          </div>

          <div className="bdn-header-actions">
            <button
              type="button"
              className="bdn-mark-all"
              onClick={() => void marcarTodas()}
              disabled={cargando || resumen.noLeidas === 0}
            >
              <CheckCheck size={15} />
              Marcar todas
            </button>

            <button type="button" className="bdn-close" onClick={onCerrar}>
              <X size={19} />
            </button>
          </div>
        </header>

        <nav className="bdn-tabs">
          <button
            type="button"
            className={filtro === "todas" ? "is-active" : ""}
            onClick={() => setFiltro("todas")}
          >
            Todas
          </button>
          <button
            type="button"
            className={filtro === "no_leidas" ? "is-active" : ""}
            onClick={() => setFiltro("no_leidas")}
          >
            Sin leer
          </button>
          <button
            type="button"
            className="bdn-refresh"
            onClick={() => void cargar()}
            aria-label="Actualizar"
          >
            <RefreshCw size={15} className={cargando ? "is-spinning" : ""} />
          </button>
        </nav>

        {error ? (
          <div className="bdn-error">
            <div>
              <strong>No pudimos cargar tus avisos</strong>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => void cargar()}>
              Reintentar
            </button>
          </div>
        ) : null}

        <div className="bdn-list">
          {cargando && notificaciones.length === 0 ? (
            <div className="bdn-empty">
              <LoaderCircle size={27} className="is-spinning" />
              <strong>Cargando notificaciones</strong>
              <span>Estamos preparando tus avisos.</span>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="bdn-empty">
              <div className="bdn-empty-icon"><Bell size={28} /></div>
              <strong>No hay notificaciones</strong>
              <span>Tus avisos importantes aparecerán aquí.</span>
            </div>
          ) : (
            notificaciones.map((notificacion) => (
              <article
                key={notificacion.id}
                className={`bdn-item bdn-item--${notificacion.tipo} ${
                  notificacion.leida ? "is-read" : "is-unread"
                }`}
              >
                <button
                  type="button"
                  className="bdn-item-main"
                  onClick={() => void marcarLeida(notificacion)}
                >
                  <span className="bdn-item-icon">
                    <IconoNotificacion tipo={notificacion.tipo} />
                  </span>

                  <span className="bdn-item-copy">
                    <span className="bdn-item-heading">
                      <strong>{notificacion.titulo}</strong>
                      {!notificacion.leida ? <i /> : null}
                    </span>
                    <span className="bdn-item-message">{notificacion.mensaje}</span>
                    <small>{fechaRelativa(notificacion.creadaEn)}</small>
                  </span>
                </button>

                <div className="bdn-item-actions">
                  {!notificacion.leida ? (
                    <button
                      type="button"
                      onClick={() => void marcarLeida(notificacion)}
                      disabled={procesandoId === notificacion.id}
                      aria-label="Marcar como leída"
                    >
                      <Check size={15} />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="is-delete"
                    onClick={() => void eliminar(notificacion.id)}
                    disabled={procesandoId === notificacion.id}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}