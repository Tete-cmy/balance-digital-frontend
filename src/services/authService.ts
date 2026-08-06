import type {
  RespuestaAuth,
  RespuestaAuthCompleta,
  RespuestaRegistroPendiente,
} from "../types/auth";
import { request } from "./api";
import { obtenerInformacionDispositivo } from "./dispositivoService";

export function iniciarSesion(
  correo: string,
  password: string
): Promise<RespuestaAuth> {
  const dispositivo = obtenerInformacionDispositivo();

  return request<RespuestaAuth>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      correo,
      password,
      ...dispositivo,
    }),
  });
}

export function verificarSegundoPaso(
  desafioToken: string,
  codigo: string,
  confiarDispositivo: boolean
): Promise<RespuestaAuthCompleta> {
  return request<RespuestaAuthCompleta>(
    "/auth/verificar-2fa",
    {
      method: "POST",
      body: JSON.stringify({
        desafioToken,
        codigo,
        confiarDispositivo,
      }),
    }
  );
}

export function registrarUsuario(datos: {
  nombre: string;
  apellido?: string;
  correo: string;
  password: string;
  telefono?: string;
}): Promise<RespuestaRegistroPendiente> {
  return request<RespuestaRegistroPendiente>(
    "/auth/registro",
    {
      method: "POST",
      body: JSON.stringify(datos),
    }
  );
}

export interface RespuestaSolicitudRecuperacion {
  ok: true;
  mensaje: string;
}

export function solicitarRecuperacionPassword(
  correo: string
): Promise<RespuestaSolicitudRecuperacion> {
  return request<RespuestaSolicitudRecuperacion>(
    "/auth/recuperar-password/solicitar",
    {
      method: "POST",
      body: JSON.stringify({ correo }),
    }
  );
}

export function verificarCodigoRecuperacion(
  correo: string,
  codigo: string
): Promise<{
  ok: true;
  mensaje: string;
  tokenRecuperacion: string;
}> {
  return request(
    "/auth/recuperar-password/verificar",
    {
      method: "POST",
      body: JSON.stringify({ correo, codigo }),
    }
  );
}

export function restablecerPassword(
  tokenRecuperacion: string,
  nuevaPassword: string
): Promise<{
  ok: true;
  mensaje: string;
}> {
  return request(
    "/auth/recuperar-password/restablecer",
    {
      method: "POST",
      body: JSON.stringify({
        tokenRecuperacion,
        nuevaPassword,
      }),
    }
  );
}


export function verificarCorreoRegistro(
  correo: string,
  codigo: string
): Promise<RespuestaAuthCompleta> {
  return request<RespuestaAuthCompleta>(
    "/auth/registro/verificar-correo",
    {
      method: "POST",
      body: JSON.stringify({ correo, codigo }),
    }
  );
}

export function reenviarCodigoVerificacion(
  correo: string
): Promise<{
  ok: true;
  mensaje: string;
}> {
  return request(
    "/auth/registro/reenviar-codigo",
    {
      method: "POST",
      body: JSON.stringify({ correo }),
    }
  );
}