import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
  Sparkles,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import logoBalanceDigital from "../../assets/logo/balance-digital-logo.png";
import {
  reenviarCodigoVerificacion,
  registrarUsuario,
  verificarCorreoRegistro,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

import "./Registro.css";

const CLAVE_CORREO_VERIFICACION =
  "bd_correo_verificacion";

function evaluarPassword(password: string): {
  nivel: number;
  etiqueta: string;
} {
  let nivel = 0;

  if (password.length >= 8) nivel += 1;
  if (/[A-Z]/.test(password)) nivel += 1;
  if (/[a-z]/.test(password) && /\d/.test(password)) {
    nivel += 1;
  }
  if (/[^A-Za-z0-9]/.test(password)) nivel += 1;

  const etiquetas = [
    "Muy débil",
    "Débil",
    "Aceptable",
    "Fuerte",
    "Excelente",
  ];

  return {
    nivel,
    etiqueta: etiquetas[nivel],
  };
}

export default function Registro() {
  const navigate = useNavigate();
  const { iniciar } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] =
    useState("");

  const [mostrarPassword, setMostrarPassword] =
    useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);
  const [aceptaTerminos, setAceptaTerminos] =
    useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [
    esperandoVerificacion,
    setEsperandoVerificacion,
  ] = useState(false);

  const [correoPendiente, setCorreoPendiente] =
    useState("");

  const [
    codigoVerificacion,
    setCodigoVerificacion,
  ] = useState("");

  const [
    mensajeVerificacion,
    setMensajeVerificacion,
  ] = useState("");

  const [reenviando, setReenviando] =
    useState(false);

  const [bienvenidaActiva, setBienvenidaActiva] =
    useState(false);

  const [
    usuarioBienvenida,
    setUsuarioBienvenida,
  ] = useState("");

  const [
    tokenBienvenida,
    setTokenBienvenida,
  ] = useState("");

  const [
    usuarioVerificado,
    setUsuarioVerificado,
  ] = useState<
    Awaited<
      ReturnType<typeof verificarCorreoRegistro>
    >["usuario"] | null
  >(null);

  const seguridad = useMemo(
    () => evaluarPassword(password),
    [password]
  );

  useEffect(() => {
    const correoGuardado = localStorage.getItem(
      CLAVE_CORREO_VERIFICACION
    );

    if (!correoGuardado) {
      return;
    }

    const correoNormalizado = correoGuardado
      .trim()
      .toLowerCase();

    if (!correoNormalizado) {
      localStorage.removeItem(
        CLAVE_CORREO_VERIFICACION
      );
      return;
    }

    setCorreo(correoNormalizado);
    setCorreoPendiente(correoNormalizado);
    setEsperandoVerificacion(true);

    setMensajeVerificacion(
      "Tienes una verificación pendiente. Ingresa el código que recibiste o solicita uno nuevo."
    );
  }, []);

  function abrirVerificacionPendiente(
    correoPendienteNuevo: string,
    mensaje?: string
  ): void {
    const correoNormalizado =
      correoPendienteNuevo.trim().toLowerCase();

    localStorage.setItem(
      CLAVE_CORREO_VERIFICACION,
      correoNormalizado
    );

    setCorreo(correoNormalizado);
    setCorreoPendiente(correoNormalizado);

    setEsperandoVerificacion(true);
    setCodigoVerificacion("");

    setMensajeVerificacion(
      mensaje ||
        "Ingresa el código que enviamos a tu correo."
    );

    setError("");
  }

  function limpiarVerificacionPendiente(): void {
    localStorage.removeItem(
      CLAVE_CORREO_VERIFICACION
    );

    setEsperandoVerificacion(false);
    setCorreoPendiente("");
    setCodigoVerificacion("");
    setMensajeVerificacion("");
    setError("");
  }

  async function manejarRegistro(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();

    setError("");

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();

    const correoLimpio = correo
      .trim()
      .toLowerCase();

    const telefonoLimpio =
      telefono.replace(/\D/g, "");

    if (nombreLimpio.length < 2) {
      setError("Escribe un nombre válido");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correoLimpio
      )
    ) {
      setError("Escribe un correo válido");
      return;
    }

    if (
      telefonoLimpio &&
      telefonoLimpio.length !== 10
    ) {
      setError(
        "El teléfono debe tener 10 dígitos"
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres"
      );
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(
        "La contraseña debe incluir al menos una mayúscula"
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError(
        "La contraseña debe incluir al menos una minúscula"
      );
      return;
    }

    if (!/\d/.test(password)) {
      setError(
        "La contraseña debe incluir al menos un número"
      );
      return;
    }

    if (password !== confirmarPassword) {
      setError(
        "Las contraseñas no coinciden"
      );
      return;
    }

    if (!aceptaTerminos) {
      setError(
        "Acepta los términos para crear tu cuenta"
      );
      return;
    }

    setCargando(true);

    try {
      const respuesta =
        await registrarUsuario({
          nombre: nombreLimpio,
          apellido:
            apellidoLimpio || undefined,
          correo: correoLimpio,
          telefono:
            telefonoLimpio || undefined,
          password,
        });

      abrirVerificacionPendiente(
        respuesta.correo,
        respuesta.mensaje
      );
    } catch (errorDesconocido) {
      const mensaje =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo crear la cuenta";

      const mensajeMinusculas =
        mensaje.toLowerCase();

      const esRegistroPendiente =
        mensajeMinusculas.includes(
          "registro pendiente"
        ) ||
        mensajeMinusculas.includes(
          "reenviar código"
        ) ||
        mensajeMinusculas.includes(
          "reenviar codigo"
        ) ||
        mensajeMinusculas.includes(
          "verificación pendiente"
        ) ||
        mensajeMinusculas.includes(
          "verificacion pendiente"
        );

      if (esRegistroPendiente) {
        abrirVerificacionPendiente(
          correoLimpio,
          "Tu cuenta todavía está pendiente de verificación. Ingresa el código que recibiste o solicita uno nuevo."
        );

        return;
      }

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  async function manejarVerificacion(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();

    const codigo =
      codigoVerificacion
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!correoPendiente) {
      setError(
        "No encontramos el correo pendiente de verificación"
      );
      return;
    }

    if (codigo.length !== 6) {
      setError(
        "Escribe el código de 6 dígitos"
      );
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta =
        await verificarCorreoRegistro(
          correoPendiente,
          codigo
        );

      localStorage.removeItem(
        CLAVE_CORREO_VERIFICACION
      );

      setUsuarioBienvenida(
        respuesta.usuario.nombre
      );

      setTokenBienvenida(
        respuesta.token
      );

      setUsuarioVerificado(
        respuesta.usuario
      );

      setBienvenidaActiva(true);

      setMensajeVerificacion("");
      setCodigoVerificacion("");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo verificar el correo"
      );
    } finally {
      setCargando(false);
    }
  }

  async function reenviarCodigo(): Promise<void> {
    if (!correoPendiente) {
      setError(
        "No encontramos un correo pendiente de verificación"
      );
      return;
    }

    setReenviando(true);
    setError("");
    setMensajeVerificacion("");

    try {
      const respuesta =
        await reenviarCodigoVerificacion(
          correoPendiente
        );

      localStorage.setItem(
        CLAVE_CORREO_VERIFICACION,
        correoPendiente
      );

      setMensajeVerificacion(
        respuesta.mensaje
      );

      setCodigoVerificacion("");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo reenviar el código"
      );
    } finally {
      setReenviando(false);
    }
  }

  function entrarAlDashboard(): void {
    if (
      !usuarioVerificado ||
      !tokenBienvenida
    ) {
      return;
    }

    iniciar(
      usuarioVerificado,
      tokenBienvenida,
      true
    );

    navigate("/dashboard");
  }

  return (
    <main className="registro-page">
      <div className="registro-orbe registro-orbe--uno" />
      <div className="registro-orbe registro-orbe--dos" />

      <section className="registro-shell">
        <aside className="registro-presentacion">
          <img
            src={logoBalanceDigital}
            alt="Balance Digital"
            className="registro-logo"
          />

          <div className="registro-presentacion__contenido">
            <span className="registro-etiqueta">
              <ShieldCheck size={16} />
              Finanzas claras desde el primer día
            </span>

            <h1>
              Empieza a construir una vida financiera
              <span> más ordenada.</span>
            </h1>

            <p>
              Registra ingresos, controla gastos,
              crea metas y entiende mejor cómo se
              mueve tu dinero.
            </p>

            <div className="registro-beneficios">
              <div>
                <Check size={17} />
                <span>
                  Panel financiero completo
                </span>
              </div>

              <div>
                <Check size={17} />
                <span>
                  Protección con verificación en 2 pasos
                </span>
              </div>

              <div>
                <Check size={17} />
                <span>
                  Reportes y metas personalizadas
                </span>
              </div>
            </div>
          </div>
        </aside>

        <section className="registro-card">
          <Link
            to="/login"
            className="registro-volver"
          >
            <ArrowLeft size={17} />
            Volver al inicio
          </Link>

          {esperandoVerificacion ? (
            <form
              onSubmit={manejarVerificacion}
              className="registro-verificacion"
            >
              <div className="registro-verificacion__icono">
                <Mail size={30} />
              </div>

              <header className="registro-card__header registro-card__header--verificacion">
                <span>ÚLTIMO PASO</span>

                <h2>
                  Verifica tu correo
                </h2>

                <p>
                  Enviamos un código de 6
                  dígitos a:
                </p>

                <strong>
                  {correoPendiente}
                </strong>
              </header>

              <div className="registro-verificacion__estado">
                <CheckCircle2 size={17} />

                <span>
                  {mensajeVerificacion ||
                    "Revisa tu bandeja de entrada y correo no deseado."}
                </span>
              </div>

              <label className="registro-campo">
                <span>
                  CÓDIGO DE VERIFICACIÓN
                </span>

                <div className="registro-input registro-input--codigo">
                  <ShieldCheck size={18} />

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={
                      codigoVerificacion
                    }
                    maxLength={6}
                    onChange={(evento) => {
                      setCodigoVerificacion(
                        evento.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      );

                      setError("");
                    }}
                    placeholder="000000"
                    autoFocus
                    required
                  />
                </div>
              </label>

              {error && (
                <div
                  className="registro-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="registro-submit"
                disabled={
                  cargando ||
                  codigoVerificacion.length !==
                    6
                }
              >
                {cargando
                  ? "Verificando..."
                  : "Verificar y entrar"}
              </button>

              <button
                type="button"
                className="registro-reenviar"
                disabled={
                  reenviando || cargando
                }
                onClick={() =>
                  void reenviarCodigo()
                }
              >
                <RefreshCw
                  size={15}
                  className={
                    reenviando
                      ? "registro-reenviar__girando"
                      : ""
                  }
                />

                {reenviando
                  ? "Enviando..."
                  : "Reenviar código"}
              </button>

              <button
                type="button"
                className="registro-cambiar-correo"
                disabled={
                  reenviando || cargando
                }
                onClick={
                  limpiarVerificacionPendiente
                }
              >
                Cambiar correo o datos
              </button>
            </form>
          ) : (
            <>
              <header className="registro-card__header">
                <span>
                  CREA TU CUENTA
                </span>

                <h2>
                  Bienvenido a Balance Digital
                </h2>

                <p>
                  Completa tus datos para
                  comenzar.
                </p>
              </header>

              <form
                onSubmit={manejarRegistro}
                className="registro-form"
              >
                <div className="registro-grid">
                  <label className="registro-campo">
                    <span>
                      NOMBRE
                    </span>

                    <div className="registro-input">
                      <UserRound
                        size={18}
                      />

                      <input
                        type="text"
                        value={nombre}
                        onChange={(
                          evento
                        ) => {
                          setNombre(
                            evento.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="Tu nombre"
                        autoComplete="given-name"
                        required
                      />
                    </div>
                  </label>

                  <label className="registro-campo">
                    <span>
                      APELLIDO
                    </span>

                    <div className="registro-input">
                      <UserRound
                        size={18}
                      />

                      <input
                        type="text"
                        value={apellido}
                        onChange={(
                          evento
                        ) => {
                          setApellido(
                            evento.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="Tu apellido"
                        autoComplete="family-name"
                      />
                    </div>
                  </label>
                </div>

                <label className="registro-campo">
                  <span>
                    CORREO ELECTRÓNICO
                  </span>

                  <div className="registro-input">
                    <Mail size={18} />

                    <input
                      type="email"
                      value={correo}
                      onChange={(
                        evento
                      ) => {
                        setCorreo(
                          evento.target
                            .value
                        );

                        setError("");
                      }}
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                <label className="registro-campo">
                  <span>
                    TELÉFONO
                  </span>

                  <div className="registro-input">
                    <Phone size={18} />

                    <input
                      type="tel"
                      inputMode="numeric"
                      value={telefono}
                      onChange={(
                        evento
                      ) => {
                        setTelefono(
                          evento.target
                            .value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(0, 10)
                        );

                        setError("");
                      }}
                      placeholder="10 dígitos"
                      autoComplete="tel"
                    />
                  </div>
                </label>

                <div className="registro-grid">
                  <label className="registro-campo">
                    <span>
                      CONTRASEÑA
                    </span>

                    <div className="registro-input">
                      <LockKeyhole
                        size={18}
                      />

                      <input
                        type={
                          mostrarPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(
                          evento
                        ) => {
                          setPassword(
                            evento.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarPassword(
                            (valor) =>
                              !valor
                          )
                        }
                        aria-label={
                          mostrarPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {mostrarPassword ? (
                          <EyeOff
                            size={17}
                          />
                        ) : (
                          <Eye
                            size={17}
                          />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="registro-campo">
                    <span>
                      CONFIRMAR CONTRASEÑA
                    </span>

                    <div className="registro-input">
                      <LockKeyhole
                        size={18}
                      />

                      <input
                        type={
                          mostrarConfirmacion
                            ? "text"
                            : "password"
                        }
                        value={
                          confirmarPassword
                        }
                        onChange={(
                          evento
                        ) => {
                          setConfirmarPassword(
                            evento.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarConfirmacion(
                            (valor) =>
                              !valor
                          )
                        }
                        aria-label={
                          mostrarConfirmacion
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {mostrarConfirmacion ? (
                          <EyeOff
                            size={17}
                          />
                        ) : (
                          <Eye
                            size={17}
                          />
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="registro-seguridad">
                  <div className="registro-seguridad__barra">
                    {[1, 2, 3, 4].map(
                      (nivel) => (
                        <i
                          key={nivel}
                          className={
                            seguridad.nivel >=
                            nivel
                              ? "registro-seguridad__activo"
                              : ""
                          }
                        />
                      )
                    )}
                  </div>

                  <span>
                    {seguridad.etiqueta}
                  </span>
                </div>

                <label className="registro-terminos">
                  <input
                    type="checkbox"
                    checked={
                      aceptaTerminos
                    }
                    onChange={(
                      evento
                    ) => {
                      setAceptaTerminos(
                        evento.target
                          .checked
                      );

                      setError("");
                    }}
                  />

                  <span>
                    Acepto los términos y
                    el aviso de privacidad.
                  </span>
                </label>

                {error && (
                  <div
                    className="registro-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="registro-submit"
                  disabled={cargando}
                >
                  {cargando
                    ? "Creando cuenta..."
                    : "Crear cuenta"}
                </button>

                <p className="registro-login">
                  ¿Ya tienes cuenta?{" "}
                  <Link to="/login">
                    Iniciar sesión
                  </Link>
                </p>
              </form>
            </>
          )}
        </section>
      </section>

      {bienvenidaActiva && (
        <div className="bienvenida-premium__fondo">
          <section
            className="bienvenida-premium"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenida a Balance Digital"
          >
            <div className="bienvenida-premium__brillo bienvenida-premium__brillo--uno" />

            <div className="bienvenida-premium__brillo bienvenida-premium__brillo--dos" />

            <div className="bienvenida-premium__icono">
              <Sparkles size={34} />
            </div>

            <span className="bienvenida-premium__etiqueta">
              CUENTA ACTIVADA
            </span>

            <h2>
              Bienvenido a Balance Digital,
              <strong>
                {" "}
                {usuarioBienvenida}
              </strong>
            </h2>

            <p className="bienvenida-premium__mensaje">
              Hoy comienza una nueva etapa para
              tomar decisiones más claras,
              construir mejores hábitos y avanzar
              con seguridad hacia tus objetivos
              financieros.
            </p>

            <div className="bienvenida-premium__frase">
              <span>“</span>

              <p>
                Cada gran resultado financiero
                comienza con una decisión
                consciente. Este es tu primer
                paso.
              </p>
            </div>

            <div className="bienvenida-premium__beneficios">
              <div>
                <CheckCircle2
                  size={17}
                />

                <span>
                  Tu información está
                  protegida
                </span>
              </div>

              <div>
                <CheckCircle2
                  size={17}
                />

                <span>
                  Tus metas comienzan
                  desde hoy
                </span>
              </div>

              <div>
                <CheckCircle2
                  size={17}
                />

                <span>
                  Tu panel está listo
                  para ti
                </span>
              </div>
            </div>

            <button
              type="button"
              className="bienvenida-premium__boton"
              onClick={
                entrarAlDashboard
              }
            >
              Explorar mi panel

              <ArrowLeft
                size={18}
                className="bienvenida-premium__flecha"
              />
            </button>

            <small>
              Balance Digital · Tu progreso
              empieza aquí
            </small>
          </section>
        </div>
      )}
    </main>
  );
}