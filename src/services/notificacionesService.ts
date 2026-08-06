import { request } from "./api";

export type TipoNotificacion =
  | "ingreso"
  | "gasto"
  | "presupuesto"
  | "meta"
  | "racha"
  | "logro"
  | "recordatorio"
  | "consejo"
  | "sistema";

export type FiltroNotificaciones =
  | "todas"
  | "no_leidas"
  | "leidas";

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  entidadTipo: string | null;
  entidadId: number | null;
  leida: boolean;
  fechaLectura: string | null;
  creadaEn: string;
}

export interface ResumenNotificaciones {
  total: number;
  noLeidas: number;
  leidas: number;
}

interface ListaRespuesta {
  ok: true;
  notificaciones: Notificacion[];
  resumen: ResumenNotificaciones;
}

interface ConteoRespuesta {
  ok: true;
  noLeidas: number;
}

export async function listarNotificaciones(
  filtro: FiltroNotificaciones = "todas"
): Promise<ListaRespuesta> {
  return request<ListaRespuesta>(
    `/notificaciones?filtro=${filtro}`
  );
}

export async function obtenerConteoNoLeidas(): Promise<
  number
> {
  const respuesta =
    await request<ConteoRespuesta>(
      "/notificaciones/conteo-no-leidas"
    );

  return respuesta.noLeidas;
}

export async function marcarNotificacionLeida(
  id: number
): Promise<void> {
  await request(`/notificaciones/${id}/leer`, {
    method: "PATCH",
  });
}

export async function marcarTodasLeidas(): Promise<void> {
  await request("/notificaciones/leer-todas", {
    method: "PATCH",
  });
}

export async function eliminarNotificacion(
  id: number
): Promise<void> {
  await request(`/notificaciones/${id}`, {
    method: "DELETE",
  });
}