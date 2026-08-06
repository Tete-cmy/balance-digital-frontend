import {
  BarChart3,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  Target,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./Sidebar.css";

interface SidebarProps {
  onAbrirConfiguracion: () => void;
}

const opcionesMenu = [
  {
    nombre: "Dashboard",
    ruta: "/dashboard",
    icono: LayoutDashboard,
  },
  {
    nombre: "Movimientos",
    ruta: "/movimientos",
    icono: ReceiptText,
  },
  {
    nombre: "Presupuestos",
    ruta: "/presupuestos",
    icono: CircleDollarSign,
  },
  {
    nombre: "Metas de Ahorro",
    ruta: "/metas",
    icono: Target,
  },
  {
    nombre: "Reportes",
    ruta: "/reportes",
    icono: BarChart3,
  },
];

function MarcaBalanceDigital() {
  return (
    <svg
      className="sidebar__marca-svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Balance Digital"
    >
      <path
        className="sidebar__marca-flecha"
        d="M16 39C24 36 30 31 36 25C40 21 44 17 50 13"
      />

      <path
        className="sidebar__marca-punta"
        d="M43 13H51V21"
      />

      <rect x="16" y="39" width="7" height="11" rx="1.8" />
      <rect x="27" y="33" width="7" height="17" rx="1.8" />
      <rect x="38" y="26" width="7" height="24" rx="1.8" />
      <rect x="49" y="18" width="7" height="32" rx="1.8" />
    </svg>
  );
}

export default function Sidebar({
  onAbrirConfiguracion,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cerrar } = useAuth();

  function estaActiva(ruta: string): boolean {
    return location.pathname === ruta;
  }

  function irA(ruta: string): void {
    navigate(ruta);
  }

  function cerrarSesion(): void {
    cerrar();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <div className="sidebar__logo">
          <MarcaBalanceDigital />
        </div>

        <div className="sidebar__marca-texto">
          <strong>Balance</strong>
          <span>Digital</span>
        </div>
      </div>

      <nav
        className="sidebar__navegacion"
        aria-label="Navegación principal"
      >
        {opcionesMenu.map((opcion) => {
          const Icono = opcion.icono;
          const activa = estaActiva(opcion.ruta);

          return (
            <button
              key={opcion.ruta}
              type="button"
              className={
                activa
                  ? "sidebar__opcion sidebar__opcion--activa"
                  : "sidebar__opcion"
              }
              aria-current={activa ? "page" : undefined}
              onClick={() => irA(opcion.ruta)}
            >
              <Icono size={20} strokeWidth={1.9} />
              <span>{opcion.nombre}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__pie">
        <button
          type="button"
          className="sidebar__opcion"
          onClick={onAbrirConfiguracion}
        >
          <Settings size={20} strokeWidth={1.9} />
          <span>Configuración</span>
        </button>

        <button
          type="button"
          className="sidebar__opcion sidebar__cerrar"
          onClick={cerrarSesion}
        >
          <LogOut size={20} strokeWidth={1.9} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}