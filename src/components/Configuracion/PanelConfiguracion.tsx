
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Clock3,
  Info,
  Laptop,
  MapPin,
  Trash2,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  BookOpen,
  Globe2,
  TrendingUp,
  MonitorCog,
  Phone,
  Settings,
  ShieldCheck,
  Smartphone,
  TextCursorInput,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  actualizarCorreo,
  actualizarNombre,
  actualizarPassword,
  actualizarPreferencias,
  actualizarTelefono,
  obtenerHistorialAccesos,
  obtenerDispositivosConfianza,
  actualizarConfianzaDispositivo,
  eliminarDispositivoConfianza,
  eliminarCuenta,
  obtenerEstado2FA,
  preparar2FA,
  activar2FA,
  desactivar2FA,
  obtenerConfiguracion,
  type DispositivoConfianza,
  type HistorialAcceso,
  type PreferenciasConfiguracion,
  type TamanoTexto,
} from "../../services/configuracionService";

import { obtenerDispositivoId } from "../../services/dispositivoService";

import "./PanelConfiguracion.css";

interface PanelConfiguracionProps {
  abierto: boolean;
  onCerrar: () => void;
}

type ModalActivo =
  | "nombre"
  | "telefono"
  | "correo"
  | "tamano"
  | "acerca"
  | "ayuda"
  | "terminos"
  | "password"
  | "historial"
  | "dispositivos"
  | "activar2fa"
  | "desactivar2fa"
  | "codigos2fa"
  | "eliminarCuenta"
  | null;

interface InterruptorProps {
  activo: boolean;
  onChange: () => void;
  ariaLabel: string;
  deshabilitado?: boolean;
}

const etiquetasTamano: Record<TamanoTexto, string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
  muy_grande: "Muy grande",
};

const tamanosTexto: TamanoTexto[] = [
  "pequeno",
  "mediano",
  "grande",
  "muy_grande",
];

function obtenerPreferenciasLocales(): PreferenciasConfiguracion {
  const temaGuardado =
    localStorage.getItem("balance-digital-tema") === "oscuro"
      ? "oscuro"
      : "claro";

  const tamanoGuardado = localStorage.getItem(
    "balance-digital-texto"
  ) as TamanoTexto | null;

  return {
    tema: temaGuardado,
    tamanoTexto:
      tamanoGuardado && tamanosTexto.includes(tamanoGuardado)
        ? tamanoGuardado
        : "mediano",
    recordatoriosGastos: true,
    notificacionesMetas: true,
    resumenesSemanales: false,
  };
}

function aplicarApariencia(
  preferencias: PreferenciasConfiguracion
): void {
  const raiz = document.documentElement;

  raiz.classList.toggle(
    "tema-oscuro",
    preferencias.tema === "oscuro"
  );

  raiz.classList.remove(
    "texto-pequeno",
    "texto-mediano",
    "texto-grande",
    "texto-muy-grande"
  );

  const claseTamano =
    preferencias.tamanoTexto === "muy_grande"
      ? "texto-muy-grande"
      : `texto-${preferencias.tamanoTexto}`;

  raiz.classList.add(claseTamano);

  localStorage.setItem(
    "balance-digital-tema",
    preferencias.tema
  );
  localStorage.setItem(
    "balance-digital-texto",
    preferencias.tamanoTexto
  );
}

