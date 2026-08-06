import { request } from "./api";

export type TipoMovimiento = "ingreso" | "gasto";
export type EstadoMovimiento = "confirmado" | "pendiente";

export interface CategoriaMovimiento {
  id: number;
  nombre: string;
  tipo: "ingreso" | "gasto" | "ambos";
  color: string;
}

export interface Movimiento {
  id: number;
  descripcion: string;
  monto: number;
  tipo: TipoMovimiento;
  fecha: string;
  metodo_pago: string;
  estado: "confirmado" | "pendiente" | "cancelado";
  notas: string | null;
  categoria_id: number | null;
  categoria: string | null;
  categoria_color: string | null;
}

export interface ResumenMovimientos {
  totalIngresos: number;
  totalGastos: number;
  balanceNeto: number;
  cantidadIngresos: number;
  cantidadGastos: number;
  cantidadTotal: number;
}

interface ListaRespuesta {
  ok: true;
  movimientos: Movimiento[];
  resumen: ResumenMovimientos;
}

interface CategoriasRespuesta {
  ok: true;
  categorias: CategoriaMovimiento[];
}

export interface CrearMovimientoPayload {
  tipo: TipoMovimiento;
  descripcion: string;
  monto: number;
  categoriaId: number;
  estado: EstadoMovimiento;
}

export async function listarMovimientos(params?: {
  busqueda?: string;
  tipo?: string;
  estado?: string;
}): Promise<ListaRespuesta> {
  const query = new URLSearchParams();

  if (params?.busqueda) {
    query.set("busqueda", params.busqueda);
  }

  if (params?.tipo) {
    query.set("tipo", params.tipo);
  }

  if (params?.estado) {
    query.set("estado", params.estado);
  }

  const sufijo = query.toString()
    ? `?${query.toString()}`
    : "";

  return request<ListaRespuesta>(
    `/movimientos${sufijo}`
  );
}

export async function obtenerCategorias(): Promise<
  CategoriaMovimiento[]
> {
  const respuesta =
    await request<CategoriasRespuesta>(
      "/movimientos/categorias"
    );

  return respuesta.categorias;
}

export async function crearMovimiento(
  payload: CrearMovimientoPayload
): Promise<void> {
  await request("/movimientos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function eliminarMovimiento(
  id: number
): Promise<void> {
  await request(`/movimientos/${id}`, {
    method: "DELETE",
  });
}