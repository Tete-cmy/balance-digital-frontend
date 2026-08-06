import { request } from "./api";

export type TemaConfiguracion = "claro" | "oscuro";

export type TamanoTexto =
  | "pequeno"
  | "mediano"
  | "grande"
  | "muy_grande";

export interface PreferenciasConfiguracion {
  tema: TemaConfiguracion;
  tamanoTexto: TamanoTexto;
  recordatoriosGastos: boolean;
  notificacionesMetas: boolean;
  resumenesSemanales: boolean;
}

export interface DispositivoConfianza {
  id: number;
  dispositivoId: string;
  nombre: string;
  navegador: string | null;
  sistemaOperativo: string | null;
  ultimaIp: string | null;
  confiable: boolean;
  actual: boolean;
  ultimoAcceso: string;
  creadoEn: string;
}

interface DispositivosConfianzaRespuesta {
  ok: true;
  dispositivos: DispositivoConfianza[];
}

interface ActualizarDispositivoRespuesta {
  ok: true;
  mensaje: string;
  dispositivoId: string;
  confiable?: boolean;
}

export interface HistorialAcceso {
  id: number;
  fechaAcceso: string;
  direccionIp: string | null;
  navegador: string | null;
  sistemaOperativo: string | null;
  dispositivo: string | null;
  exitoso: boolean;
  actual: boolean;
}

interface HistorialAccesosRespuesta {
  ok: true;
  accesos: HistorialAcceso[];
}

export interface Estado2FA {
  ok: true;
  activo: boolean;
  activadoEn: string | null;
  ultimoUsoEn: string | null;
}

export interface Preparar2FARespuesta {
  ok: true;
  mensaje: string;
  qrDataUrl: string;
  secretoManual: string;
  cuenta: string;
}

export interface Activar2FARespuesta {
  ok: true;
  mensaje: string;
  codigosRecuperacion: string[];
}

export interface Desactivar2FARespuesta {
  ok: true;
  mensaje: string;
}

export interface UsuarioConfiguracion {
  id: number;
  nombre: string;
  apellido: string | null;
  correo: string;
  telefono: string | null;
  fotoUrl: string | null;
  proveedor: "local" | "google";
}

interface ConfiguracionRespuesta {
  ok: true;
  usuario: UsuarioConfiguracion;
  preferencias: PreferenciasConfiguracion;
}

interface ActualizarNombreRespuesta {
  ok: true;
  mensaje: string;
  nombre: string;
}


interface ActualizarPasswordRespuesta {
  ok: true;
  mensaje: string;
}

interface ActualizarCorreoRespuesta {
  ok: true;
  mensaje: string;
  correo: string;
  requiereNuevoInicioDeSesion: boolean;
}

interface ActualizarTelefonoRespuesta {
  ok: true;
  mensaje: string;
  telefono: string;
}

interface ActualizarPreferenciasRespuesta {
  ok: true;
  mensaje: string;
  preferencias: PreferenciasConfiguracion;
}

export async function obtenerConfiguracion(): Promise<ConfiguracionRespuesta> {
  return request<ConfiguracionRespuesta>("/configuracion");
}

export async function actualizarNombre(
  nombre: string
): Promise<ActualizarNombreRespuesta> {
  return request<ActualizarNombreRespuesta>("/configuracion/nombre", {
    method: "PATCH",
    body: JSON.stringify({ nombre }),
  });
}


export async function actualizarPassword(
  passwordActual: string,
  passwordNueva: string,
  confirmacion: string
): Promise<ActualizarPasswordRespuesta> {
  return request<ActualizarPasswordRespuesta>(
    "/configuracion/password",
    {
      method: "PATCH",
      body: JSON.stringify({
        passwordActual,
        passwordNueva,
        confirmacion,
      }),
    }
  );
}

export async function actualizarCorreo(
  correo: string,
  password: string
): Promise<ActualizarCorreoRespuesta> {
  return request<ActualizarCorreoRespuesta>("/configuracion/correo", {
    method: "PATCH",
    body: JSON.stringify({ correo, password }),
  });
}

export async function actualizarTelefono(
  telefono: string
): Promise<ActualizarTelefonoRespuesta> {
  return request<ActualizarTelefonoRespuesta>("/configuracion/telefono", {
    method: "PATCH",
    body: JSON.stringify({ telefono }),
  });
}

export async function actualizarPreferencias(
  preferencias: PreferenciasConfiguracion
): Promise<ActualizarPreferenciasRespuesta> {
  return request<ActualizarPreferenciasRespuesta>(
    "/configuracion/preferencias",
    {
      method: "PATCH",
      body: JSON.stringify(preferencias),
    }
  );
}


export async function obtenerHistorialAccesos(): Promise<HistorialAccesosRespuesta> {
  return request<HistorialAccesosRespuesta>(
    "/configuracion/historial-accesos"
  );
}


export async function obtenerDispositivosConfianza(
  dispositivoId: string
): Promise<DispositivosConfianzaRespuesta> {
  return request<DispositivosConfianzaRespuesta>(
    `/configuracion/dispositivos?dispositivoId=${encodeURIComponent(
      dispositivoId
    )}`
  );
}

export async function actualizarConfianzaDispositivo(
  dispositivoId: string,
  confiable: boolean
): Promise<ActualizarDispositivoRespuesta> {
  return request<ActualizarDispositivoRespuesta>(
    `/configuracion/dispositivos/${encodeURIComponent(
      dispositivoId
    )}/confianza`,
    {
      method: "PATCH",
      body: JSON.stringify({ confiable }),
    }
  );
}

export async function eliminarDispositivoConfianza(
  dispositivoId: string,
  dispositivoActualId: string
): Promise<ActualizarDispositivoRespuesta> {
  return request<ActualizarDispositivoRespuesta>(
    `/configuracion/dispositivos/${encodeURIComponent(
      dispositivoId
    )}`,
    {
      method: "DELETE",
      body: JSON.stringify({ dispositivoActualId }),
    }
  );
}


export async function obtenerEstado2FA(): Promise<Estado2FA> {
  return request<Estado2FA>("/configuracion/2fa/estado");
}

export async function preparar2FA(): Promise<Preparar2FARespuesta> {
  return request<Preparar2FARespuesta>("/configuracion/2fa/preparar", {
    method: "POST",
  });
}

export async function activar2FA(
  codigo: string
): Promise<Activar2FARespuesta> {
  return request<Activar2FARespuesta>("/configuracion/2fa/activar", {
    method: "POST",
    body: JSON.stringify({ codigo }),
  });
}

export async function desactivar2FA(
  password: string,
  codigo: string
): Promise<Desactivar2FARespuesta> {
  return request<Desactivar2FARespuesta>("/configuracion/2fa/desactivar", {
    method: "POST",
    body: JSON.stringify({ password, codigo }),
  });
}


export async function eliminarCuenta(
  password: string,
  confirmacion: string
): Promise<{
  ok: true;
  mensaje: string;
}> {
  return request(
    "/configuracion/cuenta",
    {
      method: "DELETE",
      body: JSON.stringify({
        password,
        confirmacion,
      }),
    }
  );
}