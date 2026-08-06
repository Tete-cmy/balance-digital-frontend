import { request } from "./api";

export interface MetaAhorro {
  id: number;
  nombre: string;
  descripcion: string | null;
  montoObjetivo: number;
  ahorrado: number;
  faltante: number;
  porcentaje: number;
  fechaInicio: string;
  fechaObjetivo: string | null;
  icono: string;
  color: string;
  estado: "activa" | "completada";
  completadaEn: string | null;
}

export interface ResumenMetas {
  enProgreso: number;
  completadas: number;
  totalAhorro: number;
}

interface MetasRespuesta {
  ok: true;
  resumen: ResumenMetas;
  metas: MetaAhorro[];
}

export interface CrearMetaPayload {
  nombre: string;
  montoObjetivo: number;
  fechaObjetivo?: string | null;
  icono: string;
  color: string;
}

export async function obtenerMetas(): Promise<MetasRespuesta> {
  return request<MetasRespuesta>("/metas");
}

export async function crearMeta(payload: CrearMetaPayload): Promise<void> {
  await request("/metas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function abonarMeta(metaId: number, monto: number): Promise<void> {
  await request(`/metas/${metaId}/abonos`, {
    method: "POST",
    body: JSON.stringify({ monto }),
  });
}