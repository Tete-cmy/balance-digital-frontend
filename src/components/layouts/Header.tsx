
import {
  Bell,
  ChevronDown,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { obtenerConfiguracion } from "../../services/configuracionService";
import { obtenerConteoNoLeidas } from "../../services/notificacionesService";

import "./Header.css";

const rutas: Record<
  string,
  {
    titulo: string;
    subtitulo: string;
  }
> = {
  "/dashboard": {
    titulo: "Dashboard",
    subtitulo:
      "Resumen general de tus finanzas",
  },
  "/movimientos": {
    titulo: "Movimientos",
    subtitulo:
      "Registro de transacciones",
  },
  "/presupuestos": {
    titulo: "Presupuestos",
    subtitulo:
      "Control y planificación de tus gastos",
  },
  "/metas": {
    titulo: "Metas de Ahorro",
    subtitulo:
      "Seguimiento de tus objetivos financieros",
  },
  "/reportes": {
    titulo: "Reportes",
    subtitulo:
      "Análisis detallado de tus finanzas",
  },
};

interface HeaderProps {
  onAbrirUsuario: () => void;
  onAbrirNotificaciones: () => void;
}

interface UsuarioActualizadoDetalle {
  nombre?: string;
}

interface NotificacionesActualizadasDetalle {
  noLeidas?: number;
}

export default function Header({
  onAbrirUsuario,
  onAbrirNotificaciones,
}: HeaderProps) {
  const { pathname } = useLocation();
  const { usuario } = useAuth();

  const nombreInicial =
    usuario?.nombre?.trim() ||
    usuario?.correo?.split("@")[0] ||
    "Usuario";

  const [nombreActual, setNombreActual] =
    useState(nombreInicial);
  const [noLeidas, setNoLeidas] =
    useState(0);

  const informacion =
    rutas[pathname] ?? rutas["/dashboard"];
  const inicial =
    nombreActual.charAt(0).toUpperCase() ||
    "U";

  useEffect(() => {
    const nombreDesdeContexto =
      usuario?.nombre?.trim() ||
      usuario?.correo?.split("@")[0] ||
      "Usuario";

    setNombreActual(nombreDesdeContexto);
  }, [usuario?.nombre, usuario?.correo]);

  useEffect(() => {
    let cancelado = false;

    async function cargarDatos(): Promise<void> {
      try {
        const [configuracion, conteo] =
          await Promise.all([
            obtenerConfiguracion(),
            obtenerConteoNoLeidas(),
          ]);

        if (cancelado) {
          return;
        }

        const nombreBaseDatos =
          configuracion.usuario.nombre.trim();

        if (nombreBaseDatos) {
          setNombreActual(
            nombreBaseDatos
          );
        }

        setNoLeidas(conteo);
      } catch (error) {
        console.error(
          "No se pudo actualizar el encabezado:",
          error
        );
      }
    }

    void cargarDatos();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    function actualizarNombre(
      evento: Event
    ): void {
      const detalle =
        (
          evento as CustomEvent<UsuarioActualizadoDetalle>
        ).detail;

      const nuevoNombre =
        detalle?.nombre?.trim();

      if (nuevoNombre) {
        setNombreActual(nuevoNombre);
      }
    }

    function actualizarNotificaciones(
      evento: Event
    ): void {
      const detalle =
        (
          evento as CustomEvent<NotificacionesActualizadasDetalle>
        ).detail;

      if (
        typeof detalle?.noLeidas ===
        "number"
      ) {
        setNoLeidas(detalle.noLeidas);
      }
    }

    window.addEventListener(
      "balance-digital:usuario-actualizado",
      actualizarNombre
    );
    window.addEventListener(
      "balance-digital:notificaciones-actualizadas",
      actualizarNotificaciones
    );

    return () => {
      window.removeEventListener(
        "balance-digital:usuario-actualizado",
        actualizarNombre
      );
      window.removeEventListener(
        "balance-digital:notificaciones-actualizadas",
        actualizarNotificaciones
      );
    };
  }, []);

  return (
    <header className="header">
      <div className="header__contenido">
        <div className="header__titulos">
          <h1>{informacion.titulo}</h1>
          <p>{informacion.subtitulo}</p>
        </div>

        <div className="header__acciones">
          <button
            type="button"
            className="header__notificaciones"
            aria-label={`Abrir notificaciones${
              noLeidas > 0
                ? `, ${noLeidas} sin leer`
                : ""
            }`}
            onClick={onAbrirNotificaciones}
          >
            <Bell
              size={21}
              strokeWidth={1.9}
            />

            {noLeidas > 0 ? (
              <span className="header__notificaciones-contador">
                {noLeidas > 99
                  ? "99+"
                  : noLeidas}
              </span>
            ) : null}
          </button>

          <div className="header__separador" />

          <button
            type="button"
            className="header__usuario"
            aria-label="Abrir panel de usuario"
            onClick={onAbrirUsuario}
          >
            <span className="header__avatar">
              {inicial}
            </span>
            <span className="header__nombre">
              {nombreActual}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={1.9}
            />
          </button>
        </div>
      </div>
    </header>
  );
}