import { request } from "./api";

export interface Presupuesto {
  id: number;
  categoriaId: number;
  nombre: string;
  categoria: string;
  color: string;
  icono: string;
  limite: number;
  gastado: number;
  disponible: number;
  porcentaje: number;
  excedido: boolean;
  excedidoPor: number;
  mes: number;
  anio: number;
  alertaPorcentaje: number;
  estado: "activo" | "pausado" | "finalizado";
}

export interface ResumenPresupuestos {
  totalLimite: number;
  totalGastado: number;
  disponible: number;
  porcentaje: number;
}

interface ListaPresupuestosRespuesta {
  ok: true;
  mes: number;
  anio: number;
  resumen: ResumenPresupuestos;
  presupuestos: Presupuesto[];
}

export interface GuardarPresupuestoPayload {
  categoriaNombre: string;
  limiteMonto: number;
  mes: number;
  anio: number;
  alertaPorcentaje?: number;
}

export async function obtenerPresupuestos(
  mes: number,
  anio: number
): Promise<ListaPresupuestosRespuesta> {
  return request<ListaPresupuestosRespuesta>(
    `/presupuestos?mes=${mes}&anio=${anio}`
  );
}

export async function guardarPresupuesto(
  payload: GuardarPresupuestoPayload
): Promise<void> {
  await request("/presupuestos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function eliminarPresupuesto(id: number): Promise<void> {
  await request(`/presupuestos/${id}`, {
    method: "DELETE",
  });
}