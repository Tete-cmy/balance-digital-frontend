import { request } from "./api";

export type ResultadoMensual =
  | "AHORRO"
  | "EQUILIBRIO"
  | "DEFICIT";

export interface VistaPreviaMensual {
  anio: number;
  mes: number;
  totalIngresos: number;
  totalGastos: number;
  ahorroNeto: number;
  resultadoProvisional: ResultadoMensual;
  esProvisional: true;
}

export interface CierreMensual {
  id: number;
  anio: number;
  mes: number;
  totalIngresos: number;
  totalGastos: number;
  ahorroNeto: number;
  resultado: ResultadoMensual;
  evaluadoEn: string;
}

export interface LogroMensualDesbloqueado {
  codigo: string;
  nombre: string;
  descripcion: string;
  xpRecompensa: number;
}

export interface UltimoCierreMensual {
  cierre: CierreMensual;
  yaEvaluado: boolean;
  logrosDesbloqueados: LogroMensualDesbloqueado[];
  xpGanada: number;
}

export interface ResumenCierreMensual {
  vistaPrevia: VistaPreviaMensual;
  historial: CierreMensual[];
  ultimoCierre: UltimoCierreMensual;
}

interface RespuestaCierreMensual {
  ok: true;
  vistaPrevia: VistaPreviaMensual;
  historial: CierreMensual[];
  ultimoCierre: UltimoCierreMensual;
}

export async function obtenerCierreMensual(): Promise<
  ResumenCierreMensual
> {
  const respuesta =
    await request<RespuestaCierreMensual>(
      "/cierre-mensual"
    );

  return {
    vistaPrevia: respuesta.vistaPrevia,
    historial: respuesta.historial,
    ultimoCierre: respuesta.ultimoCierre,
  };
}