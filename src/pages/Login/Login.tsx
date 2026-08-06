
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  iniciarSesion,
  restablecerPassword,
  solicitarRecuperacionPassword,
  verificarCodigoRecuperacion,
  verificarSegundoPaso,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import logoBalanceDigital from "../../assets/logo/balance-digital-logo.png";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { iniciar } = useAuth();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [requiere2FA, setRequiere2FA] =
    useState(false);
  const [desafioToken, setDesafioToken] =
    useState("");
  const [codigo2FA, setCodigo2FA] = useState("");
  const [confiarDispositivo, setConfiarDispositivo] =
    useState(false);

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [recuperacionAbierta, setRecuperacionAbierta] =
    useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] =
    useState<1 | 2 | 3 | 4>(1);
  const [correoRecuperacion, setCorreoRecuperacion] =
    useState("");
  const [codigoRecuperacion, setCodigoRecuperacion] =
    useState("");
  const [tokenRecuperacion, setTokenRecuperacion] =
    useState("");
  const [nuevaPassword, setNuevaPassword] =
    useState("");
  const [confirmarNuevaPassword, setConfirmarNuevaPassword] =
    useState("");
  const [errorRecuperacion, setErrorRecuperacion] =
    useState("");
  const [mensajeRecuperacion, setMensajeRecuperacion] =
    useState("");
  const [procesandoRecuperacion, setProcesandoRecuperacion] =
    useState(false);

  const inputCodigoRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (requiere2FA) {
      inputCodigoRef.current?.focus();
    }
  }, [requiere2FA]);

  function abrirRecuperacion(): void {
    setRecuperacionAbierta(true);
    setPasoRecuperacion(1);
    setCorreoRecuperacion(correo.trim());
    setCodigoRecuperacion("");
    setTokenRecuperacion("");
    setNuevaPassword("");
    setConfirmarNuevaPassword("");
    setErrorRecuperacion("");
    setMensajeRecuperacion("");
  }

  function cerrarRecuperacion(): void {
    if (procesandoRecuperacion) return;
    setRecuperacionAbierta(false);
  }

  async function solicitarCodigo(): Promise<void> {
    const correoLimpio =
      correoRecuperacion.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correoLimpio
      )
    ) {
      setErrorRecuperacion(
        "Escribe un correo electrónico válido"
      );
      return;
    }

    setProcesandoRecuperacion(true);
    setErrorRecuperacion("");
    setMensajeRecuperacion("");

    try {
      const respuesta =
        await solicitarRecuperacionPassword(
          correoLimpio
        );

      setCorreoRecuperacion(correoLimpio);
      setMensajeRecuperacion(respuesta.mensaje);
      setPasoRecuperacion(2);
    } catch (errorDesconocido) {
      setErrorRecuperacion(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo generar el código"
      );
    } finally {
      setProcesandoRecuperacion(false);
    }
  }

  async function comprobarCodigo(): Promise<void> {
    const codigo =
      codigoRecuperacion.replace(/\D/g, "");

    if (codigo.length !== 6) {
      setErrorRecuperacion(
        "Escribe el código de 6 dígitos"
      );
      return;
    }

    setProcesandoRecuperacion(true);
    setErrorRecuperacion("");

    try {
      const respuesta =
        await verificarCodigoRecuperacion(
          correoRecuperacion,
          codigo
        );

      setTokenRecuperacion(
        respuesta.tokenRecuperacion
      );
      setPasoRecuperacion(3);
    } catch (errorDesconocido) {
      setErrorRecuperacion(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "El código no es válido"
      );
    } finally {
      setProcesandoRecuperacion(false);
    }
  }

  async function cambiarPassword(): Promise<void> {
    if (nuevaPassword.length < 8) {
      setErrorRecuperacion(
        "La contraseña debe tener al menos 8 caracteres"
      );
      return;
    }

    if (
      !/[A-Z]/.test(nuevaPassword) ||
      !/[a-z]/.test(nuevaPassword) ||
      !/\d/.test(nuevaPassword)
    ) {
      setErrorRecuperacion(
        "Incluye mayúscula, minúscula y número"
      );
      return;
    }

    if (nuevaPassword !== confirmarNuevaPassword) {
      setErrorRecuperacion(
        "Las contraseñas no coinciden"
      );
      return;
    }

    setProcesandoRecuperacion(true);
    setErrorRecuperacion("");

    try {
      const respuesta = await restablecerPassword(
        tokenRecuperacion,
        nuevaPassword
      );

      setMensajeRecuperacion(respuesta.mensaje);
      setPassword("");
      setCorreo(correoRecuperacion);
      setPasoRecuperacion(4);
    } catch (errorDesconocido) {
      setErrorRecuperacion(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo actualizar la contraseña"
      );
    } finally {
      setProcesandoRecuperacion(false);
    }
  }

  function volverACredenciales(): void {
    setRequiere2FA(false);
    setDesafioToken("");
    setCodigo2FA("");
    setConfiarDispositivo(false);
    setError("");
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>
  ): Promise<void> {
    evento.preventDefault();

    setError("");
    setCargando(true);

    try {
      if (requiere2FA) {
        const respuesta =
          await verificarSegundoPaso(
            desafioToken,
            codigo2FA,
            confiarDispositivo
          );

        iniciar(
          respuesta.usuario,
          respuesta.token,
          recordar
        );

        navigate("/dashboard");
        return;
      }

      const respuesta = await iniciarSesion(
        correo,
        password
      );

      if (respuesta.requiere2FA) {
        setDesafioToken(respuesta.desafioToken);
        setRequiere2FA(true);
        setCodigo2FA("");
        return;
      }

      iniciar(
        respuesta.usuario,
        respuesta.token,
        recordar
      );

      navigate("/dashboard");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo iniciar sesión"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-decoration login-decoration-top" />
      <div className="login-decoration login-decoration-bottom" />

      <section className="login-container">
        <div className="login-brand">
          <img
            src={logoBalanceDigital}
            alt="Balance Digital"
            className="login-logo"
          />
        </div>

        <form
          className={
            requiere2FA
              ? "login-card login-card--2fa"
              : "login-card"
          }
          onSubmit={manejarEnvio}
        >
          {requiere2FA ? (
            <>
              <button
                type="button"
                className="login-2fa__volver"
                onClick={volverACredenciales}
              >
                <ArrowLeft size={17} />
                Volver
              </button>

              <div className="login-2fa__icono">
                <ShieldCheck size={34} />
              </div>

              <header className="login-card-header login-card-header--2fa">
                <h1>Verificación en 2 pasos</h1>
                <p>
                  Abre tu aplicación autenticadora e
                  introduce el código de 6 dígitos.
                </p>
              </header>

              <div className="login-field">
                <label htmlFor="codigo-2fa">
                  CÓDIGO DE SEGURIDAD
                </label>

                <div className="login-input-container login-input-container--codigo">
                  <KeyRound
                    size={19}
                    strokeWidth={1.8}
                    className="login-input-icon"
                  />

                  <input
                    ref={inputCodigoRef}
                    id="codigo-2fa"
                    name="codigo-2fa"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={codigo2FA}
                    maxLength={11}
                    onChange={(evento) => {
                      setCodigo2FA(
                        evento.target.value
                          .toUpperCase()
                          .replace(
                            /[^A-Z0-9-]/g,
                            ""
                          )
                      );
                      setError("");
                    }}
                    required
                  />
                </div>

                <small className="login-2fa__ayuda">
                  También puedes usar uno de tus códigos
                  de recuperación.
                </small>
              </div>

              <label className="login-remember login-2fa__confianza">
                <input
                  type="checkbox"
                  checked={confiarDispositivo}
                  onChange={(evento) =>
                    setConfiarDispositivo(
                      evento.target.checked
                    )
                  }
                />

                <span>
                  Confiar en este dispositivo
                </span>
              </label>
            </>
          ) : (
            <>
              <header className="login-card-header">
                <h1>Iniciar sesión</h1>
                <p>Bienvenido de vuelta</p>
              </header>

              <div className="login-field">
                <label htmlFor="correo">
                  NOMBRE DE USUARIO / CORREO
                </label>

                <div className="login-input-container">
                  <UserRound
                    size={19}
                    strokeWidth={1.8}
                    className="login-input-icon"
                  />

                  <input
                    id="correo"
                    name="correo"
                    type="text"
                    value={correo}
                    onChange={(evento) =>
                      setCorreo(
                        evento.target.value
                      )
                    }
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password">
                  CONTRASEÑA
                </label>

                <div className="login-input-container">
                  <KeyRound
                    size={19}
                    strokeWidth={1.8}
                    className="login-input-icon"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      mostrarPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(evento) =>
                      setPassword(
                        evento.target.value
                      )
                    }
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-password-button"
                    onClick={() =>
                      setMostrarPassword(
                        (valorActual) =>
                          !valorActual
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
                        size={18}
                        strokeWidth={1.8}
                      />
                    ) : (
                      <Eye
                        size={18}
                        strokeWidth={1.8}
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(evento) =>
                      setRecordar(
                        evento.target.checked
                      )
                    }
                  />

                  <span>Recuérdame</span>
                </label>

                <button
                  type="button"
                  className="login-link-button"
                  onClick={abrirRecuperacion}
                >
                  ¿Olvidaste la contraseña?
                </button>
              </div>
            </>
          )}

          {error && (
            <div
              className="login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={
              cargando ||
              (requiere2FA &&
                codigo2FA.trim().length < 6)
            }
          >
            {cargando
              ? "Verificando..."
              : requiere2FA
                ? "Verificar identidad"
                : "Iniciar sesión"}
          </button>

          {!requiere2FA && (
            <p className="login-register">
              ¿No eres miembro?{" "}
              <Link to="/registro">
                Crear cuenta
              </Link>
            </p>
          )}
        </form>
      </section>

      {recuperacionAbierta && (
        <div
          className="recuperacion-fondo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarRecuperacion();
            }
          }}
        >
          <section
            className="recuperacion-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Recuperar contraseña"
          >
            <button
              type="button"
              className="recuperacion-cerrar"
              onClick={cerrarRecuperacion}
              aria-label="Cerrar recuperación"
            >
              <X size={19} />
            </button>

            {pasoRecuperacion === 4 ? (
              <div className="recuperacion-exito">
                <span>
                  <CheckCircle2 size={34} />
                </span>

                <h2>Contraseña actualizada</h2>
                <p>{mensajeRecuperacion}</p>

                <button
                  type="button"
                  onClick={cerrarRecuperacion}
                >
                  Volver a iniciar sesión
                </button>
              </div>
            ) : (
              <>
                <div className="recuperacion-icono">
                  {pasoRecuperacion === 3 ? (
                    <LockKeyhole size={27} />
                  ) : pasoRecuperacion === 2 ? (
                    <KeyRound size={27} />
                  ) : (
                    <Mail size={27} />
                  )}
                </div>

                <header className="recuperacion-header">
                  <span>
                    PASO {pasoRecuperacion} DE 3
                  </span>

                  <h2>
                    {pasoRecuperacion === 1
                      ? "Recupera tu cuenta"
                      : pasoRecuperacion === 2
                        ? "Verifica el código"
                        : "Crea una contraseña nueva"}
                  </h2>

                  <p>
                    {pasoRecuperacion === 1
                      ? "Escribe el correo asociado a tu cuenta."
                      : pasoRecuperacion === 2
                        ? "Revisa tu correo e introduce el código temporal de 6 dígitos."
                        : "Elige una contraseña segura que no hayas usado antes."}
                  </p>
                </header>

                {pasoRecuperacion === 1 && (
                  <label className="recuperacion-campo">
                    <span>CORREO ELECTRÓNICO</span>

                    <div>
                      <Mail size={17} />
                      <input
                        type="email"
                        value={correoRecuperacion}
                        onChange={(evento) => {
                          setCorreoRecuperacion(
                            evento.target.value
                          );
                          setErrorRecuperacion("");
                        }}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </label>
                )}

                {pasoRecuperacion === 2 && (
                  <>
                    <label className="recuperacion-campo">
                      <span>CÓDIGO TEMPORAL</span>

                      <div className="recuperacion-codigo">
                        <KeyRound size={17} />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={codigoRecuperacion}
                          onChange={(evento) => {
                            setCodigoRecuperacion(
                              evento.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6)
                            );
                            setErrorRecuperacion("");
                          }}
                          placeholder="000000"
                        />
                      </div>
                    </label>

                    {mensajeRecuperacion && (
                      <p className="recuperacion-info">
                        {mensajeRecuperacion}
                      </p>
                    )}
                  </>
                )}

                {pasoRecuperacion === 3 && (
                  <div className="recuperacion-passwords">
                    <label className="recuperacion-campo">
                      <span>NUEVA CONTRASEÑA</span>

                      <div>
                        <LockKeyhole size={17} />
                        <input
                          type="password"
                          value={nuevaPassword}
                          onChange={(evento) => {
                            setNuevaPassword(
                              evento.target.value
                            );
                            setErrorRecuperacion("");
                          }}
                          placeholder="Mínimo 8 caracteres"
                        />
                      </div>
                    </label>

                    <label className="recuperacion-campo">
                      <span>CONFIRMAR CONTRASEÑA</span>

                      <div>
                        <LockKeyhole size={17} />
                        <input
                          type="password"
                          value={
                            confirmarNuevaPassword
                          }
                          onChange={(evento) => {
                            setConfirmarNuevaPassword(
                              evento.target.value
                            );
                            setErrorRecuperacion("");
                          }}
                          placeholder="Repite la contraseña"
                        />
                      </div>
                    </label>
                  </div>
                )}

                {errorRecuperacion && (
                  <p className="recuperacion-error">
                    {errorRecuperacion}
                  </p>
                )}

                <button
                  type="button"
                  className="recuperacion-principal"
                  disabled={procesandoRecuperacion}
                  onClick={() => {
                    if (pasoRecuperacion === 1) {
                      void solicitarCodigo();
                    } else if (
                      pasoRecuperacion === 2
                    ) {
                      void comprobarCodigo();
                    } else {
                      void cambiarPassword();
                    }
                  }}
                >
                  {procesandoRecuperacion
                    ? "Procesando..."
                    : pasoRecuperacion === 1
                      ? "Enviar código"
                      : pasoRecuperacion === 2
                        ? "Verificar código"
                        : "Actualizar contraseña"}
                </button>

                {pasoRecuperacion > 1 && (
                  <button
                    type="button"
                    className="recuperacion-secundario"
                    onClick={() => {
                      setPasoRecuperacion(
                        pasoRecuperacion === 3 ? 2 : 1
                      );
                      setErrorRecuperacion("");
                    }}
                  >
                    <ArrowLeft size={15} />
                    Regresar
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}