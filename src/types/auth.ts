export interface Usuario {
  id: number;
  nombre: string;
  apellido?: string | null;
  correo: string;
  telefono?: string | null;
  fotoUrl?: string | null;
}

export interface RespuestaAuthCompleta {
  ok: true;
  mensaje: string;
  requiere2FA: false;
  token: string;
  usuario: Usuario;
}

export interface RespuestaAuth2FA {
  ok: true;
  mensaje: string;
  requiere2FA: true;
  desafioToken: string;
  usuario: Pick<Usuario, "id" | "nombre" | "correo">;
}

export type RespuestaAuth =
  | RespuestaAuthCompleta
  | RespuestaAuth2FA;


export interface RespuestaRegistroPendiente {
  ok: true;
  mensaje: string;
  requiereVerificacion: true;
  correo: string;
}