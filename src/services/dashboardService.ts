import { request } from "./api";

export interface DashboardResumen {
  balanceTotal: number;
  ingresosMes: number;
  gastosMes: number;
  ahorroMes: number;
  porcentajeAhorro: number;
  cantidadIngresos: number;
  cantidadGastos: number;
}

export interface DashboardSerieMensual {
  periodo: string;
  mes: string;
  ingresos: number;
  gastos: number;
}

export interface DashboardCategoria {
  categoria: string;
  color: string;
  total: number;
  porcentaje: number;
}

export interface DashboardMovimiento {
  id: number;
  descripcion: string;
  monto: number;
  tipo: "ingreso" | "gasto";
  fecha: string;
  categoria: string | null;
  color: string | null;
}

export interface DashboardData {
  resumen: DashboardResumen;
  serieMensual: DashboardSerieMensual[];
  gastosPorCategoria: DashboardCategoria[];
  ultimosMovimientos: DashboardMovimiento[];
}

interface DashboardRespuesta {
  ok: true;
  dashboard: DashboardData;
}

export async function obtenerDashboard(): Promise<DashboardData> {
  const respuesta = await request<DashboardRespuesta>("/dashboard/resumen");
  return respuesta.dashboard;
}