import { request } from "./api";

export type CategoriaApariencia =
  | "GRATIS"
  | "BRONCE"
  | "PLATA"
  | "ORO"
  | "PLATINO"
  | "DIAMANTE";

export interface AparienciaGamificacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaApariencia;
  costoXp: number;
  archivoImagen: string;
  desbloqueada: boolean;
  equipada: boolean;
}

export interface LogroGamificacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria:
    | "BRONCE"
    | "PLATA"
    | "ORO"
    | "PLATINO"
    | "DIAMANTE";
  tipoObjetivo:
    | "EVENTO_UNICO"
    | "CANTIDAD_EVENTOS"
    | "RACHA"
    | "XP_TOTAL"
    | "NIVEL"
    | "PERFIL";
  valorObjetivo: number;
  progresoActual: number;
  xpRecompensa: number;
  icono: string;
  completado: boolean;
  completadoEn: string | null;
}

export interface ResumenGamificacion {
  nombreMascota: string;
  xpTotal: number;
  xpDisponible: number;
  nivelActual: number;
  xpNivelActual: number;
  xpSiguienteNivel: number;
  progresoNivelPorcentaje: number;
  rachaActual: number;
  mejorRacha: number;
  ultimaActividadFecha: string | null;
  diasSemana: Array<{
    fecha: string;
    activo: boolean;
  }>;
  aparienciaActiva: AparienciaGamificacion | null;
  apariencias: AparienciaGamificacion[];
  logros: LogroGamificacion[];
  logrosCompletados: number;
  logrosTotales: number;
  estadoAnimo:
    | "FELIZ"
    | "MOTIVADO"
    | "TRANQUILO"
    | "TRISTE";
}

interface RespuestaGamificacion {
  ok: boolean;
  resumen: ResumenGamificacion;
  mensaje?: string;
}

export async function obtenerGamificacion(): Promise<ResumenGamificacion> {
  const respuesta = await request<RespuestaGamificacion>(
    "/gamificacion"
  );

  return respuesta.resumen;
}

export async function cambiarNombreMascota(
  nombre: string
): Promise<ResumenGamificacion> {
  const respuesta = await request<RespuestaGamificacion>(
    "/gamificacion/mascota/nombre",
    {
      method: "PATCH",
      body: JSON.stringify({ nombre }),
    }
  );

  return respuesta.resumen;
}

export async function desbloquearApariencia(
  aparienciaId: number
): Promise<ResumenGamificacion> {
  const respuesta = await request<RespuestaGamificacion>(
    `/gamificacion/apariencias/${aparienciaId}/desbloquear`,
    {
      method: "POST",
    }
  );

  return respuesta.resumen;
}

export async function equiparApariencia(
  aparienciaId: number
): Promise<ResumenGamificacion> {
  const respuesta = await request<RespuestaGamificacion>(
    `/gamificacion/apariencias/${aparienciaId}/equipar`,
    {
      method: "PATCH",
    }
  );

  return respuesta.resumen;
}