
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  CircleHelp,
  Cloud,
  Eye,
  EyeOff,
  ExternalLink,
  Goal,
  Info,
  KeyRound,
  LifeBuoy,
  Mail,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  actualizarNombre,
  actualizarPassword,
  actualizarTelefono,
  obtenerConfiguracion,
  type UsuarioConfiguracion,
} from "../../services/configuracionService";

import "./PanelUsuario.css";

interface PanelUsuarioProps {
  abierto: boolean;
  onCerrar: () => void;
  onAbrirConfiguracion: () => void;
}

type ModalActivo =
  | "perfil"
  | "informacion"
  | "cuenta"
  | "password"
  | "acerca"
  | "ayuda"
  | "terminos"
  | "faq"
  | null;

function inicialUsuario(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "U";
}

function obtenerMensaje(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Ocurrió un error inesperado";
}

function descargarRespaldo(): void {
  const datos: Record<string, unknown> = {};

  for (
    let indice = 0;
    indice < localStorage.length;
    indice += 1
  ) {
    const clave = localStorage.key(indice);

    if (!clave) continue;

    const valor = localStorage.getItem(clave);

    try {
      datos[clave] = valor ? JSON.parse(valor) : null;
    } catch {
      datos[clave] = valor;
    }
  }

  const blob = new Blob(
    [
      JSON.stringify(
        {
          aplicacion: "Balance Digital",
          version: "1.0.0",
          creadoEn: new Date().toISOString(),
          datos,
        },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = `balance-digital-respaldo-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export default function PanelUsuario({
  abierto,
  onCerrar,
  onAbrirConfiguracion,
}: PanelUsuarioProps) {
  const navigate = useNavigate();
  const { cerrar } = useAuth();
  const inputImportar = useRef<HTMLInputElement>(null);

  const [usuario, setUsuario] =
    useState<UsuarioConfiguracion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [modalActivo, setModalActivo] =
    useState<ModalActivo>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const [passwordActual, setPasswordActual] =
    useState("");
  const [passwordNueva, setPasswordNueva] =
    useState("");
  const [confirmacion, setConfirmacion] =
    useState("");
  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const nombreVisible = useMemo(
    () =>
      usuario?.nombre?.trim() ||
      usuario?.correo?.split("@")[0] ||
      "Usuario",
    [usuario]
  );

  async function cargarUsuario(): Promise<void> {
    setCargando(true);
    setError("");

    try {
      const respuesta = await obtenerConfiguracion();
      setUsuario(respuesta.usuario);
      setNombre(respuesta.usuario.nombre);
      setTelefono(respuesta.usuario.telefono ?? "");
    } catch (errorDesconocido) {
      setError(obtenerMensaje(errorDesconocido));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (abierto) {
      void cargarUsuario();
    }
  }, [abierto]);

  function abrirModal(tipo: ModalActivo): void {
    setMensaje("");
    setError("");
    setModalActivo(tipo);
  }

  function cerrarModal(): void {
    setModalActivo(null);
    setMensaje("");
    setError("");
    setPasswordActual("");
    setPasswordNueva("");
    setConfirmacion("");
  }

  async function guardarPerfil(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();
    setCargando(true);
    setMensaje("");
    setError("");

    const nombreLimpio = nombre.trim();
    const telefonoLimpio = telefono.replace(/\D/g, "");

    if (nombreLimpio.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      setCargando(false);
      return;
    }

    if (
      telefonoLimpio &&
      telefonoLimpio.length !== 10
    ) {
      setError("El teléfono debe tener 10 dígitos");
      setCargando(false);
      return;
    }

    try {
      await actualizarNombre(nombreLimpio);

      if (telefonoLimpio) {
        await actualizarTelefono(telefonoLimpio);
      }

      await cargarUsuario();
      setMensaje("Perfil actualizado correctamente");
    } catch (errorDesconocido) {
      setError(obtenerMensaje(errorDesconocido));
    } finally {
      setCargando(false);
    }
  }

  async function guardarPassword(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();
    setCargando(true);
    setMensaje("");
    setError("");

    if (passwordNueva.length < 8) {
      setError(
        "La nueva contraseña debe tener al menos 8 caracteres"
      );
      setCargando(false);
      return;
    }

    if (passwordNueva !== confirmacion) {
      setError("Las contraseñas no coinciden");
      setCargando(false);
      return;
    }

    try {
      await actualizarPassword(
        passwordActual,
        passwordNueva,
        confirmacion
      );

      setMensaje("Contraseña actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setConfirmacion("");
    } catch (errorDesconocido) {
      setError(obtenerMensaje(errorDesconocido));
    } finally {
      setCargando(false);
    }
  }

  async function cambiarCuenta(): Promise<void> {
    onCerrar();
    await cerrar();
    navigate("/login");
  }

  function irA(ruta: string): void {
    onCerrar();
    navigate(ruta);
  }

  async function importarRespaldo(
    evento: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const archivo = evento.target.files?.[0];

    if (!archivo) return;

    setMensaje("");
    setError("");

    try {
      const contenido = JSON.parse(await archivo.text());

      if (
        !contenido ||
        typeof contenido !== "object" ||
        !contenido.datos ||
        typeof contenido.datos !== "object"
      ) {
        throw new Error(
          "El archivo no corresponde a un respaldo válido"
        );
      }

      Object.entries(
        contenido.datos as Record<string, unknown>
      ).forEach(([clave, valor]) => {
        localStorage.setItem(
          clave,
          typeof valor === "string"
            ? valor
            : JSON.stringify(valor)
        );
      });

      setMensaje(
        "Respaldo importado. Recarga la página para aplicar los cambios."
      );
    } catch (errorDesconocido) {
      setError(obtenerMensaje(errorDesconocido));
    } finally {
      evento.target.value = "";
    }
  }

  if (!abierto) return null;

  return (
    <div
      className="panel-usuario-backdrop"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          onCerrar();
        }
      }}
    >
      <aside className="panel-usuario">
        <header className="panel-usuario__encabezado">
          <div className="panel-usuario__titulo">
            <UserRound size={19} />
            <h2>Usuario</h2>
          </div>

          <button
            type="button"
            className="panel-usuario__cerrar"
            onClick={onCerrar}
          >
            <X size={20} />
          </button>

          <div className="panel-usuario__perfil">
            <div className="panel-usuario__avatar">
              {inicialUsuario(nombreVisible)}
            </div>

            <div className="panel-usuario__identidad">
              <strong>{nombreVisible}</strong>
              <span>
                {usuario?.correo ?? "Cargando correo..."}
              </span>
              <small>
                <span className="panel-usuario__google">
                  {usuario?.proveedor === "google"
                    ? "G"
                    : "✓"}
                </span>
                {usuario?.proveedor === "google"
                  ? "Cuenta Google vinculada"
                  : "Cuenta local activa"}
              </small>
            </div>

            <button
              type="button"
              className="panel-usuario__editar"
              onClick={() => abrirModal("perfil")}
            >
              <Pencil size={14} />
              Editar
            </button>
          </div>
        </header>

        <div className="panel-usuario__scroll">
          {error && !modalActivo ? (
            <div className="panel-usuario__mensaje panel-usuario__mensaje--error">
              {error}
            </div>
          ) : null}

          <Seccion titulo="Mi perfil" icono="👤">
            <Opcion
              icono={<UserRound size={18} />}
              titulo="Mi Perfil"
              descripcion="Nombre, foto y datos básicos"
              onClick={() => abrirModal("perfil")}
            />

            <Opcion
              icono={<Mail size={18} />}
              titulo="Información Personal"
              descripcion="Ver todos tus datos"
              onClick={() => abrirModal("informacion")}
            />

            <Opcion
              icono={<Mail size={18} />}
              titulo="Cuenta Vinculada"
              descripcion={
                usuario?.proveedor === "google"
                  ? "Google · Activa"
                  : "Cuenta local · Activa"
              }
              valor="Activa"
              onClick={() => abrirModal("cuenta")}
            />

            <Opcion
              icono={<KeyRound size={18} />}
              titulo="Cambiar contraseña"
              descripcion={
                usuario?.proveedor === "google"
                  ? "Administrada por Google"
                  : "Actualiza tu contraseña"
              }
              onClick={() => {
                if (usuario?.proveedor === "google") {
                  setMensaje(
                    "La contraseña de esta cuenta se administra desde Google."
                  );
                  return;
                }

                abrirModal("password");
              }}
            />

            <Opcion
              icono={<RefreshCcw size={18} />}
              titulo="Cambiar de cuenta"
              onClick={() => void cambiarCuenta()}
            />
          </Seccion>

          <Seccion titulo="Finanzas" icono="💰">
            <Opcion
              icono={<Tag size={18} />}
              titulo="Categorías de Gastos"
              descripcion="Administrar categorías"
              onClick={() => irA("/movimientos")}
            />

            <Opcion
              icono={<WalletCards size={18} />}
              titulo="Presupuesto Mensual"
              descripcion="Consultar presupuestos"
              onClick={() => irA("/presupuestos")}
            />

            <Opcion
              icono={<Goal size={18} />}
              titulo="Metas de Ahorro"
              descripcion="Revisar metas en progreso"
              onClick={() => irA("/metas")}
            />
          </Seccion>

          <Seccion titulo="Datos" icono="📊">
            <Opcion
              icono={<BarChart3 size={18} />}
              titulo="Exportar Reportes"
              descripcion="PDF, Excel o CSV"
              onClick={() => irA("/reportes")}
            />

            <Opcion
              icono={<Cloud size={18} />}
              titulo="Respaldo de Datos"
              descripcion="Descargar respaldo JSON"
              onClick={descargarRespaldo}
            />

            <Opcion
              icono={<Upload size={18} />}
              titulo="Importar Datos"
              descripcion="Archivo JSON de Balance Digital"
              onClick={() =>
                inputImportar.current?.click()
              }
            />

            <input
              ref={inputImportar}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(evento) =>
                void importarRespaldo(evento)
              }
            />
          </Seccion>

          <Seccion titulo="Aplicación" icono="ℹ️">
            <Opcion
              icono={<Info size={18} />}
              titulo="Acerca de"
              descripcion="Balance Digital v1.0.0"
              onClick={() => abrirModal("acerca")}
            />

            <Opcion
              icono={<CircleHelp size={18} />}
              titulo="Ayuda y Soporte"
              descripcion="Centro de ayuda"
              onClick={() => abrirModal("ayuda")}
            />

            <Opcion
              icono={<ShieldCheck size={18} />}
              titulo="Términos y Condiciones"
              onClick={() => abrirModal("terminos")}
            />

            <Opcion
              icono={<BookOpen size={18} />}
              titulo="Preguntas Frecuentes"
              onClick={() => abrirModal("faq")}
            />
          </Seccion>

          {mensaje ? (
            <div className="panel-usuario__mensaje">
              {mensaje}
            </div>
          ) : null}

          <button
            type="button"
            className="panel-usuario__configuracion"
            onClick={() => {
              onCerrar();
              onAbrirConfiguracion();
            }}
          >
            Abrir configuración avanzada
          </button>
        </div>
      </aside>

      {modalActivo ? (
        <ModalUsuario
          titulo={
            modalActivo === "perfil"
              ? "Editar perfil"
              : modalActivo === "informacion"
                ? "Información personal"
                : modalActivo === "cuenta"
                  ? "Cuenta vinculada"
                  : modalActivo === "password"
                  ? "Cambiar contraseña"
                  : modalActivo === "acerca"
                    ? "Acerca de Balance Digital"
                    : modalActivo === "ayuda"
                      ? "Ayuda y Soporte"
                      : modalActivo === "terminos"
                        ? "Términos y Condiciones"
                        : "Preguntas Frecuentes"
          }
          onCerrar={cerrarModal}
        >
          {modalActivo === "perfil" ? (
            <form
              className="panel-usuario-form"
              onSubmit={(evento) =>
                void guardarPerfil(evento)
              }
            >
              <label>
                Nombre
                <input
                  value={nombre}
                  onChange={(evento) =>
                    setNombre(evento.target.value)
                  }
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  value={telefono}
                  onChange={(evento) =>
                    setTelefono(
                      evento.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  inputMode="numeric"
                  placeholder="10 dígitos"
                />
              </label>

              <EstadoFormulario
                error={error}
                mensaje={mensaje}
              />

              <button
                type="submit"
                disabled={cargando}
              >
                {cargando
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </form>
          ) : null}

          {modalActivo === "informacion" ? (
            <div className="panel-usuario-info">
              <Dato
                etiqueta="Nombre"
                valor={usuario?.nombre ?? "—"}
              />
              <Dato
                etiqueta="Apellido"
                valor={usuario?.apellido ?? "—"}
              />
              <Dato
                etiqueta="Correo"
                valor={usuario?.correo ?? "—"}
              />
              <Dato
                etiqueta="Teléfono"
                valor={usuario?.telefono ?? "—"}
              />
              <Dato
                etiqueta="Tipo de cuenta"
                valor={
                  usuario?.proveedor === "google"
                    ? "Google"
                    : "Cuenta local"
                }
              />
            </div>
          ) : null}

          {modalActivo === "cuenta" ? (
            <CuentaVinculadaPremium
              correo={usuario?.correo ?? "Sin correo"}
              proveedor={usuario?.proveedor ?? "local"}
            />
          ) : null}

          {modalActivo === "password" ? (
            <form
              className="panel-usuario-form"
              onSubmit={(evento) =>
                void guardarPassword(evento)
              }
            >
              <CampoPassword
                etiqueta="Contraseña actual"
                valor={passwordActual}
                mostrar={mostrarPassword}
                onChange={setPasswordActual}
                onAlternar={() =>
                  setMostrarPassword(
                    (actual) => !actual
                  )
                }
              />

              <CampoPassword
                etiqueta="Nueva contraseña"
                valor={passwordNueva}
                mostrar={mostrarPassword}
                onChange={setPasswordNueva}
                onAlternar={() =>
                  setMostrarPassword(
                    (actual) => !actual
                  )
                }
              />

              <CampoPassword
                etiqueta="Confirmar contraseña"
                valor={confirmacion}
                mostrar={mostrarPassword}
                onChange={setConfirmacion}
                onAlternar={() =>
                  setMostrarPassword(
                    (actual) => !actual
                  )
                }
              />

              <EstadoFormulario
                error={error}
                mensaje={mensaje}
              />

              <button
                type="submit"
                disabled={cargando}
              >
                {cargando
                  ? "Actualizando..."
                  : "Actualizar contraseña"}
              </button>
            </form>
          ) : null}

          {modalActivo === "acerca" ? (
            <AcercaPremium />
          ) : null}

          {modalActivo === "ayuda" ? (
            <AyudaPremium />
          ) : null}

          {modalActivo === "terminos" ? (
            <TerminosPremium />
          ) : null}

          {modalActivo === "faq" ? (
            <FaqPremium />
          ) : null}
        </ModalUsuario>
      ) : null}
    </div>
  );
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: string;
  children: ReactNode;
}) {
  return (
    <section className="panel-usuario__seccion">
      <h3>
        <span>{icono}</span>
        {titulo}
      </h3>

      <div className="panel-usuario__grupo">
        {children}
      </div>
    </section>
  );
}

function Opcion({
  icono,
  titulo,
  descripcion,
  valor,
  onClick,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion?: string;
  valor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="panel-usuario__opcion"
      onClick={onClick}
    >
      <span className="panel-usuario__opcion-icono">
        {icono}
      </span>

      <span className="panel-usuario__opcion-texto">
        <strong>{titulo}</strong>
        {descripcion ? (
          <small>{descripcion}</small>
        ) : null}
      </span>

      {valor ? (
        <span className="panel-usuario__opcion-valor">
          {valor}
        </span>
      ) : (
        <ChevronRight size={17} />
      )}
    </button>
  );
}

function ModalUsuario({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  return (
    <div className="panel-usuario-modal-backdrop">
      <section className="panel-usuario-modal">
        <header>
          <span>
            <UserRound size={20} />
          </span>
          <h3>{titulo}</h3>

          <button
            type="button"
            onClick={onCerrar}
          >
            <X size={18} />
          </button>
        </header>

        <div className="panel-usuario-modal__contenido">
          {children}
        </div>
      </section>
    </div>
  );
}

function EstadoFormulario({
  error,
  mensaje,
}: {
  error: string;
  mensaje: string;
}) {
  return (
    <>
      {error ? (
        <p className="panel-usuario-form__error">
          {error}
        </p>
      ) : null}

      {mensaje ? (
        <p className="panel-usuario-form__exito">
          {mensaje}
        </p>
      ) : null}
    </>
  );
}

function CampoPassword({
  etiqueta,
  valor,
  mostrar,
  onChange,
  onAlternar,
}: {
  etiqueta: string;
  valor: string;
  mostrar: boolean;
  onChange: (valor: string) => void;
  onAlternar: () => void;
}) {
  return (
    <label>
      {etiqueta}
      <div className="panel-usuario-password">
        <input
          type={mostrar ? "text" : "password"}
          value={valor}
          onChange={(evento) =>
            onChange(evento.target.value)
          }
          required
        />

        <button
          type="button"
          onClick={onAlternar}
          aria-label={
            mostrar
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
        >
          {mostrar ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </label>
  );
}

function Dato({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <article>
      <span>{etiqueta}</span>
      <strong>{valor}</strong>
    </article>
  );
}

function CuentaVinculadaPremium({
  correo,
  proveedor,
}: {
  correo: string;
  proveedor: string;
}) {
  const esGoogle = proveedor === "google";

  return (
    <div className="usuario-premium usuario-premium--cuenta">
      <section className="usuario-cuenta-hero">
        <div className="usuario-google-logo" aria-hidden="true">
          G
        </div>

        <div>
          <span>Cuenta principal</span>
          <h4>{esGoogle ? "Google" : "Balance Digital"}</h4>
          <p>{correo}</p>
        </div>

        <span className="usuario-status-pill">
          <CheckCircle2 size={14} />
          Activa
        </span>
      </section>

      <div className="usuario-security-grid">
        <article>
          <ShieldCheck size={18} />
          <div>
            <strong>Acceso protegido</strong>
            <span>Sesión verificada y cifrada</span>
          </div>
        </article>

        <article>
          <Mail size={18} />
          <div>
            <strong>Correo confirmado</strong>
            <span>Listo para recuperación y avisos</span>
          </div>
        </article>
      </div>

      <div className="usuario-premium-note">
        <Sparkles size={16} />
        <p>
          Tu cuenta está vinculada correctamente y puede usar
          todas las funciones de Balance Digital.
        </p>
      </div>
    </div>
  );
}

function AcercaPremium() {
  return (
    <div className="usuario-premium usuario-premium--about">
      <section className="usuario-brand-hero">
        <div className="usuario-brand-mark">
          <BarChart3 size={27} />
        </div>
        <div>
          <span>Finanzas personales, simplificadas</span>
          <h4>Balance Digital</h4>
          <p>Versión 1.0.0 · Edición académica</p>
        </div>
      </section>

      <p className="usuario-premium-lead">
        Una plataforma diseñada para convertir tus movimientos
        diarios en decisiones financieras claras, medibles y
        sostenibles.
      </p>

      <div className="usuario-feature-grid">
        <article><WalletCards size={18} /><span>Presupuestos inteligentes</span></article>
        <article><Goal size={18} /><span>Metas de ahorro</span></article>
        <article><BarChart3 size={18} /><span>Reportes visuales</span></article>
        <article><Sparkles size={18} /><span>Flamma y logros</span></article>
      </div>

      <footer className="usuario-premium-footer">
        <span>Desarrollado con enfoque en seguridad, claridad y experiencia de usuario.</span>
      </footer>
    </div>
  );
}

function AyudaPremium() {
  return (
    <div className="usuario-premium">
      <section className="usuario-support-hero">
        <div className="usuario-support-icon"><LifeBuoy size={25} /></div>
        <div>
          <span>Centro de soporte</span>
          <h4>¿Cómo podemos ayudarte?</h4>
          <p>Encuentra una ruta rápida para resolver tus dudas.</p>
        </div>
      </section>

      <div className="usuario-help-list">
        <article>
          <span>01</span>
          <div><strong>Movimientos</strong><p>Registra ingresos y gastos y mantén tu balance actualizado.</p></div>
        </article>
        <article>
          <span>02</span>
          <div><strong>Presupuestos y metas</strong><p>Define límites mensuales y organiza objetivos de ahorro.</p></div>
        </article>
        <article>
          <span>03</span>
          <div><strong>Reportes y cierre mensual</strong><p>Analiza resultados y consulta tu ahorro real al terminar el mes.</p></div>
        </article>
      </div>

      <button type="button" className="usuario-support-action">
        <Mail size={16} />
        soporte@balancedigital.mx
        <ExternalLink size={14} />
      </button>
    </div>
  );
}

function TerminosPremium() {
  return (
    <div className="usuario-premium">
      <section className="usuario-legal-hero">
        <ShieldCheck size={27} />
        <div>
          <span>Confianza y transparencia</span>
          <h4>Términos esenciales</h4>
          <p>Última actualización: agosto de 2026</p>
        </div>
      </section>

      <div className="usuario-legal-list">
        <article>
          <strong>01 · Propiedad de la información</strong>
          <p>Los registros financieros pertenecen al usuario y se mantienen asociados únicamente a su cuenta.</p>
        </article>
        <article>
          <strong>02 · Uso responsable</strong>
          <p>Balance Digital organiza y analiza información, pero no sustituye asesoría financiera profesional.</p>
        </article>
        <article>
          <strong>03 · Seguridad y privacidad</strong>
          <p>La aplicación utiliza autenticación, verificación y controles de acceso para proteger la sesión.</p>
        </article>
      </div>

      <div className="usuario-legal-confirm">
        <CheckCircle2 size={16} />
        <span>Tu cuenta utiliza la versión vigente de estos términos.</span>
      </div>
    </div>
  );
}

function FaqPremium() {
  const preguntas = [
    ["¿Cómo funciona la racha?", "Aumenta una sola vez con el primer inicio de sesión de cada día."],
    ["¿Cuándo se calcula el ahorro?", "Al terminar el mes se comparan ingresos y gastos confirmados."],
    ["¿Cómo se desbloquean logros?", "Se obtienen al cumplir metas reales de ahorro y constancia mensual."],
    ["¿Puedo respaldar mis datos?", "Sí. Desde el panel puedes exportar e importar un respaldo JSON."],
  ];

  return (
    <div className="usuario-premium">
      <section className="usuario-faq-hero">
        <CircleHelp size={26} />
        <div>
          <span>Respuestas rápidas</span>
          <h4>Preguntas frecuentes</h4>
        </div>
      </section>

      <div className="usuario-faq-list">
        {preguntas.map(([pregunta, respuesta], indice) => (
          <details key={pregunta} open={indice === 0}>
            <summary>
              <span>{String(indice + 1).padStart(2, "0")}</span>
              {pregunta}
              <ChevronRight size={16} />
            </summary>
            <p>{respuesta}</p>
          </details>
        ))}
      </div>
    </div>
  );
}