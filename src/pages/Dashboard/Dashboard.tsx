
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Flame,
  LockKeyhole,
  Pencil,
  PiggyBank,
  RefreshCw,
  Shirt,
  Sparkles,
  Trophy,
  TrendingUp,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  obtenerDashboard,
  type DashboardData,
  type DashboardSerieMensual,
} from "../../services/dashboardService";
import {
  cambiarNombreMascota,
  desbloquearApariencia,
  equiparApariencia,
  obtenerGamificacion,
  type AparienciaGamificacion,
  type ResumenGamificacion,
} from "../../services/gamificacionService";
import {
  obtenerCierreMensual,
  type ResumenCierreMensual,
} from "../../services/cierreMensualService";

import "./Dashboard.css";
import "./FlammaPremiumWidget.css";
import "./FlammaCierreMensual.css";

const dashboardVacio: DashboardData = {
  resumen: {
    balanceTotal: 0,
    ingresosMes: 0,
    gastosMes: 0,
    ahorroMes: 0,
    porcentajeAhorro: 0,
    cantidadIngresos: 0,
    cantidadGastos: 0,
  },
  serieMensual: [],
  gastosPorCategoria: [],
  ultimosMovimientos: [],
};

const gamificacionVacia: ResumenGamificacion = {
  nombreMascota: "Flamma",
  xpTotal: 0,
  xpDisponible: 0,
  nivelActual: 1,
  xpNivelActual: 0,
  xpSiguienteNivel: 100,
  progresoNivelPorcentaje: 0,
  rachaActual: 0,
  mejorRacha: 0,
  ultimaActividadFecha: null,
  diasSemana: Array.from({ length: 7 }, (_, indice) => ({
    fecha: String(indice),
    activo: false,
  })),
  aparienciaActiva: null,
  apariencias: [],
  logros: [],
  logrosCompletados: 0,
  logrosTotales: 0,
  estadoAnimo: "TRANQUILO",
};

type PestanaFlamma = "mascota" | "ropa" | "logros";

function claseApariencia(codigo?: string): string {
  return `flamma-mascota--${(codigo ?? "ORIGINAL")
    .toLowerCase()
    .replace(/_/g, "-")}`;
}

function FlammaMascota({
  codigo,
  pequena = false,
}: {
  codigo?: string;
  pequena?: boolean;
}) {
  return (
    <div
      className={`flamma-mascota ${claseApariencia(
        codigo
      )} ${pequena ? "flamma-mascota--pequena" : ""}`}
      aria-hidden="true"
    >
      <span className="flamma-mascota__llama flamma-mascota__llama--uno" />
      <span className="flamma-mascota__llama flamma-mascota__llama--dos" />
      <span className="flamma-mascota__llama flamma-mascota__llama--tres" />

      <div className="flamma-mascota__cuerpo">
        <span className="flamma-mascota__ceja flamma-mascota__ceja--izq" />
        <span className="flamma-mascota__ceja flamma-mascota__ceja--der" />
        <span className="flamma-mascota__ojo flamma-mascota__ojo--izq">
          <i />
        </span>
        <span className="flamma-mascota__ojo flamma-mascota__ojo--der">
          <i />
        </span>
        <span className="flamma-mascota__mejilla flamma-mascota__mejilla--izq" />
        <span className="flamma-mascota__mejilla flamma-mascota__mejilla--der" />
        <span className="flamma-mascota__boca" />
      </div>

      <span className="flamma-mascota__brazo flamma-mascota__brazo--izq" />
      <span className="flamma-mascota__brazo flamma-mascota__brazo--der" />
      <span className="flamma-mascota__pie flamma-mascota__pie--izq" />
      <span className="flamma-mascota__pie flamma-mascota__pie--der" />
    </div>
  );
}


function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatoCompacto(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor);
}