function Interruptor({
  activo,
  onChange,
  ariaLabel,
  deshabilitado = false,
}: InterruptorProps) {
  return (
    <button
      type="button"
      className={
        activo
          ? "config-switch config-switch--activo"
          : "config-switch"
      }
      aria-label={ariaLabel}
      aria-pressed={activo}
      disabled={deshabilitado}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Ocurrió un error inesperado";
}

export default function PanelConfiguracion({
  abierto,
  onCerrar,
}: PanelConfiguracionProps) {
  const navigate = useNavigate();
  const { usuario, cerrar } = useAuth();

  const nombreInicial =
    usuario?.nombre?.trim() ||
    usuario?.correo?.split("@")[0] ||
    "Usuario Google";

  const correoInicial =
    usuario?.correo?.trim() || "usuario@balancedigital.mx";

  const [nombreActual, setNombreActual] = useState(nombreInicial);
  const [correoActual, setCorreoActual] = useState(correoInicial);
  const [telefonoActual, setTelefonoActual] = useState("");

  const [preferencias, setPreferencias] =
    useState<PreferenciasConfiguracion>(
      obtenerPreferenciasLocales
    );

  const [modalActivo, setModalActivo] =
    useState<ModalActivo>(null);

  const [nombreFormulario, setNombreFormulario] =
    useState(nombreInicial);

  const [telefonoFormulario, setTelefonoFormulario] =
    useState("");

  const [correoFormulario, setCorreoFormulario] =
    useState(correoInicial);

  const [passwordCorreo, setPasswordCorreo] =
    useState("");

  const [passwordActual, setPasswordActual] =
    useState("");

  const [passwordNueva, setPasswordNueva] =
    useState("");

  const [passwordConfirmacion, setPasswordConfirmacion] =
    useState("");

  const [tamanoTemporal, setTamanoTemporal] =
    useState<TamanoTexto>("mediano");

  const [cargandoConfiguracion, setCargandoConfiguracion] =
    useState(false);

  const [guardando, setGuardando] = useState(false);
  const [guardandoPreferencias, setGuardandoPreferencias] =
    useState(false);

  const [errorModal, setErrorModal] = useState("");
  const [errorPanel, setErrorPanel] = useState("");

  const [historialAccesos, setHistorialAccesos] =
    useState<HistorialAcceso[]>([]);

  const [cargandoHistorial, setCargandoHistorial] =
    useState(false);

  const [dispositivos, setDispositivos] =
    useState<DispositivoConfianza[]>([]);

  const [cargandoDispositivos, setCargandoDispositivos] =
    useState(false);

  const [accionDispositivoId, setAccionDispositivoId] =
    useState<string | null>(null);

  const [verificacionDosPasos, setVerificacionDosPasos] =
    useState(false);

  const [cargando2FA, setCargando2FA] =
    useState(false);

  const [qr2FA, setQr2FA] = useState("");
  const [secretoManual2FA, setSecretoManual2FA] =
    useState("");
  const [cuenta2FA, setCuenta2FA] = useState("");
  const [codigo2FA, setCodigo2FA] = useState("");
  const [password2FA, setPassword2FA] = useState("");
  const [codigosRecuperacion, setCodigosRecuperacion] =
    useState<string[]>([]);


  const [passwordEliminarCuenta, setPasswordEliminarCuenta] =
    useState("");
  const [confirmacionEliminarCuenta, setConfirmacionEliminarCuenta] =
    useState("");
  const [eliminandoCuenta, setEliminandoCuenta] =
    useState(false);

  const inicial = useMemo(
    () => nombreActual.charAt(0).toUpperCase() || "U",
    [nombreActual]
  );

  const nombreValido =
    nombreFormulario.trim().length >= 2;

  const telefonoLimpio =
    telefonoFormulario.replace(/\D/g, "");

  const telefonoValido =
    telefonoLimpio.length === 10;

  const correoValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      correoFormulario.trim()
    );

  const passwordNuevaValida =
    passwordNueva.length >= 8;

  const passwordsCoinciden =
    passwordNueva === passwordConfirmacion;

  const cambioPasswordValido =
    passwordActual.length >= 1 &&
    passwordNuevaValida &&
    passwordsCoinciden &&
    passwordNueva !== passwordActual;

  const cambioCorreoValido =
    correoValido &&
    passwordCorreo.length >= 1 &&
    correoFormulario.trim().toLowerCase() !==
      correoActual.trim().toLowerCase();

  useEffect(() => {
    aplicarApariencia(preferencias);
  }, [preferencias]);

  useEffect(() => {
    if (!abierto) return;

    function cerrarConEscape(evento: KeyboardEvent): void {
      if (evento.key !== "Escape") return;

      if (modalActivo) {
        cerrarModal();
        return;
      }

      onCerrar();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, [abierto, modalActivo, onCerrar]);

  useEffect(() => {
    if (!abierto) return;

    let cancelado = false;

    async function cargarConfiguracion(): Promise<void> {
      setCargandoConfiguracion(true);
      setErrorPanel("");

      try {
        const respuesta = await obtenerConfiguracion();

        if (cancelado) return;

        setNombreActual(respuesta.usuario.nombre);
        setCorreoActual(respuesta.usuario.correo);
        setTelefonoActual(
          respuesta.usuario.telefono ?? ""
        );

        setNombreFormulario(respuesta.usuario.nombre);
        setTelefonoFormulario(
          respuesta.usuario.telefono ?? ""
        );
        setCorreoFormulario(respuesta.usuario.correo);

        setPreferencias(respuesta.preferencias);
        setTamanoTemporal(
          respuesta.preferencias.tamanoTexto
        );

        try {
          const estado2FA = await obtenerEstado2FA();

          if (!cancelado) {
            setVerificacionDosPasos(
              estado2FA.activo
            );
          }
        } catch (error2FA) {
          console.error(
            "No se pudo cargar el estado 2FA:",
            error2FA
          );
        }
      } catch (error) {
        console.error(
          "No se pudo cargar la configuración:",
          error
        );

        if (!cancelado) {
          setErrorPanel(
            "No se pudieron cargar algunas preferencias."
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoConfiguracion(false);
        }
      }
    }

    void cargarConfiguracion();

    return () => {
      cancelado = true;
    };
  }, [abierto]);

  function abrirModalNombre(): void {
    setNombreFormulario(nombreActual);
    setErrorModal("");
    setModalActivo("nombre");
  }

  function abrirModalTelefono(): void {
    setTelefonoFormulario(telefonoActual);
    setErrorModal("");
    setModalActivo("telefono");
  }

  function abrirModalCorreo(): void {
    setCorreoFormulario(correoActual);
    setPasswordCorreo("");
    setErrorModal("");
    setModalActivo("correo");
  }

  function abrirModalPassword(): void {
    setPasswordActual("");
    setPasswordNueva("");
    setPasswordConfirmacion("");
    setErrorModal("");
    setModalActivo("password");
  }

  function abrirModalTamano(): void {
    setTamanoTemporal(preferencias.tamanoTexto);
    setErrorModal("");
    setModalActivo("tamano");
  }

  async function abrirHistorialAccesos(): Promise<void> {
    setModalActivo("historial");
    setCargandoHistorial(true);
    setErrorModal("");

    try {
      const respuesta = await obtenerHistorialAccesos();
      setHistorialAccesos(respuesta.accesos);
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setCargandoHistorial(false);
    }
  }

  async function abrirDispositivosConfianza(): Promise<void> {
    setModalActivo("dispositivos");
    setCargandoDispositivos(true);
    setErrorModal("");

    try {
      const respuesta = await obtenerDispositivosConfianza(
        obtenerDispositivoId()
      );
      setDispositivos(respuesta.dispositivos);
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setCargandoDispositivos(false);
    }
  }

  async function cambiarConfianzaDispositivo(
    dispositivo: DispositivoConfianza
  ): Promise<void> {
    setAccionDispositivoId(dispositivo.dispositivoId);
    setErrorModal("");

    try {
      await actualizarConfianzaDispositivo(
        dispositivo.dispositivoId,
        !dispositivo.confiable
      );

      setDispositivos((actuales) =>
        actuales.map((item) =>
          item.dispositivoId === dispositivo.dispositivoId
            ? { ...item, confiable: !item.confiable }
            : item
        )
      );
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setAccionDispositivoId(null);
    }
  }

  async function eliminarDispositivo(
    dispositivo: DispositivoConfianza
  ): Promise<void> {
    if (dispositivo.actual) {
      setErrorModal(
        "No puedes eliminar el dispositivo que estás usando actualmente"
      );
      return;
    }

    setAccionDispositivoId(dispositivo.dispositivoId);
    setErrorModal("");

    try {
      await eliminarDispositivoConfianza(
        dispositivo.dispositivoId,
        obtenerDispositivoId()
      );

      setDispositivos((actuales) =>
        actuales.filter(
          (item) =>
            item.dispositivoId !== dispositivo.dispositivoId
        )
      );
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setAccionDispositivoId(null);
    }
  }

  async function iniciarActivacion2FA(): Promise<void> {
    setCargando2FA(true);
    setErrorModal("");
    setCodigo2FA("");
    setQr2FA("");
    setSecretoManual2FA("");
    setCuenta2FA("");
    setModalActivo("activar2fa");

    try {
      const respuesta = await preparar2FA();

      setQr2FA(respuesta.qrDataUrl);
      setSecretoManual2FA(respuesta.secretoManual);
      setCuenta2FA(respuesta.cuenta);
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setCargando2FA(false);
    }
  }

  async function confirmarActivacion2FA(): Promise<void> {
    if (!/^\d{6}$/.test(codigo2FA)) {
      setErrorModal("Escribe un código válido de 6 dígitos");
      return;
    }

    setCargando2FA(true);
    setErrorModal("");

    try {
      const respuesta = await activar2FA(codigo2FA);

      setVerificacionDosPasos(true);
      setCodigosRecuperacion(
        respuesta.codigosRecuperacion
      );
      setModalActivo("codigos2fa");
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setCargando2FA(false);
    }
  }

  function abrirDesactivar2FA(): void {
    setPassword2FA("");
    setCodigo2FA("");
    setErrorModal("");
    setModalActivo("desactivar2fa");
  }

  async function confirmarDesactivacion2FA(): Promise<void> {
    if (!password2FA || !/^\d{6}$/.test(codigo2FA)) {
      setErrorModal(
        "Escribe tu contraseña y un código válido de 6 dígitos"
      );
      return;
    }

    setCargando2FA(true);
    setErrorModal("");

    try {
      await desactivar2FA(password2FA, codigo2FA);

      setVerificacionDosPasos(false);
      setPassword2FA("");
      setCodigo2FA("");
      setModalActivo(null);
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setCargando2FA(false);
    }
  }

  function abrirEliminarCuenta(): void {
    setPasswordEliminarCuenta("");
    setConfirmacionEliminarCuenta("");
    setErrorModal("");
    setModalActivo("eliminarCuenta");
  }

  async function confirmarEliminarCuenta(): Promise<void> {
    if (!passwordEliminarCuenta) {
      setErrorModal("Escribe tu contraseña actual");
      return;
    }

    if (
      confirmacionEliminarCuenta
        .trim()
        .toUpperCase() !== "ELIMINAR"
    ) {
      setErrorModal(
        'Escribe la palabra "ELIMINAR" para confirmar'
      );
      return;
    }

    setEliminandoCuenta(true);
    setErrorModal("");

    try {
      await eliminarCuenta(
        passwordEliminarCuenta,
        confirmacionEliminarCuenta
      );

      setModalActivo(null);
      onCerrar();
      cerrar();
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setEliminandoCuenta(false);
    }
  }

  function cerrarModal(): void {
    if (guardando || guardandoPreferencias) return;

    setModalActivo(null);
    setErrorModal("");
  }

  async function guardarNombre(): Promise<void> {
    const nombre = nombreFormulario.trim();

    if (nombre.length < 2) {
      setErrorModal("Escribe un nombre válido");
      return;
    }

    setGuardando(true);
    setErrorModal("");

    try {
      const respuesta = await actualizarNombre(nombre);

      setNombreActual(respuesta.nombre);
      setNombreFormulario(respuesta.nombre);
      setModalActivo(null);

      window.dispatchEvent(
        new CustomEvent(
          "balance-digital:usuario-actualizado",
          {
            detail: { nombre: respuesta.nombre },
          }
        )
      );
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarPassword(): Promise<void> {
    if (!passwordActual) {
      setErrorModal("Escribe tu contraseña actual");
      return;
    }

    if (passwordNueva.length < 8) {
      setErrorModal(
        "La nueva contraseña debe tener al menos 8 caracteres"
      );
      return;
    }

    if (passwordNueva !== passwordConfirmacion) {
      setErrorModal(
        "La confirmación no coincide con la nueva contraseña"
      );
      return;
    }

    if (passwordActual === passwordNueva) {
      setErrorModal(
        "La nueva contraseña debe ser diferente a la actual"
      );
      return;
    }

    setGuardando(true);
    setErrorModal("");

    try {
      await actualizarPassword(
        passwordActual,
        passwordNueva,
        passwordConfirmacion
      );

      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmacion("");
      setModalActivo(null);
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCorreo(): Promise<void> {
    const correo = correoFormulario.trim().toLowerCase();

    if (!correoValido) {
      setErrorModal("Escribe un correo electrónico válido");
      return;
    }

    if (!passwordCorreo) {
      setErrorModal("Escribe tu contraseña actual");
      return;
    }

    if (correo === correoActual.trim().toLowerCase()) {
      setErrorModal("Escribe un correo diferente al actual");
      return;
    }

    setGuardando(true);
    setErrorModal("");

    try {
      const respuesta = await actualizarCorreo(
        correo,
        passwordCorreo
      );

      setCorreoActual(respuesta.correo);
      setCorreoFormulario(respuesta.correo);
      setPasswordCorreo("");
      setModalActivo(null);

      window.dispatchEvent(
        new CustomEvent("balance-digital:usuario-actualizado", {
          detail: { correo: respuesta.correo },
        })
      );
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarTelefono(): Promise<void> {
    if (telefonoLimpio.length !== 10) {
      setErrorModal(
        "Escribe un número de 10 dígitos"
      );
      return;
    }

    setGuardando(true);
    setErrorModal("");

    try {
      const respuesta =
        await actualizarTelefono(telefonoLimpio);

      setTelefonoActual(respuesta.telefono);
      setTelefonoFormulario(respuesta.telefono);
      setModalActivo(null);
    } catch (error) {
      setErrorModal(obtenerMensajeError(error));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarPreferencias(
    nuevasPreferencias: PreferenciasConfiguracion
  ): Promise<boolean> {
    if (guardandoPreferencias) return false;

    const anteriores = preferencias;

    setPreferencias(nuevasPreferencias);
    setGuardandoPreferencias(true);
    setErrorPanel("");
    setErrorModal("");

    try {
      const respuesta =
        await actualizarPreferencias(
          nuevasPreferencias
        );

      setPreferencias(respuesta.preferencias);
      return true;
    } catch (error) {
      setPreferencias(anteriores);

      const mensaje = obtenerMensajeError(error);

      if (modalActivo) {
        setErrorModal(mensaje);
      } else {
        setErrorPanel(mensaje);
      }

      return false;
    } finally {
      setGuardandoPreferencias(false);
    }
  }

  async function guardarTamanoTexto(): Promise<void> {
    const guardado = await cambiarPreferencias({
      ...preferencias,
      tamanoTexto: tamanoTemporal,
    });

    if (guardado) {
      setModalActivo(null);
    }
  }

  function cerrarSesion(): void {
    cerrar();
    onCerrar();
    navigate("/login");
  }

  return (
    <div
      className={
        abierto
          ? "panel-configuracion panel-configuracion--abierto"
          : "panel-configuracion"
      }
      aria-hidden={!abierto}
    >
      <button
        type="button"
        className="panel-configuracion__fondo"
        aria-label="Cerrar configuración"
        onClick={modalActivo ? undefined : onCerrar}
      />

      <aside
        className="panel-configuracion__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Configuración"
      >
        <header className="panel-configuracion__encabezado">
          <div className="panel-configuracion__titulo">
            <Settings size={19} strokeWidth={1.9} />
            <h2>Configuración</h2>
          </div>

          <button
            type="button"
            className="panel-configuracion__cerrar"
            aria-label="Cerrar"
            onClick={onCerrar}
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </header>

        <div className="panel-configuracion__contenido">
          <section className="config-perfil">
            <div className="config-perfil__avatar">
              {inicial}
            </div>

            <div className="config-perfil__datos">
              <strong>
                {cargandoConfiguracion
                  ? "Cargando..."
                  : nombreActual}
              </strong>
              <span>{correoActual}</span>
            </div>
          </section>

          {errorPanel && (
            <p className="config-modal__error config-panel__error">
              {errorPanel}
            </p>
          )}

          <Seccion titulo="CUENTA">
            <Opcion
              icono={<UserRound size={17} />}
              titulo="Nombre de usuario"
              subtitulo={nombreActual}
              onClick={abrirModalNombre}
            />

            <Opcion
              icono={<Phone size={17} />}
              titulo="Número de Teléfono"
              subtitulo={
                telefonoActual || "Toca para añadir"
              }
              onClick={abrirModalTelefono}
            />
          </Seccion>

          <Seccion titulo="APARIENCIA">
            <OpcionSwitch
              icono={<MonitorCog size={17} />}
              titulo="Modo claro / oscuro"
              activo={preferencias.tema === "oscuro"}
              deshabilitado={guardandoPreferencias}
              onChange={() =>
                void cambiarPreferencias({
                  ...preferencias,
                  tema:
                    preferencias.tema === "oscuro"
                      ? "claro"
                      : "oscuro",
                })
              }
            />

            <Opcion
              icono={<TextCursorInput size={17} />}
              titulo="Tamaño de texto"
              subtitulo={
                etiquetasTamano[
                  preferencias.tamanoTexto
                ]
              }
              onClick={abrirModalTamano}
            />
          </Seccion>

          <Seccion titulo="NOTIFICACIONES">
            <OpcionSwitch
              icono={<Bell size={17} />}
              titulo="Recordatorios de gastos"
              activo={
                preferencias.recordatoriosGastos
              }
              deshabilitado={guardandoPreferencias}
              onChange={() =>
                void cambiarPreferencias({
                  ...preferencias,
                  recordatoriosGastos:
                    !preferencias.recordatoriosGastos,
                })
              }
            />

            <OpcionSwitch
              icono={<ShieldCheck size={17} />}
              titulo="Metas de ahorro"
              activo={
                preferencias.notificacionesMetas
              }
              deshabilitado={guardandoPreferencias}
              onChange={() =>
                void cambiarPreferencias({
                  ...preferencias,
                  notificacionesMetas:
                    !preferencias.notificacionesMetas,
                })
              }
            />

            <OpcionSwitch
              icono={<TextCursorInput size={17} />}
              titulo="Resúmenes semanales"
              activo={
                preferencias.resumenesSemanales
              }
              deshabilitado={guardandoPreferencias}
              onChange={() =>
                void cambiarPreferencias({
                  ...preferencias,
                  resumenesSemanales:
                    !preferencias.resumenesSemanales,
                })
              }
            />
          </Seccion>

          <Seccion titulo="SEGURIDAD">
            <Opcion
              icono={<Mail size={17} />}
              titulo="Correo electrónico"
              subtitulo={correoActual}
              onClick={abrirModalCorreo}
            />

            <Opcion
              icono={<LockKeyhole size={17} />}
              titulo="Cambiar contraseña"
              subtitulo="Actualiza tu contraseña de acceso"
              onClick={abrirModalPassword}
            />

            <Opcion
              icono={<Smartphone size={17} />}
              titulo="Cambiar número de Teléfono"
              subtitulo={
                telefonoActual ||
                "Añade primero un número"
              }
              onClick={abrirModalTelefono}
            />
          </Seccion>

          <section className="config-seccion">
            <h3>VERIFICACIÓN EN 2 PASOS</h3>

            <div className={
              verificacionDosPasos
                ? "config-aviso config-aviso--activo"
                : "config-aviso"
            }>
              <ShieldCheck size={17} />

              <div>
                <strong>
                  {verificacionDosPasos
                    ? "Tu cuenta está protegida con verificación en 2 pasos"
                    : "Tu cuenta no tiene verificación en 2 pasos"}
                </strong>
                <span>
                  {verificacionDosPasos
                    ? "Se solicitará un código en dispositivos no confiables"
                    : "Actívala para añadir una capa extra de seguridad"}
                </span>
              </div>
            </div>

            <div className="config-grupo config-grupo--sin-borde-superior">
              <OpcionSwitch
                icono={<ShieldCheck size={17} />}
                titulo="Autenticación en 2 pasos"
                subtitulo={
                  verificacionDosPasos
                    ? "Activa · Protegida"
                    : "Inactiva · Recomendada"
                }
                activo={verificacionDosPasos}
                deshabilitado={cargando2FA}
                onChange={() => {
                  if (verificacionDosPasos) {
                    abrirDesactivar2FA();
                  } else {
                    void iniciarActivacion2FA();
                  }
                }}
              />

              <Opcion
                icono={<MonitorCog size={17} />}
                titulo="Dispositivos de confianza"
                subtitulo="Administra tus dispositivos reconocidos"
                onClick={() => void abrirDispositivosConfianza()}
              />

              <Opcion
                icono={<Clock3 size={17} />}
                titulo="Historial de accesos"
                subtitulo="Consulta la actividad de tu cuenta"
                onClick={() => void abrirHistorialAccesos()}
              />
            </div>
          </section>

          <Seccion titulo="INFORMACIÓN">
            <Opcion
              icono={<Info size={17} />}
              titulo="Acerca de Balance Digital"
              subtitulo="v1.0.0 · Agosto 2026"
              onClick={() =>
                setModalActivo("acerca")
              }
            />

            <Opcion
              icono={<CircleHelp size={17} />}
              titulo="Ayuda y Soporte"
              subtitulo="soporte@balancedigital.mx"
              onClick={() =>
                setModalActivo("ayuda")
              }
            />

            <Opcion
              icono={<KeyRound size={17} />}
              titulo="Términos y Condiciones"
              onClick={() =>
                setModalActivo("terminos")
              }
            />
          </Seccion>

          <section className="config-seccion config-seccion--peligro">
            <h3>ZONA DE PELIGRO</h3>

            <div className="config-grupo">
              <Opcion
                icono={<Trash2 size={17} />}
                titulo="Eliminar cuenta"
                subtitulo="Borra permanentemente tu cuenta y tus datos"
                onClick={abrirEliminarCuenta}
              />
            </div>
          </section>

          <button
            type="button"
            className="config-cerrar-sesion"
            onClick={cerrarSesion}
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {modalActivo === "eliminarCuenta" && (
        <Modal
          titulo="Eliminar cuenta"
          icono={<Trash2 size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="eliminar-cuenta">
            <div className="eliminar-cuenta__aviso">
              <Trash2 size={22} />

              <div>
                <strong>
                  Esta acción es permanente
                </strong>

                <p>
                  Se eliminarán tu perfil, movimientos,
                  presupuestos, metas, reportes, dispositivos
                  y configuraciones asociadas.
                </p>
              </div>
            </div>

            <label className="config-modal__campo">
              <span>CONTRASEÑA ACTUAL</span>

              <div className="config-modal__input">
                <LockKeyhole size={16} />

                <input
                  type="password"
                  value={passwordEliminarCuenta}
                  onChange={(evento) => {
                    setPasswordEliminarCuenta(
                      evento.target.value
                    );
                    setErrorModal("");
                  }}
                  placeholder="Confirma tu contraseña"
                  autoComplete="current-password"
                />
              </div>
            </label>

            <label className="config-modal__campo">
              <span>
                ESCRIBE ELIMINAR PARA CONFIRMAR
              </span>

              <div className="config-modal__input">
                <Trash2 size={16} />

                <input
                  type="text"
                  value={confirmacionEliminarCuenta}
                  onChange={(evento) => {
                    setConfirmacionEliminarCuenta(
                      evento.target.value
                        .toUpperCase()
                    );
                    setErrorModal("");
                  }}
                  placeholder="ELIMINAR"
                  autoComplete="off"
                />
              </div>
            </label>

            {errorModal && (
              <p className="config-modal__error">
                {errorModal}
              </p>
            )}

            <button
              type="button"
              className="eliminar-cuenta__boton"
              disabled={
                eliminandoCuenta ||
                !passwordEliminarCuenta ||
                confirmacionEliminarCuenta
                  .trim()
                  .toUpperCase() !== "ELIMINAR"
              }
              onClick={() =>
                void confirmarEliminarCuenta()
              }
            >
              <Trash2 size={16} />

              {eliminandoCuenta
                ? "Eliminando cuenta..."
                : "Eliminar mi cuenta definitivamente"}
            </button>

            <p className="eliminar-cuenta__nota">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </Modal>
      )}

      {modalActivo === "nombre" && (
        <Modal
          titulo="Nombre de usuario"
          icono={<UserRound size={18} />}
          onCerrar={cerrarModal}
        >
          <label className="config-modal__campo">
            <span>NUEVO NOMBRE</span>

            <div className="config-modal__input">
              <UserRound size={16} />
              <input
                type="text"
                value={nombreFormulario}
                maxLength={100}
                autoFocus
                onChange={(evento) => {
                  setNombreFormulario(
                    evento.target.value
                  );
                  setErrorModal("");
                }}
                onKeyDown={(evento) => {
                  if (
                    evento.key === "Enter" &&
                    nombreValido
                  ) {
                    void guardarNombre();
                  }
                }}
              />
            </div>
          </label>

          {errorModal && (
            <p className="config-modal__error">
              {errorModal}
            </p>
          )}

          <button
            type="button"
            className="config-modal__guardar"
            disabled={!nombreValido || guardando}
            onClick={() => void guardarNombre()}
          >
            {guardando
              ? "Guardando..."
              : "Guardar nombre"}
          </button>
        </Modal>
      )}

      {modalActivo === "activar2fa" && (
        <Modal
          titulo="Activar verificación en 2 pasos"
          icono={<ShieldCheck size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="twofa-config">
            <div className="twofa-config__pasos">
              <span className="activo">1</span>
              <i />
              <span>2</span>
              <i />
              <span>3</span>
            </div>

            <div className="twofa-config__intro">
              <strong>Escanea el código QR</strong>
              <p>
                Abre Google Authenticator, Microsoft
                Authenticator o una app compatible y agrega
                una cuenta nueva.
              </p>
            </div>

            {cargando2FA && (
              <div className="twofa-config__estado">
                Generando configuración segura...
              </div>
            )}

            {!cargando2FA && qr2FA && (
              <>
                <div className="twofa-config__qr">
                  <img
                    src={qr2FA}
                    alt="Código QR para configurar la verificación en 2 pasos"
                  />
                </div>

                <div className="twofa-config__manual">
                  <span>CLAVE DE CONFIGURACIÓN MANUAL</span>
                  <strong>{secretoManual2FA}</strong>
                  <small>{cuenta2FA}</small>
                </div>

                <label className="config-modal__campo">
                  <span>CÓDIGO DE 6 DÍGITOS</span>

                  <div className="config-modal__input twofa-config__codigo">
                    <KeyRound size={16} />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      value={codigo2FA}
                      maxLength={6}
                      onChange={(evento) => {
                        setCodigo2FA(
                          evento.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        );
                        setErrorModal("");
                      }}
                    />
                  </div>
                </label>
              </>
            )}

            {errorModal && (
              <p className="config-modal__error">
                {errorModal}
              </p>
            )}

            <button
              type="button"
              className="config-modal__guardar"
              disabled={
                cargando2FA ||
                !qr2FA ||
                codigo2FA.length !== 6
              }
              onClick={() =>
                void confirmarActivacion2FA()
              }
            >
              {cargando2FA
                ? "Verificando..."
                : "Activar protección"}
            </button>
          </div>
        </Modal>
      )}

      {modalActivo === "codigos2fa" && (
        <Modal
          titulo="Códigos de recuperación"
          icono={<KeyRound size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="twofa-recovery">
            <div className="twofa-recovery__hero">
              <ShieldCheck size={24} />
              <div>
                <strong>
                  La verificación en 2 pasos está activa
                </strong>
                <p>
                  Guarda estos códigos en un lugar seguro.
                  Cada código solo puede utilizarse una vez.
                </p>
              </div>
            </div>

            <div className="twofa-recovery__grid">
              {codigosRecuperacion.map((codigo) => (
                <code key={codigo}>{codigo}</code>
              ))}
            </div>

            <button
              type="button"
              className="twofa-recovery__copiar"
              onClick={() =>
                void navigator.clipboard.writeText(
                  codigosRecuperacion.join("\n")
                )
              }
            >
              Copiar todos los códigos
            </button>

            <button
              type="button"
              className="config-modal__guardar"
              onClick={cerrarModal}
            >
              Ya guardé mis códigos
            </button>
          </div>
        </Modal>
      )}

      {modalActivo === "desactivar2fa" && (
        <Modal
          titulo="Desactivar verificación en 2 pasos"
          icono={<ShieldCheck size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="twofa-disable">
            <p>
              Para proteger tu cuenta, confirma tu
              contraseña actual y un código de tu aplicación
              autenticadora.
            </p>

            <label className="config-modal__campo">
              <span>CONTRASEÑA ACTUAL</span>

              <div className="config-modal__input">
                <LockKeyhole size={16} />
                <input
                  type="password"
                  value={password2FA}
                  onChange={(evento) => {
                    setPassword2FA(evento.target.value);
                    setErrorModal("");
                  }}
                  placeholder="Confirma tu contraseña"
                />
              </div>
            </label>

            <label className="config-modal__campo">
              <span>CÓDIGO DE 6 DÍGITOS</span>

              <div className="config-modal__input twofa-config__codigo">
                <KeyRound size={16} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={codigo2FA}
                  maxLength={6}
                  onChange={(evento) => {
                    setCodigo2FA(
                      evento.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    );
                    setErrorModal("");
                  }}
                  placeholder="000000"
                />
              </div>
            </label>

            {errorModal && (
              <p className="config-modal__error">
                {errorModal}
              </p>
            )}

            <button
              type="button"
              className="config-modal__guardar twofa-disable__button"
              disabled={
                cargando2FA ||
                !password2FA ||
                codigo2FA.length !== 6
              }
              onClick={() =>
                void confirmarDesactivacion2FA()
              }
            >
              {cargando2FA
                ? "Desactivando..."
                : "Desactivar protección"}
            </button>
          </div>
        </Modal>
      )}

      {modalActivo === "dispositivos" && (
        <Modal
          titulo="Dispositivos de confianza"
          icono={<MonitorCog size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="dispositivos-confianza">
            <div className="dispositivos-confianza__hero">
              <div className="dispositivos-confianza__hero-icono">
                <ShieldCheck size={22} />
              </div>

              <div>
                <strong>Controla dónde permanece tu confianza</strong>
                <p>
                  Revisa los navegadores que han iniciado sesión
                  y decide cuáles reconoces.
                </p>
              </div>
            </div>

            {cargandoDispositivos && (
              <div className="dispositivos-confianza__estado">
                Cargando dispositivos...
              </div>
            )}

            {!cargandoDispositivos &&
              errorModal && (
                <p className="config-modal__error">
                  {errorModal}
                </p>
              )}

            {!cargandoDispositivos &&
              !errorModal &&
              dispositivos.length === 0 && (
                <div className="dispositivos-confianza__estado">
                  Aún no hay dispositivos registrados. Cierra
                  sesión e inicia nuevamente para registrar este
                  equipo.
                </div>
              )}

            {!cargandoDispositivos &&
              dispositivos.length > 0 && (
                <div className="dispositivos-confianza__lista">
                  {dispositivos.map((dispositivo) => (
                    <article
                      key={dispositivo.id}
                      className={
                        dispositivo.actual
                          ? "dispositivo-confianza dispositivo-confianza--actual"
                          : "dispositivo-confianza"
                      }
                    >
                      <div className="dispositivo-confianza__icono">
                        <Laptop size={20} />
                      </div>

                      <div className="dispositivo-confianza__contenido">
                        <div className="dispositivo-confianza__encabezado">
                          <div>
                            <strong>{dispositivo.nombre}</strong>

                            <div className="dispositivo-confianza__etiquetas">
                              {dispositivo.actual && (
                                <span className="actual">
                                  Este dispositivo
                                </span>
                              )}

                              {dispositivo.confiable && (
                                <span className="confiable">
                                  Confiable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="dispositivo-confianza__detalles">
                          <span>
                            <MonitorCog size={14} />
                            {dispositivo.navegador ||
                              "Navegador desconocido"}
                          </span>

                          <span>
                            <Settings size={14} />
                            {dispositivo.sistemaOperativo ||
                              "Sistema desconocido"}
                          </span>

                          <span>
                            <Clock3 size={14} />
                            {formatearFechaAcceso(
                              dispositivo.ultimoAcceso
                            )}
                          </span>

                          <span>
                            <MapPin size={14} />
                            IP: {dispositivo.ultimaIp || "No disponible"}
                          </span>
                        </div>

                        <div className="dispositivo-confianza__acciones">
                          <button
                            type="button"
                            className={
                              dispositivo.confiable
                                ? "dispositivo-confianza__boton dispositivo-confianza__boton--quitar"
                                : "dispositivo-confianza__boton"
                            }
                            disabled={
                              accionDispositivoId ===
                              dispositivo.dispositivoId
                            }
                            onClick={() =>
                              void cambiarConfianzaDispositivo(
                                dispositivo
                              )
                            }
                          >
                            <ShieldCheck size={15} />
                            {dispositivo.confiable
                              ? "Quitar confianza"
                              : "Marcar como confiable"}
                          </button>

                          {!dispositivo.actual && (
                            <button
                              type="button"
                              className="dispositivo-confianza__eliminar"
                              aria-label="Eliminar dispositivo"
                              disabled={
                                accionDispositivoId ===
                                dispositivo.dispositivoId
                              }
                              onClick={() =>
                                void eliminarDispositivo(dispositivo)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

            <div className="dispositivos-confianza__aviso">
              <Info size={16} />
              <span>
                Eliminar un dispositivo quita su registro de
                confianza, pero no invalida automáticamente un
                token que ya estuviera activo.
              </span>
            </div>

            <button
              type="button"
              className="config-modal__guardar"
              onClick={cerrarModal}
            >
              Entendido
            </button>
          </div>
        </Modal>
      )}

      {modalActivo === "historial" && (
        <Modal
          titulo="Historial de accesos"
          icono={<Clock3 size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="historial-accesos">
            <div className="historial-accesos__hero">
              <div className="historial-accesos__hero-icono">
                <ShieldCheck size={22} />
              </div>

              <div>
                <strong>Actividad reciente de tu cuenta</strong>
                <p>
                  Revisa desde qué dispositivos y ubicaciones
                  aproximadas se ha iniciado sesión.
                </p>
              </div>
            </div>

            {cargandoHistorial && (
              <div className="historial-accesos__estado">
                Cargando accesos...
              </div>
            )}

            {!cargandoHistorial &&
              errorModal && (
                <p className="config-modal__error">
                  {errorModal}
                </p>
              )}

            {!cargandoHistorial &&
              !errorModal &&
              historialAccesos.length === 0 && (
                <div className="historial-accesos__estado">
                  Todavía no hay accesos registrados.
                </div>
              )}

            {!cargandoHistorial &&
              !errorModal &&
              historialAccesos.length > 0 && (
                <div className="historial-accesos__lista">
                  {historialAccesos.map((acceso) => (
                    <article
                      key={acceso.id}
                      className={
                        acceso.actual
                          ? "historial-acceso historial-acceso--actual"
                          : "historial-acceso"
                      }
                    >
                      <div className="historial-acceso__icono">
                        <Laptop size={19} />
                      </div>

                      <div className="historial-acceso__contenido">
                        <div className="historial-acceso__encabezado">
                          <div>
                            <strong>
                              {acceso.dispositivo ||
                                "Dispositivo desconocido"}
                            </strong>

                            {acceso.actual && (
                              <span>Sesión más reciente</span>
                            )}
                          </div>

                          <span
                            className={
                              acceso.exitoso
                                ? "historial-acceso__estado historial-acceso__estado--correcto"
                                : "historial-acceso__estado historial-acceso__estado--fallido"
                            }
                          >
                            {acceso.exitoso
                              ? "Exitoso"
                              : "Fallido"}
                          </span>
                        </div>

                        <div className="historial-acceso__detalles">
                          <span>
                            <Clock3 size={14} />
                            {formatearFechaAcceso(
                              acceso.fechaAcceso
                            )}
                          </span>

                          <span>
                            <MonitorCog size={14} />
                            {resumirNavegador(
                              acceso.navegador
                            )}
                          </span>

                          <span>
                            <Settings size={14} />
                            {acceso.sistemaOperativo ||
                              "Sistema desconocido"}
                          </span>

                          <span>
                            <MapPin size={14} />
                            IP:{" "}
                            {acceso.direccionIp ||
                              "No disponible"}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

            <div className="historial-accesos__aviso">
              <Info size={16} />
              <span>
                Si no reconoces algún acceso, cambia tu
                contraseña inmediatamente.
              </span>
            </div>

            <button
              type="button"
              className="config-modal__guardar"
              onClick={cerrarModal}
            >
              Entendido
            </button>
          </div>
        </Modal>
      )}

      {modalActivo === "password" && (
        <Modal
          titulo="Cambiar contraseña"
          icono={<LockKeyhole size={18} />}
          onCerrar={cerrarModal}
        >
          <label className="config-modal__campo">
            <span>CONTRASEÑA ACTUAL</span>

            <div className="config-modal__input">
              <LockKeyhole size={16} />
              <input
                type="password"
                placeholder="Escribe tu contraseña actual"
                value={passwordActual}
                autoFocus
                onChange={(evento) => {
                  setPasswordActual(evento.target.value);
                  setErrorModal("");
                }}
              />
            </div>
          </label>

          <label className="config-modal__campo">
            <span>NUEVA CONTRASEÑA</span>

            <div className="config-modal__input">
              <KeyRound size={16} />
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={passwordNueva}
                onChange={(evento) => {
                  setPasswordNueva(evento.target.value);
                  setErrorModal("");
                }}
              />
            </div>
          </label>

          <div className="config-password__estado">
            <span
              className={
                passwordNueva.length === 0
                  ? ""
                  : passwordNuevaValida
                    ? "cumplido"
                    : "pendiente"
              }
            >
              {passwordNuevaValida ? "✓" : "•"} 8 caracteres o más
            </span>
          </div>

          <label className="config-modal__campo">
            <span>CONFIRMAR NUEVA CONTRASEÑA</span>

            <div className="config-modal__input">
              <ShieldCheck size={16} />
              <input
                type="password"
                placeholder="Repite la nueva contraseña"
                value={passwordConfirmacion}
                onChange={(evento) => {
                  setPasswordConfirmacion(evento.target.value);
                  setErrorModal("");
                }}
                onKeyDown={(evento) => {
                  if (
                    evento.key === "Enter" &&
                    cambioPasswordValido
                  ) {
                    void guardarPassword();
                  }
                }}
              />
            </div>
          </label>

          {passwordConfirmacion.length > 0 &&
            !passwordsCoinciden && (
              <p className="config-modal__error">
                Las contraseñas no coinciden
              </p>
            )}

          {errorModal && (
            <p className="config-modal__error">
              {errorModal}
            </p>
          )}

          <button
            type="button"
            className="config-modal__guardar"
            disabled={!cambioPasswordValido || guardando}
            onClick={() => void guardarPassword()}
          >
            {guardando
              ? "Actualizando..."
              : "Actualizar contraseña"}
          </button>
        </Modal>
      )}

      {modalActivo === "correo" && (
        <Modal
          titulo="Cambiar correo electrónico"
          icono={<Mail size={18} />}
          onCerrar={cerrarModal}
        >
          <label className="config-modal__campo">
            <span>NUEVO CORREO</span>

            <div className="config-modal__input">
              <Mail size={16} />
              <input
                type="email"
                placeholder="nombre@correo.com"
                value={correoFormulario}
                autoFocus
                onChange={(evento) => {
                  setCorreoFormulario(evento.target.value);
                  setErrorModal("");
                }}
              />
            </div>
          </label>

          <label className="config-modal__campo">
            <span>CONTRASEÑA ACTUAL</span>

            <div className="config-modal__input">
              <LockKeyhole size={16} />
              <input
                type="password"
                placeholder="Confirma tu identidad"
                value={passwordCorreo}
                onChange={(evento) => {
                  setPasswordCorreo(evento.target.value);
                  setErrorModal("");
                }}
                onKeyDown={(evento) => {
                  if (
                    evento.key === "Enter" &&
                    cambioCorreoValido
                  ) {
                    void guardarCorreo();
                  }
                }}
              />
            </div>
          </label>

          <p className="config-modal__ayuda">
            Al cambiar el correo tendrás que usar el nuevo
            correo la próxima vez que inicies sesión.
          </p>

          {errorModal && (
            <p className="config-modal__error">
              {errorModal}
            </p>
          )}

          <button
            type="button"
            className="config-modal__guardar"
            disabled={!cambioCorreoValido || guardando}
            onClick={() => void guardarCorreo()}
          >
            {guardando
              ? "Actualizando..."
              : "Actualizar correo"}
          </button>
        </Modal>
      )}

      {modalActivo === "telefono" && (
        <Modal
          titulo="Número de Teléfono"
          icono={<Phone size={18} />}
          onCerrar={cerrarModal}
        >
          <label className="config-modal__campo">
            <span>NÚMERO (10 DÍGITOS)</span>

            <div className="config-modal__input">
              <Phone size={16} />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Ej: 6671234567"
                value={telefonoFormulario}
                maxLength={10}
                autoFocus
                onChange={(evento) => {
                  setTelefonoFormulario(
                    evento.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  );
                  setErrorModal("");
                }}
                onKeyDown={(evento) => {
                  if (
                    evento.key === "Enter" &&
                    telefonoValido
                  ) {
                    void guardarTelefono();
                  }
                }}
              />
            </div>
          </label>

          {errorModal && (
            <p className="config-modal__error">
              {errorModal}
            </p>
          )}

          <button
            type="button"
            className="config-modal__guardar"
            disabled={!telefonoValido || guardando}
            onClick={() => void guardarTelefono()}
          >
            {guardando
              ? "Guardando..."
              : "Guardar teléfono"}
          </button>
        </Modal>
      )}

      {modalActivo === "tamano" && (
        <Modal
          titulo="Tamaño de texto"
          icono={<TextCursorInput size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="config-tamanos">
            {tamanosTexto.map((tamano) => (
              <button
                key={tamano}
                type="button"
                className={
                  tamanoTemporal === tamano
                    ? "config-tamano config-tamano--activo"
                    : "config-tamano"
                }
                onClick={() =>
                  setTamanoTemporal(tamano)
                }
              >
                <span
                  className={`config-tamano__muestra config-tamano__muestra--${tamano}`}
                >
                  Aa
                </span>
                <strong>
                  {etiquetasTamano[tamano]}
                </strong>
              </button>
            ))}
          </div>

          {errorModal && (
            <p className="config-modal__error">
              {errorModal}
            </p>
          )}

          <button
            type="button"
            className="config-modal__guardar"
            disabled={guardandoPreferencias}
            onClick={() =>
              void guardarTamanoTexto()
            }
          >
            {guardandoPreferencias
              ? "Aplicando..."
              : "Aplicar tamaño"}
          </button>
        </Modal>
      )}

      {modalActivo === "acerca" && (
        <ModalInformativo
          titulo="Acerca de Balance Digital"
          icono={<Info size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="config-acerca">
            <div className="config-acerca__marca">
              <div className="config-acerca__logo">
                <TrendingUp size={30} strokeWidth={2.2} />
              </div>

              <div>
                <h4>
                  Balance<span>Digital</span>
                </h4>
                <p>Tu asistente financiero personal</p>
              </div>
            </div>

            <p className="config-acerca__descripcion">
              Una experiencia clara, moderna y segura para
              organizar tus finanzas, entender tus hábitos y
              avanzar hacia tus objetivos con mayor control.
            </p>

            <div className="config-acerca__beneficios">
              <article>
                <span>
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <strong>Información protegida</strong>
                  <small>
                    Tus datos permanecen asociados a tu cuenta.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <TrendingUp size={17} />
                </span>
                <div>
                  <strong>Decisiones más claras</strong>
                  <small>
                    Visualiza movimientos, metas y reportes en
                    un solo lugar.
                  </small>
                </div>
              </article>
            </div>

            <div className="config-acerca__datos">
              <div>
                <span>Versión</span>
                <strong>1.0.0</strong>
              </div>

              <div>
                <span>Desarrollado por</span>
                <strong>Equipo Balance Digital</strong>
              </div>

              <div>
                <span>Contacto</span>
                <strong>soporte@balancedigital.mx</strong>
              </div>

              <div>
                <span>Sitio web</span>
                <strong>balancedigital.mx</strong>
              </div>

              <div>
                <span>Última actualización</span>
                <strong>Agosto 2026</strong>
              </div>
            </div>
          </div>
        </ModalInformativo>
      )}

      {modalActivo === "ayuda" && (
        <ModalInformativo
          titulo="Ayuda y Soporte"
          icono={<CircleHelp size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="config-soporte">
            <div className="config-soporte__intro">
              <span>¿Cómo podemos ayudarte?</span>
              <p>
                Elige el canal que mejor se adapte a lo que
                necesitas.
              </p>
            </div>

            <button
              type="button"
              className="config-soporte__opcion"
              onClick={() =>
                window.open(
                  "https://wa.me/526692286035",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <span className="config-soporte__icono">
                <MessageCircle size={20} />
              </span>

              <span className="config-soporte__texto">
                <strong>Chat en vivo</strong>
                <small>Lunes a viernes · 9:00 a 18:00</small>
              </span>

              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              className="config-soporte__opcion"
              onClick={() => {
                window.location.href =
                  "mailto:soporte@balancedigital.mx";
              }}
            >
              <span className="config-soporte__icono">
                <Mail size={20} />
              </span>

              <span className="config-soporte__texto">
                <strong>Correo electrónico</strong>
                <small>soporte@balancedigital.mx</small>
              </span>

              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              className="config-soporte__opcion config-soporte__opcion--destacada"
              onClick={() =>
                window.open(
                  "https://balancedigital.mx/ayuda",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <span className="config-soporte__icono">
                <BookOpen size={20} />
              </span>

              <span className="config-soporte__texto">
                <strong>Centro de ayuda</strong>
                <small>Guías, preguntas y tutoriales</small>
              </span>

              <ChevronRight size={18} />
            </button>

            <div className="config-soporte__respuesta">
              Tiempo promedio de respuesta:
              <strong> menos de 24 horas</strong>
            </div>
          </div>
        </ModalInformativo>
      )}

      {modalActivo === "terminos" && (
        <Modal
          titulo="Términos y Condiciones"
          icono={<KeyRound size={18} />}
          onCerrar={cerrarModal}
        >
          <div className="terminos-premium">
            <div className="terminos-premium__hero">
              <div className="terminos-premium__hero-icono">
                <ShieldCheck size={26} />
              </div>

              <div>
                <span className="terminos-premium__etiqueta">
                  BALANCE DIGITAL · LEGAL
                </span>

                <h4>Tu confianza también forma parte del servicio</h4>

                <p>
                  Estos términos explican, de forma clara y transparente,
                  cómo funciona Balance Digital y qué responsabilidades
                  asumimos tú y la plataforma.
                </p>
              </div>
            </div>

            <div className="terminos-premium__meta">
              <span>Versión 1.0</span>
              <span>Vigente desde agosto de 2026</span>
            </div>

            <nav className="terminos-premium__indice" aria-label="Contenido">
              <a href="#terminos-cuenta">Tu cuenta</a>
              <a href="#terminos-datos">Tus datos</a>
              <a href="#terminos-servicio">El servicio</a>
              <a href="#terminos-seguridad">Seguridad</a>
            </nav>

            <div className="terminos-premium__contenido">
              <section id="terminos-aceptacion">
                <div className="terminos-premium__numero">01</div>

                <div>
                  <h5>Aceptación de los términos</h5>
                  <p>
                    Al registrarte, iniciar sesión o utilizar cualquier
                    función de Balance Digital, aceptas estos Términos y
                    Condiciones. Si no estás de acuerdo con alguna parte,
                    debes dejar de utilizar la plataforma.
                  </p>
                </div>
              </section>

              <section id="terminos-cuenta">
                <div className="terminos-premium__numero">02</div>

                <div>
                  <h5>Tu cuenta y tus credenciales</h5>
                  <p>
                    Eres responsable de mantener actualizados tus datos,
                    proteger tu contraseña y evitar accesos no autorizados.
                    Toda actividad realizada desde tu cuenta se considerará
                    asociada a tu usuario, salvo que reportes oportunamente
                    un acceso indebido.
                  </p>
                </div>
              </section>

              <section id="terminos-servicio">
                <div className="terminos-premium__numero">03</div>

                <div>
                  <h5>Qué ofrece Balance Digital</h5>
                  <p>
                    La aplicación permite registrar movimientos, crear
                    presupuestos, establecer metas, consultar reportes y
                    organizar información financiera personal. Las funciones
                    pueden evolucionar, mejorar o cambiar conforme avance el
                    producto.
                  </p>
                </div>
              </section>

              <section>
                <div className="terminos-premium__numero">04</div>

                <div>
                  <h5>Exactitud de la información</h5>
                  <p>
                    Tú decides qué información registrar y eres responsable
                    de que sea correcta. Balance Digital no verifica de forma
                    automática cada ingreso, gasto, saldo o movimiento que
                    captures.
                  </p>
                </div>
              </section>

              <section id="terminos-datos">
                <div className="terminos-premium__numero">05</div>

                <div>
                  <h5>Privacidad y tratamiento de datos</h5>
                  <p>
                    Utilizamos la información de tu cuenta para ofrecer las
                    funciones del sistema, conservar tus preferencias y
                    mejorar tu experiencia. No debes registrar información de
                    terceros sin autorización.
                  </p>
                </div>
              </section>

              <section id="terminos-seguridad">
                <div className="terminos-premium__numero">06</div>

                <div>
                  <h5>Seguridad de la cuenta</h5>
                  <p>
                    Aplicamos medidas razonables para proteger la plataforma.
                    Aun así, ninguna tecnología elimina por completo todos los
                    riesgos. Debes usar una contraseña segura, cerrar sesión
                    en dispositivos compartidos y reportar cualquier actividad
                    sospechosa.
                  </p>
                </div>
              </section>

              <section>
                <div className="terminos-premium__numero">07</div>

                <div>
                  <h5>Uso permitido</h5>
                  <p>
                    Balance Digital debe utilizarse de forma legal y personal.
                    Está prohibido vulnerar el sistema, intentar acceder a
                    cuentas ajenas, alterar información, distribuir software
                    malicioso o usar la plataforma con fines fraudulentos.
                  </p>
                </div>
              </section>

              <section>
                <div className="terminos-premium__numero">08</div>

                <div>
                  <h5>Información financiera y decisiones</h5>
                  <p>
                    Los saldos, proyecciones, métricas y reportes tienen fines
                    informativos. La plataforma no sustituye asesoría
                    contable, fiscal, jurídica, bancaria o de inversión.
                  </p>
                </div>
              </section>

              <section>
                <div className="terminos-premium__numero">09</div>

                <div>
                  <h5>Disponibilidad y actualizaciones</h5>
                  <p>
                    Podemos realizar mantenimiento, corregir errores, añadir
                    funciones o modificar temporalmente el servicio. Cuando
                    sea posible, procuraremos que estas acciones generen la
                    menor interrupción.
                  </p>
                </div>
              </section>

              <section>
                <div className="terminos-premium__numero">10</div>

                <div>
                  <h5>Modificaciones a estos términos</h5>
                  <p>
                    Estos términos pueden actualizarse para reflejar nuevas
                    funciones, cambios operativos o requisitos legales. La
                    fecha y versión vigentes siempre aparecerán en este
                    apartado.
                  </p>
                </div>
              </section>
            </div>

            <div className="terminos-premium__destacado">
              <div>
                <ShieldCheck size={20} />
              </div>

              <p>
                <strong>Compromiso Balance Digital:</strong> diseñar una
                experiencia financiera clara, segura y transparente, sin
                ocultar cómo funciona el servicio.
              </p>
            </div>

            <div className="terminos-premium__contacto">
              <div>
                <span>¿Tienes una duda legal o de privacidad?</span>
                <strong>soporte@balancedigital.mx</strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "mailto:soporte@balancedigital.mx";
                }}
              >
                Contactar
                <ChevronRight size={16} />
              </button>
            </div>

            <label className="terminos-premium__aceptacion">
              <input type="checkbox" defaultChecked />
              <span>
                He leído y comprendo los Términos y Condiciones
              </span>
            </label>

            <button
              type="button"
              className="config-modal__guardar terminos-premium__boton"
              onClick={cerrarModal}
            >
              Aceptar y continuar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}


function formatearFechaAcceso(valor: string): string {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "Fecha desconocida";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

function resumirNavegador(valor: string | null): string {
  if (!valor) return "Navegador desconocido";

  if (/Edg\//i.test(valor)) return "Microsoft Edge";
  if (/Chrome\//i.test(valor)) return "Google Chrome";
  if (/Firefox\//i.test(valor)) return "Mozilla Firefox";
  if (/Safari\//i.test(valor) && !/Chrome\//i.test(valor)) {
    return "Safari";
  }

  return valor.length > 46
    ? `${valor.slice(0, 46)}…`
    : valor;
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="config-seccion">
      <h3>{titulo}</h3>
      <div className="config-grupo">
        {children}
      </div>
    </section>
  );
}

function Opcion({
  icono,
  titulo,
  subtitulo,
  onClick,
  deshabilitada = false,
}: {
  icono: ReactNode;
  titulo: string;
  subtitulo?: string;
  onClick?: () => void;
  deshabilitada?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        deshabilitada
          ? "config-opcion config-opcion--deshabilitada"
          : "config-opcion"
      }
      disabled={deshabilitada}
      onClick={onClick}
    >
      <span className="config-opcion__icono">
        {icono}
      </span>

      <span className="config-opcion__texto">
        <strong>{titulo}</strong>
        {subtitulo && <small>{subtitulo}</small>}
      </span>

      <ChevronRight
        size={17}
        className="config-opcion__flecha"
      />
    </button>
  );
}

function OpcionSwitch({
  icono,
  titulo,
  subtitulo,
  activo,
  onChange,
  deshabilitado = false,
}: {
  icono: ReactNode;
  titulo: string;
  subtitulo?: string;
  activo: boolean;
  onChange: () => void;
  deshabilitado?: boolean;
}) {
  return (
    <div className="config-opcion config-opcion--estatica">
      <span className="config-opcion__icono">
        {icono}
      </span>

      <span className="config-opcion__texto">
        <strong>{titulo}</strong>
        {subtitulo && <small>{subtitulo}</small>}
      </span>

      <Interruptor
        activo={activo}
        onChange={onChange}
        ariaLabel={titulo}
        deshabilitado={deshabilitado}
      />
    </div>
  );
}

function Modal({
  titulo,
  icono,
  onCerrar,
  children,
}: {
  titulo: string;
  icono: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="config-modal"
      role="presentation"
    >
      <button
        type="button"
        className="config-modal__fondo"
        aria-label="Cerrar modal"
        onClick={onCerrar}
      />

      <section
        className="config-modal__tarjeta"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="config-modal__encabezado">
          <div>
            {icono}
            <h3>{titulo}</h3>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
          >
            <X size={18} />
          </button>
        </header>

        <div className="config-modal__contenido">
          {children}
        </div>
      </section>
    </div>
  );
}

function ModalInformativo({
  titulo,
  icono,
  onCerrar,
  children,
}: {
  titulo: string;
  icono: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      titulo={titulo}
      icono={icono}
      onCerrar={onCerrar}
    >
      <div className="config-info">
        {children}
      </div>

      <button
        type="button"
        className="config-modal__guardar"
        onClick={onCerrar}
      >
        Entendido
      </button>
    </Modal>
  );
}