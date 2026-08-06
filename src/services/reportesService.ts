import { request } from "./api";

export interface ReporteResumen {
  ingresos6m: number;
  gastos6m: number;
  ahorro6m: number;
  tasaAhorro: number;
}

export interface ReporteMes {
  clave: string;
  mes: string;
  ingresos: number;
  gastos: number;
  ahorro: number;
}

export interface ReporteCategoria {
  nombre: string;
  color: string;
  monto: number;
  porcentaje: number;
}

export interface ReportesRespuesta {
  ok: true;
  resumen: ReporteResumen;
  meses: ReporteMes[];
  categorias: ReporteCategoria[];
}

export async function obtenerReportes(): Promise<ReportesRespuesta> {
  return request<ReportesRespuesta>("/reportes");
}