function formatoFecha(fecha: string): string {
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

function pluralTransacciones(cantidad: number): string {
  return cantidad === 1 ? "1 transacción" : `${cantidad} transacciones`;
}

function crearPuntos(
  serie: DashboardSerieMensual[],
  propiedad: "ingresos" | "gastos",
  ancho = 600,
  alto = 220
): string {
  if (serie.length === 0) {
    return "";
  }

  const maximo = Math.max(
    1,
    ...serie.flatMap((registro) => [registro.ingresos, registro.gastos])
  );

  return serie
    .map((registro, indice) => {
      const x =
        serie.length === 1
          ? ancho / 2
          : (indice / (serie.length - 1)) * ancho;

      const valor = registro[propiedad];
      const y = alto - (valor / maximo) * (alto - 24);

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function crearPuntosCirculos(
  serie: DashboardSerieMensual[],
  propiedad: "ingresos" | "gastos",
  ancho = 600,
  alto = 220
) {
  if (serie.length === 0) {
    return [];
  }

  const maximo = Math.max(
    1,
    ...serie.flatMap((registro) => [registro.ingresos, registro.gastos])
  );

  return serie.map((registro, indice) => {
    const x =
      serie.length === 1
        ? ancho / 2
        : (indice / (serie.length - 1)) * ancho;

    const y = alto - (registro[propiedad] / maximo) * (alto - 24);

    return {
      x,
      y,
      id: `${registro.periodo}-${propiedad}`,
    };
  });
}



function FlammaMiniPremium({
  codigo,
}: {
  codigo?: string;
}) {
  const variante = (
    codigo ?? "ORIGINAL"
  ).toUpperCase();

  const paletas: Record<
    string,
    {
      principal: string;
      secundario: string;
      sombra: string;
      brillo: string;
    }
  > = {
    ORIGINAL: {
      principal: "#ff6a3d",
      secundario: "#ff9f3a",
      sombra: "#e64d2f",
      brillo: "#ffd34d",
    },
    COOL_BLUE: {
      principal: "#4c7cff",
      secundario: "#7eb9ff",
      sombra: "#3559d8",
      brillo: "#d7edff",
    },
    NATURALEZA: {
      principal: "#4cc98b",
      secundario: "#83dfa9",
      sombra: "#2b9f68",
      brillo: "#e7ff9e",
    },
    OCEANO: {
      principal: "#23abc9",
      secundario: "#67d8e7",
      sombra: "#0d7f9c",
      brillo: "#d5fbff",
    },
    SAKURA: {
      principal: "#ef63aa",
      secundario: "#ff9acb",
      sombra: "#c83f82",
      brillo: "#ffe0ef",
    },
    LAVA: {
      principal: "#ef4f3b",
      secundario: "#ff8b35",
      sombra: "#ba3428",
      brillo: "#ffd948",
    },
    AURORA: {
      principal: "#7768e8",
      secundario: "#62d7c6",
      sombra: "#5146b7",
      brillo: "#ddfff9",
    },
    GALAXIA: {
      principal: "#6950c8",
      secundario: "#d965d8",
      sombra: "#452d92",
      brillo: "#ffe5ff",
    },
  };

  const paleta =
    paletas[variante] ?? paletas.ORIGINAL;

  return (
    <svg
      className="bd-flamma-float__svg"
      viewBox="0 0 120 126"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`cute-body-${variante}`}
          x1="26"
          y1="32"
          x2="91"
          y2="107"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={paleta.secundario} />
          <stop offset="0.58" stopColor={paleta.principal} />
          <stop offset="1" stopColor={paleta.sombra} />
        </linearGradient>

        <linearGradient
          id={`cute-flame-${variante}`}
          x1="51"
          y1="6"
          x2="72"
          y2="37"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={paleta.brillo} />
          <stop offset="1" stopColor={paleta.secundario} />
        </linearGradient>

        <filter
          id={`cute-shadow-${variante}`}
          x="-35%"
          y="-25%"
          width="170%"
          height="170%"
        >
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="5"
            floodColor="#1e4a37"
            floodOpacity="0.16"
          />
        </filter>
      </defs>

      <g filter={`url(#cute-shadow-${variante})`}>
        <path
          d="M59.5 6.8C62.4 13.7 66.4 17.3 72.4 16.7C71.4 22.4 73.8 27 78.9 30.7C73.4 33.7 69.5 36.6 67.7 41.4H49.7C48.7 36.6 45.9 33.2 40.5 30.7C45.7 27.3 48.6 22.7 48.5 17.1C53.8 18.8 57.3 15.1 59.5 6.8Z"
          fill={`url(#cute-flame-${variante})`}
        />

        <ellipse
          cx="59.5"
          cy="72"
          rx="35.5"
          ry="36.5"
          fill={`url(#cute-body-${variante})`}
        />

        <circle
          cx="34.8"
          cy="72.5"
          r="9.6"
          fill={paleta.principal}
        />
        <circle
          cx="84.2"
          cy="72.5"
          r="9.6"
          fill={paleta.principal}
        />

        <ellipse
          cx="48"
          cy="67"
          rx="9.7"
          ry="12"
          fill="#ffffff"
        />
        <ellipse
          cx="71"
          cy="67"
          rx="9.7"
          ry="12"
          fill="#ffffff"
        />

        <ellipse
          cx="50.2"
          cy="68"
          rx="4.8"
          ry="6.4"
          fill="#26343d"
        />
        <ellipse
          cx="68.8"
          cy="68"
          rx="4.8"
          ry="6.4"
          fill="#26343d"
        />

        <circle cx="52" cy="65.3" r="1.7" fill="#ffffff" />
        <circle cx="70.6" cy="65.3" r="1.7" fill="#ffffff" />

        <path
          d="M51.4 81.5C54.1 85.3 57.1 87 59.5 87C61.9 87 64.9 85.3 67.6 81.5"
          fill="none"
          stroke="#8f382d"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        <ellipse
          cx="40.8"
          cy="79"
          rx="5.2"
          ry="2.8"
          fill="#ffb9a3"
          fillOpacity="0.88"
        />
        <ellipse
          cx="78.2"
          cy="79"
          rx="5.2"
          ry="2.8"
          fill="#ffb9a3"
          fillOpacity="0.88"
        />

        <ellipse
          cx="45"
          cy="105"
          rx="11"
          ry="5.8"
          fill={paleta.principal}
        />
        <ellipse
          cx="74"
          cy="105"
          rx="11"
          ry="5.8"
          fill={paleta.principal}
        />
      </g>
    </svg>
  );
}

interface PosicionFlamma {
  x: number;
  y: number;
}

interface ArrastreFlamma {
  pointerId: number;
  inicioX: number;
  inicioY: number;
  origenX: number;
  origenY: number;
  seMovio: boolean;
}

const CLAVE_POSICION_FLAMMA =
  "balance_digital_posicion_flamma";

function limitar(
  valor: number,
  minimo: number,
  maximo: number
): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

function obtenerPosicionInicialFlamma(): PosicionFlamma {
  const anchoMascota = 86;
  const altoMascota = 108;
  const margen = 18;

  try {
    const guardada = localStorage.getItem(
      CLAVE_POSICION_FLAMMA
    );

    if (guardada) {
      const posicion = JSON.parse(
        guardada
      ) as Partial<PosicionFlamma>;

      if (
        typeof posicion.x === "number" &&
        typeof posicion.y === "number"
      ) {
        return {
          x: limitar(
            posicion.x,
            margen,
            Math.max(
              margen,
              window.innerWidth -
                anchoMascota -
                margen
            )
          ),
          y: limitar(
            posicion.y,
            margen,
            Math.max(
              margen,
              window.innerHeight -
                altoMascota -
                margen
            )
          ),
        };
      }
    }
  } catch {
    localStorage.removeItem(
      CLAVE_POSICION_FLAMMA
    );
  }

  return {
    x: Math.max(
      margen,
      window.innerWidth - anchoMascota - 28
    ),
    y: Math.max(
      margen,
      window.innerHeight - altoMascota - 28
    ),
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData>(dashboardVacio);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [gamificacion, setGamificacion] =
    useState<ResumenGamificacion>(gamificacionVacia);
  const [cargandoGamificacion, setCargandoGamificacion] =
    useState(false);
  const [errorGamificacion, setErrorGamificacion] =
    useState("");
  const [cierreMensual, setCierreMensual] =
    useState<ResumenCierreMensual | null>(null);
  const [cargandoCierreMensual, setCargandoCierreMensual] =
    useState(false);
  const [errorCierreMensual, setErrorCierreMensual] =
    useState("");
  const [modalFlammaAbierto, setModalFlammaAbierto] =
    useState(false);
  const [pestanaFlamma, setPestanaFlamma] =
    useState<PestanaFlamma>("mascota");
  const [editandoNombre, setEditandoNombre] =
    useState(false);
  const [nombreTemporal, setNombreTemporal] =
    useState("Flamma");
  const [filtroRopa, setFiltroRopa] =
    useState<string>("TODOS");
  const [procesandoApariencia, setProcesandoApariencia] =
    useState<number | null>(null);

  const [posicionFlamma, setPosicionFlamma] =
    useState<PosicionFlamma>(
      obtenerPosicionInicialFlamma
    );
  const [arrastrandoFlamma, setArrastrandoFlamma] =
    useState(false);
  const arrastreFlammaRef =
    useRef<ArrastreFlamma | null>(null);

  async function cargarDashboard() {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerDashboard();
      setDashboard(datos);
    } catch (errorDesconocido) {
      const mensaje =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar el Dashboard";

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  async function cargarGamificacion() {
    setCargandoGamificacion(true);
    setErrorGamificacion("");

    try {
      const datos = await obtenerGamificacion();
      setGamificacion(datos);
      setNombreTemporal(datos.nombreMascota);
    } catch (errorDesconocido) {
      setErrorGamificacion(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar Flamma"
      );
    } finally {
      setCargandoGamificacion(false);
    }
  }

  async function cargarCierreMensual() {
    setCargandoCierreMensual(true);
    setErrorCierreMensual("");

    try {
      const datos = await obtenerCierreMensual();
      setCierreMensual(datos);

      if (
        datos.ultimoCierre.xpGanada > 0 ||
        datos.ultimoCierre.logrosDesbloqueados.length > 0
      ) {
        await cargarGamificacion();
      }
    } catch (errorDesconocido) {
      setErrorCierreMensual(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar el cierre mensual"
      );
    } finally {
      setCargandoCierreMensual(false);
    }
  }

  async function guardarNombreMascota() {
    const nombre = nombreTemporal.trim();

    if (nombre.length < 2) {
      setErrorGamificacion(
        "El nombre debe tener al menos 2 caracteres"
      );
      return;
    }

    try {
      const resumen = await cambiarNombreMascota(nombre);
      setGamificacion(resumen);
      setEditandoNombre(false);
      setErrorGamificacion("");
    } catch (errorDesconocido) {
      setErrorGamificacion(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cambiar el nombre"
      );
    }
  }

  async function manejarApariencia(
    apariencia: AparienciaGamificacion
  ) {
    setProcesandoApariencia(apariencia.id);
    setErrorGamificacion("");

    try {
      const resumen = apariencia.desbloqueada
        ? await equiparApariencia(apariencia.id)
        : await desbloquearApariencia(apariencia.id);

      setGamificacion(resumen);
    } catch (errorDesconocido) {
      setErrorGamificacion(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo actualizar la apariencia"
      );
    } finally {
      setProcesandoApariencia(null);
    }
  }

  function iniciarArrastreFlamma(
    evento: ReactPointerEvent<HTMLButtonElement>
  ): void {
    if (evento.button !== 0) {
      return;
    }

    evento.currentTarget.setPointerCapture(
      evento.pointerId
    );

    arrastreFlammaRef.current = {
      pointerId: evento.pointerId,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      origenX: posicionFlamma.x,
      origenY: posicionFlamma.y,
      seMovio: false,
    };

    setArrastrandoFlamma(true);
  }

  function moverFlamma(
    evento: ReactPointerEvent<HTMLButtonElement>
  ): void {
    const arrastre = arrastreFlammaRef.current;

    if (
      !arrastre ||
      arrastre.pointerId !== evento.pointerId
    ) {
      return;
    }

    const desplazamientoX =
      evento.clientX - arrastre.inicioX;
    const desplazamientoY =
      evento.clientY - arrastre.inicioY;

    if (
      Math.abs(desplazamientoX) > 5 ||
      Math.abs(desplazamientoY) > 5
    ) {
      arrastre.seMovio = true;
    }

    const anchoMascota = 86;
    const altoMascota = 108;
    const margen = 10;

    setPosicionFlamma({
      x: limitar(
        arrastre.origenX + desplazamientoX,
        margen,
        Math.max(
          margen,
          window.innerWidth -
            anchoMascota -
            margen
        )
      ),
      y: limitar(
        arrastre.origenY + desplazamientoY,
        margen,
        Math.max(
          margen,
          window.innerHeight -
            altoMascota -
            margen
        )
      ),
    });
  }

  function finalizarArrastreFlamma(
    evento: ReactPointerEvent<HTMLButtonElement>
  ): void {
    const arrastre = arrastreFlammaRef.current;

    if (
      !arrastre ||
      arrastre.pointerId !== evento.pointerId
    ) {
      return;
    }

    if (
      evento.currentTarget.hasPointerCapture(
        evento.pointerId
      )
    ) {
      evento.currentTarget.releasePointerCapture(
        evento.pointerId
      );
    }

    localStorage.setItem(
      CLAVE_POSICION_FLAMMA,
      JSON.stringify(posicionFlamma)
    );

    if (!arrastre.seMovio) {
      setModalFlammaAbierto(true);
      setPestanaFlamma("mascota");
    }

    arrastreFlammaRef.current = null;
    setArrastrandoFlamma(false);
  }

  function cancelarArrastreFlamma(): void {
    arrastreFlammaRef.current = null;
    setArrastrandoFlamma(false);
  }

  useEffect(() => {
    function ajustarPosicion(): void {
      const anchoMascota = 86;
      const altoMascota = 108;
      const margen = 10;

      setPosicionFlamma((actual) => ({
        x: limitar(
          actual.x,
          margen,
          Math.max(
            margen,
            window.innerWidth -
              anchoMascota -
              margen
          )
        ),
        y: limitar(
          actual.y,
          margen,
          Math.max(
            margen,
            window.innerHeight -
              altoMascota -
              margen
          )
        ),
      }));
    }

    window.addEventListener(
      "resize",
      ajustarPosicion
    );

    return () => {
      window.removeEventListener(
        "resize",
        ajustarPosicion
      );
    };
  }, []);

  useEffect(() => {
    void cargarDashboard();
    void cargarGamificacion();
    void cargarCierreMensual();
  }, []);

  const puntosIngresos = useMemo(
    () => crearPuntos(dashboard.serieMensual, "ingresos"),
    [dashboard.serieMensual]
  );

  const puntosGastos = useMemo(
    () => crearPuntos(dashboard.serieMensual, "gastos"),
    [dashboard.serieMensual]
  );

  const circulosIngresos = useMemo(
    () => crearPuntosCirculos(dashboard.serieMensual, "ingresos"),
    [dashboard.serieMensual]
  );

  const circulosGastos = useMemo(
    () => crearPuntosCirculos(dashboard.serieMensual, "gastos"),
    [dashboard.serieMensual]
  );

  const puntosRelleno = puntosIngresos
    ? `${puntosIngresos} 600,220 0,220`
    : "";

  const escalaMaxima = Math.max(
    0,
    ...dashboard.serieMensual.flatMap((registro) => [
      registro.ingresos,
      registro.gastos,
    ])
  );

  const escala = [1, 0.75, 0.5, 0.25, 0].map((factor) =>
    formatoCompacto(escalaMaxima * factor)
  );

  if (cargando) {
    return (
      <div className="dashboard">
        <section className="dashboard-panel">
          <div style={{ minHeight: 360, display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <RefreshCw
                size={28}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <p>Cargando información financiera...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <section className="dashboard-panel">
          <div style={{ minHeight: 360, display: "grid", placeItems: "center" }}>
            <div style={{ maxWidth: 420, textAlign: "center" }}>
              <h2>No se pudo cargar el Dashboard</h2>
              <p>{error}</p>
              <button type="button" onClick={() => void cargarDashboard()}>
                Intentar de nuevo
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { resumen } = dashboard;
  const balancePositivo = resumen.balanceTotal >= 0;
  const ahorroPositivo = resumen.ahorroMes >= 0;

  const aparienciasFiltradas =
    filtroRopa === "TODOS"
      ? gamificacion.apariencias
      : gamificacion.apariencias.filter(
          (apariencia) =>
            apariencia.categoria === filtroRopa
        );

  const estadoMascota = {
    FELIZ: "¡Feliz!",
    MOTIVADO: "¡Motivado!",
    TRANQUILO: "Tranquilo",
    TRISTE: "Necesita actividad",
  }[gamificacion.estadoAnimo];

  return (
    <div className="dashboard">
      <section className="dashboard__resumen">
        <article className="resumen-card resumen-card--balance">
          <span className="resumen-card__etiqueta">Balance total</span>

          <strong>{formatoMoneda(resumen.balanceTotal)}</strong>

          <span
            className={
              balancePositivo
                ? "resumen-card__detalle resumen-card__detalle--positivo"
                : "resumen-card__detalle resumen-card__detalle--negativo"
            }
          >
            <TrendingUp size={14} />
            {balancePositivo ? "+saldo a favor" : "saldo negativo"}
          </span>
        </article>

        <article className="resumen-card resumen-card--ingresos">
          <span className="resumen-card__etiqueta">Ingresos del mes</span>

          <strong>{formatoMoneda(resumen.ingresosMes)}</strong>

          <span className="resumen-card__detalle resumen-card__detalle--positivo">
            <ArrowUpRight size={14} />
            {pluralTransacciones(resumen.cantidadIngresos)}
          </span>
        </article>

        <article className="resumen-card resumen-card--gastos">
          <span className="resumen-card__etiqueta">Gastos del mes</span>

          <strong>{formatoMoneda(resumen.gastosMes)}</strong>

          <span className="resumen-card__detalle resumen-card__detalle--negativo">
            <ArrowDownRight size={14} />
            {pluralTransacciones(resumen.cantidadGastos)}
          </span>
        </article>

        <article className="resumen-card resumen-card--ahorro">
          <span className="resumen-card__etiqueta">Ahorro del mes</span>

          <strong>{formatoMoneda(resumen.ahorroMes)}</strong>

          <span
            className={
              ahorroPositivo
                ? "resumen-card__detalle resumen-card__detalle--positivo"
                : "resumen-card__detalle resumen-card__detalle--negativo"
            }
          >
            <PiggyBank size={14} />
            {resumen.porcentajeAhorro}% de ingresos
          </span>
        </article>
      </section>

      <section className="dashboard__graficas">
        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div>
              <h2>Ingresos vs Gastos</h2>
              <p>Últimos 6 meses</p>
            </div>
          </header>

          <div className="grafica-lineas">
            <div className="grafica-lineas__escala">
              {escala.map((valor, indice) => (
                <span key={`${valor}-${indice}`}>{valor}</span>
              ))}
            </div>

            <div className="grafica-lineas__area">
              <div className="grafica-lineas__lineas">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              {dashboard.serieMensual.length > 0 ? (
                <svg
                  className="grafica-lineas__svg"
                  viewBox="0 0 600 220"
                  preserveAspectRatio="none"
                >
                  <polygon
                    className="grafica-lineas__relleno"
                    points={puntosRelleno}
                  />

                  <polyline
                    className="grafica-lineas__ingresos"
                    points={puntosIngresos}
                  />

                  <polyline
                    className="grafica-lineas__gastos"
                    points={puntosGastos}
                  />

                  <g className="grafica-lineas__puntos grafica-lineas__puntos--ingresos">
                    {circulosIngresos.map((punto) => (
                      <circle
                        key={punto.id}
                        cx={punto.x}
                        cy={punto.y}
                        r="4"
                      />
                    ))}
                  </g>

                  <g className="grafica-lineas__puntos grafica-lineas__puntos--gastos">
                    {circulosGastos.map((punto) => (
                      <circle
                        key={punto.id}
                        cx={punto.x}
                        cy={punto.y}
                        r="4"
                      />
                    ))}
                  </g>
                </svg>
              ) : null}

              <div className="grafica-lineas__meses">
                {dashboard.serieMensual.map((registro) => (
                  <span key={registro.periodo}>{registro.mes}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grafica-lineas__leyenda">
            <span>
              <i className="leyenda-verde" />
              Ingresos
            </span>

            <span>
              <i className="leyenda-roja" />
              Gastos
            </span>
          </div>
        </article>

        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div>
              <h2>Gasto por Categoría</h2>
              <p>Mes actual</p>
            </div>
          </header>

          <div className="categorias-gastos">
            {dashboard.gastosPorCategoria.length === 0 ? (
              <p>No hay gastos registrados este mes.</p>
            ) : (
              dashboard.gastosPorCategoria.map((categoria) => (
                <div key={categoria.categoria} className="categoria-gasto">
                  <span className="categoria-gasto__nombre">
                    {categoria.categoria}
                  </span>

                  <div className="categoria-gasto__barra">
                    <span
                      className="categoria-gasto__progreso"
                      style={{
                        width: `${categoria.porcentaje}%`,
                        backgroundColor: categoria.color,
                      }}
                    />
                  </div>

                  <strong>{formatoCompacto(categoria.total)}</strong>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-panel dashboard-movimientos">
        <header className="dashboard-panel__header dashboard-movimientos__header">
          <h2>Últimos Movimientos</h2>

          <button type="button" onClick={() => navigate("/movimientos")}>
            Ver todos
            <ArrowUpRight size={15} />
          </button>
        </header>

        <div className="dashboard-movimientos__lista">
          {dashboard.ultimosMovimientos.length === 0 ? (
            <div style={{ padding: "22px", textAlign: "center" }}>
              Todavía no hay movimientos registrados.
            </div>
          ) : (
            dashboard.ultimosMovimientos.map((movimiento) => (
              <article key={movimiento.id} className="movimiento-item">
                <div
                  className={
                    movimiento.tipo === "ingreso"
                      ? "movimiento-item__icono movimiento-item__icono--ingreso"
                      : "movimiento-item__icono movimiento-item__icono--gasto"
                  }
                >
                  {movimiento.tipo === "ingreso" ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                </div>

                <div className="movimiento-item__datos">
                  <strong>{movimiento.descripcion}</strong>
                  <span>{formatoFecha(movimiento.fecha)}</span>
                </div>

                <strong
                  className={
                    movimiento.tipo === "ingreso"
                      ? "movimiento-item__monto movimiento-item__monto--ingreso"
                      : "movimiento-item__monto movimiento-item__monto--gasto"
                  }
                >
                  {movimiento.tipo === "ingreso" ? "+" : "-"}
                  {formatoMoneda(movimiento.monto)}
                </strong>
              </article>
            ))
          )}
        </div>
      </section>

      <footer className="dashboard-footer">
        © 2026 Balance Digital · Contacto · Ayuda · Términos y Condiciones
      </footer>

      <button
        type="button"
        className={`bd-flamma-float ${
          arrastrandoFlamma
            ? "bd-flamma-float--dragging"
            : ""
        }`}
        aria-label={`Mover o abrir a ${gamificacion.nombreMascota}`}
        title="Arrastra para mover · Pulsa para abrir"
        style={{
          left: `${posicionFlamma.x}px`,
          top: `${posicionFlamma.y}px`,
        }}
        onPointerDown={iniciarArrastreFlamma}
        onPointerMove={moverFlamma}
        onPointerUp={finalizarArrastreFlamma}
        onPointerCancel={cancelarArrastreFlamma}
        onContextMenu={(evento) =>
          evento.preventDefault()
        }
      >
        <span className="bd-flamma-float__streak">
          <Flame size={12} />
          {gamificacion.rachaActual}d
        </span>

        <span className="bd-flamma-float__character">
          <FlammaMiniPremium
            codigo={
              gamificacion.aparienciaActiva?.codigo
            }
          />
        </span>

        <span className="bd-flamma-float__label">
          {gamificacion.nombreMascota}
          <span>·</span>
          Nvl.{gamificacion.nivelActual}
        </span>
      </button>

      {modalFlammaAbierto && (
        <div
          className="flamma-modal__fondo"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              setModalFlammaAbierto(false);
            }
          }}
        >
          <section
            className="flamma-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Flamma"
          >
            <header className="flamma-modal__header">
              <div className="flamma-modal__titulo">
                <Flame size={18} />

                {editandoNombre ? (
                  <div className="flamma-modal__nombre-edicion">
                    <input
                      value={nombreTemporal}
                      maxLength={40}
                      autoFocus
                      onChange={(evento) =>
                        setNombreTemporal(
                          evento.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void guardarNombreMascota()
                      }
                    >
                      <Check size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <strong>
                      {gamificacion.nombreMascota}
                    </strong>

                    <button
                      type="button"
                      className="flamma-modal__editar"
                      onClick={() => {
                        setNombreTemporal(
                          gamificacion.nombreMascota
                        );
                        setEditandoNombre(true);
                      }}
                      aria-label="Editar nombre"
                    >
                      <Pencil size={14} />
                    </button>
                  </>
                )}

                <span className="flamma-modal__nivel">
                  Nvl.{gamificacion.nivelActual}
                </span>
              </div>

              <button
                type="button"
                className="flamma-modal__cerrar"
                onClick={() =>
                  setModalFlammaAbierto(false)
                }
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </header>

            <nav className="flamma-modal__tabs">
              <button
                type="button"
                className={
                  pestanaFlamma === "mascota"
                    ? "activo"
                    : ""
                }
                onClick={() =>
                  setPestanaFlamma("mascota")
                }
              >
                <Flame size={15} />
                Mascota
              </button>

              <button
                type="button"
                className={
                  pestanaFlamma === "ropa"
                    ? "activo"
                    : ""
                }
                onClick={() =>
                  setPestanaFlamma("ropa")
                }
              >
                <Shirt size={15} />
                Ropa
              </button>

              <button
                type="button"
                className={
                  pestanaFlamma === "logros"
                    ? "activo"
                    : ""
                }
                onClick={() =>
                  setPestanaFlamma("logros")
                }
              >
                <Trophy size={15} />
                Logros
              </button>
            </nav>

            <div className="flamma-modal__contenido">
              {cargandoGamificacion ? (
                <div className="flamma-modal__cargando">
                  <RefreshCw size={24} />
                  Cargando a Flamma...
                </div>
              ) : (
                <>
                  {errorGamificacion && (
                    <div className="flamma-modal__error">
                      {errorGamificacion}
                    </div>
                  )}

                  {pestanaFlamma === "mascota" && (
                    <div className="flamma-mascota-tab">
                      <div className="flamma-mascota-tab__escenario">
                        <span className="flamma-mascota-tab__racha">
                          <Flame size={14} />
                          {gamificacion.rachaActual}
                        </span>

                        <FlammaMascota
                          codigo={
                            gamificacion.aparienciaActiva
                              ?.codigo
                          }
                        />
                      </div>

                      <span className="flamma-mascota-tab__humor">
                        <span>😊</span>
                        {estadoMascota}
                      </span>

                      <section className="flamma-progreso">
                        <div className="flamma-progreso__encabezado">
                          <strong>
                            Nivel {gamificacion.nivelActual}
                            {" → "}
                            {gamificacion.nivelActual + 1}
                          </strong>
                          <span>
                            {gamificacion.xpNivelActual}/
                            {gamificacion.xpSiguienteNivel} XP
                          </span>
                        </div>

                        <div className="flamma-progreso__barra">
                          <span
                            style={{
                              width: `${gamificacion.progresoNivelPorcentaje}%`,
                            }}
                          />
                        </div>

                        <small>
                          {Math.max(
                            0,
                            gamificacion.xpSiguienteNivel -
                              gamificacion.xpNivelActual
                          )}{" "}
                          XP para el siguiente nivel
                        </small>
                      </section>

                      <div className="flamma-estadisticas">
                        <article>
                          <strong>
                            {gamificacion.rachaActual}
                            <Flame size={15} />
                          </strong>
                          <span>Racha</span>
                        </article>

                        <article>
                          <strong>
                            {gamificacion.xpDisponible}
                            <Sparkles size={15} />
                          </strong>
                          <span>XP disponibles</span>
                        </article>

                        <article>
                          <strong>
                            {gamificacion.logrosCompletados}/
                            {gamificacion.logrosTotales}
                            <Trophy size={15} />
                          </strong>
                          <span>Logros</span>
                        </article>
                      </div>

                      <section className="flamma-racha">
                        <header>
                          <strong>
                            <Flame size={15} />
                            Racha {gamificacion.rachaActual}/7
                            días
                          </strong>
                        </header>

                        <div className="flamma-racha__dias">
                          {gamificacion.diasSemana.map(
                            (dia) => (
                              <span
                                key={dia.fecha}
                                className={
                                  dia.activo ? "activo" : ""
                                }
                              />
                            )
                          )}
                        </div>

                        <p>
                          Inicia sesión cada día para mantener
                          viva tu racha.
                        </p>
                      </section>

                      <section className="flamma-cierre-mensual">
                        <header className="flamma-cierre-mensual__header">
                          <div>
                            <PiggyBank size={16} />
                            <strong>
                              Balance de ahorro mensual
                            </strong>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void cargarCierreMensual()
                            }
                            disabled={cargandoCierreMensual}
                            aria-label="Actualizar cierre mensual"
                          >
                            <RefreshCw
                              size={14}
                              className={
                                cargandoCierreMensual
                                  ? "girando"
                                  : ""
                              }
                            />
                          </button>
                        </header>

                        {cargandoCierreMensual && !cierreMensual ? (
                          <p className="flamma-cierre-mensual__estado">
                            Calculando tu ahorro mensual…
                          </p>
                        ) : errorCierreMensual ? (
                          <p className="flamma-cierre-mensual__error">
                            {errorCierreMensual}
                          </p>
                        ) : cierreMensual ? (
                          <>
                            <div className="flamma-cierre-mensual__resultado">
                              <span>
                                Ahorro provisional de este mes
                              </span>
                              <strong
                                className={`flamma-cierre-mensual__monto flamma-cierre-mensual__monto--${cierreMensual.vistaPrevia.resultadoProvisional.toLowerCase()}`}
                              >
                                {formatoMoneda(
                                  cierreMensual.vistaPrevia.ahorroNeto
                                )}
                              </strong>
                              <small>
                                Ingresos {formatoMoneda(cierreMensual.vistaPrevia.totalIngresos)}
                                {" · "}
                                Gastos {formatoMoneda(cierreMensual.vistaPrevia.totalGastos)}
                              </small>
                            </div>

                            {cierreMensual.historial[0] ? (
                              <div className="flamma-cierre-mensual__ultimo">
                                <span>
                                  Último mes cerrado
                                </span>
                                <strong>
                                  {cierreMensual.historial[0].resultado === "AHORRO"
                                    ? "✅ Ahorraste "
                                    : cierreMensual.historial[0].resultado === "DEFICIT"
                                      ? "⚠️ Déficit de "
                                      : "➖ Sin ahorro: "}
                                  {formatoMoneda(
                                    Math.abs(
                                      cierreMensual.historial[0].ahorroNeto
                                    )
                                  )}
                                </strong>
                              </div>
                            ) : null}

                            {cierreMensual.ultimoCierre.logrosDesbloqueados.length > 0 ? (
                              <div className="flamma-cierre-mensual__logros">
                                <span>
                                  🎉 Nuevo logro desbloqueado
                                </span>
                                {cierreMensual.ultimoCierre.logrosDesbloqueados.map(
                                  (logro) => (
                                    <strong key={logro.codigo}>
                                      {logro.nombre}
                                      <small>
                                        +{logro.xpRecompensa} XP
                                      </small>
                                    </strong>
                                  )
                                )}
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </section>

                      <section className="flamma-ayuda">
                        <strong className="flamma-ayuda__titulo">
                          ¿Cuándo cambia el humor de Flamma?
                        </strong>

                        <div className="flamma-ayuda__lista">
                          <article>
                            <span
                              className="flamma-ayuda__emoji"
                              aria-hidden="true"
                            >
                              😊
                            </span>

                            <p>
                              <b>Feliz</b>
                              <span>
                                Al cerrar un mes con ahorro positivo
                              </span>
                            </p>
                          </article>

                          <article>
                            <span
                              className="flamma-ayuda__emoji"
                              aria-hidden="true"
                            >
                              😢
                            </span>

                            <p>
                              <b>Triste</b>
                              <span>
                                Al cerrar un mes con gastos mayores
                                que tus ingresos
                              </span>
                            </p>
                          </article>

                          <article>
                            <span
                              className="flamma-ayuda__emoji"
                              aria-hidden="true"
                            >
                              🤩
                            </span>

                            <p>
                              <b>¡Metas!</b>
                              <span>
                                Al completar una meta de ahorro
                              </span>
                            </p>
                          </article>

                          <article>
                            <span
                              className="flamma-ayuda__emoji"
                              aria-hidden="true"
                            >
                              🎉
                            </span>

                            <p>
                              <b>¡Celebra!</b>
                              <span>
                                Al desbloquear un logro mensual o
                                insignia
                              </span>
                            </p>
                          </article>
                        </div>
                      </section>
                    </div>
                  )}

                  {pestanaFlamma === "ropa" && (
                    <div className="flamma-ropa-tab">
                      <header className="flamma-seccion-titulo">
                        <div>
                          <Shirt size={17} />
                          <strong>
                            Guardarropa de Flamma
                          </strong>
                        </div>
                        <span>
                          {gamificacion.xpDisponible} XP
                          disponibles
                        </span>
                      </header>

                      <div className="flamma-filtros">
                        {[
                          "TODOS",
                          "GRATIS",
                          "BRONCE",
                          "PLATA",
                          "ORO",
                          "PLATINO",
                          "DIAMANTE",
                        ].map((filtro) => (
                          <button
                            key={filtro}
                            type="button"
                            className={
                              filtroRopa === filtro
                                ? "activo"
                                : ""
                            }
                            onClick={() =>
                              setFiltroRopa(filtro)
                            }
                          >
                            {filtro === "TODOS"
                              ? "Todos"
                              : filtro.charAt(0) +
                                filtro
                                  .slice(1)
                                  .toLowerCase()}
                          </button>
                        ))}
                      </div>

                      <div className="flamma-ropa-grid">
                        {aparienciasFiltradas.map(
                          (apariencia) => (
                            <button
                              key={apariencia.id}
                              type="button"
                              className={`flamma-ropa-card flamma-ropa-card--${apariencia.categoria.toLowerCase()} ${
                                apariencia.equipada
                                  ? "equipada"
                                  : ""
                              } ${
                                !apariencia.desbloqueada
                                  ? "bloqueada"
                                  : ""
                              }`}
                              disabled={
                                procesandoApariencia ===
                                apariencia.id
                              }
                              onClick={() =>
                                void manejarApariencia(
                                  apariencia
                                )
                              }
                            >
                              <span className="flamma-ropa-card__categoria">
                                {apariencia.categoria ===
                                "GRATIS"
                                  ? "Gratis"
                                  : apariencia.categoria}
                              </span>

                              {!apariencia.desbloqueada && (
                                <span
                                  className="flamma-ropa-card__candado"
                                  aria-label="Apariencia bloqueada"
                                  title="Apariencia bloqueada"
                                >
                                  <LockKeyhole size={12} />
                                </span>
                              )}

                              {apariencia.equipada && (
                                <span className="flamma-ropa-card__check">
                                  <Check size={13} />
                                </span>
                              )}

                              <FlammaMascota
                                codigo={apariencia.codigo}
                                pequena
                              />

                              <strong>
                                {apariencia.nombre}
                              </strong>

                              <p>
                                {apariencia.descripcion}
                              </p>

                              <small
                                className={
                                  apariencia.desbloqueada
                                    ? ""
                                    : "flamma-ropa-card__precio-bloqueado"
                                }
                              >
                                {apariencia.equipada
                                  ? "Equipada"
                                  : apariencia.desbloqueada
                                    ? "Usar apariencia"
                                    : `${apariencia.costoXp} XP`}
                              </small>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {pestanaFlamma === "logros" && (
                    <div className="flamma-logros-tab">
                      <header className="flamma-seccion-titulo">
                        <div>
                          <Trophy size={17} />
                          <strong>
                            Logros e insignias
                          </strong>
                        </div>

                        <span>
                          {gamificacion.logrosCompletados}/
                          {gamificacion.logrosTotales}
                        </span>
                      </header>

                      <div className="flamma-logros-resumen">
                        {[
                          "BRONCE",
                          "PLATA",
                          "ORO",
                          "PLATINO",
                          "DIAMANTE",
                        ].map((categoria) => {
                          const logrosCategoria =
                            gamificacion.logros.filter(
                              (logro) =>
                                logro.categoria ===
                                categoria
                            );

                          const completados =
                            logrosCategoria.filter(
                              (logro) =>
                                logro.completado
                            ).length;

                          return (
                            <article key={categoria}>
                              <Trophy size={18} />
                              <strong>
                                {completados}/
                                {logrosCategoria.length}
                              </strong>
                              <span>
                                {categoria.charAt(0) +
                                  categoria
                                    .slice(1)
                                    .toLowerCase()}
                              </span>
                            </article>
                          );
                        })}
                      </div>

                      {[
                        "BRONCE",
                        "PLATA",
                        "ORO",
                        "PLATINO",
                        "DIAMANTE",
                      ].map((categoria) => {
                        const logrosCategoria =
                          gamificacion.logros.filter(
                            (logro) =>
                              logro.categoria === categoria
                          );

                        if (logrosCategoria.length === 0) {
                          return null;
                        }

                        return (
                          <section
                            key={categoria}
                            className="flamma-logros-grupo"
                          >
                            <h3>
                              <Trophy size={15} />
                              {categoria}
                            </h3>

                            {logrosCategoria.map((logro) => (
                              <article
                                key={logro.id}
                                className={
                                  logro.completado
                                    ? "completado"
                                    : ""
                                }
                              >
                                <div className="flamma-logro__icono">
                                  {logro.completado ? (
                                    <Check size={18} />
                                  ) : (
                                    <LockKeyhole size={17} />
                                  )}
                                </div>

                                <div className="flamma-logro__texto">
                                  <strong>
                                    {logro.nombre}
                                  </strong>
                                  <span>
                                    {logro.descripcion}
                                  </span>

                                  <div className="flamma-logro__progreso">
                                    <i
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (logro.progresoActual /
                                            Math.max(
                                              1,
                                              logro.valorObjetivo
                                            )) *
                                            100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>

                                <span className="flamma-logro__xp">
                                  +{logro.xpRecompensa} XP
                                </span>
                              </article>
                            ))}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}