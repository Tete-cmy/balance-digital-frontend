const CLAVE_DISPOSITIVO = "bd_dispositivo_id";

export interface InformacionDispositivo {
  dispositivoId: string;
  nombreDispositivo: string;
  navegador: string;
  sistemaOperativo: string;
}

function crearIdentificador(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `bd-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export function obtenerDispositivoId(): string {
  const existente = localStorage.getItem(CLAVE_DISPOSITIVO);

  if (existente) {
    return existente;
  }

  const nuevo = crearIdentificador();
  localStorage.setItem(CLAVE_DISPOSITIVO, nuevo);
  return nuevo;
}

function detectarNavegador(): string {
  const agente = navigator.userAgent;

  if (/Edg\//i.test(agente)) return "Microsoft Edge";
  if (/OPR\//i.test(agente)) return "Opera";
  if (/Chrome\//i.test(agente)) return "Google Chrome";
  if (/Firefox\//i.test(agente)) return "Mozilla Firefox";
  if (/Safari\//i.test(agente)) return "Safari";

  return "Navegador web";
}

function detectarSistemaOperativo(): string {
  const agente = navigator.userAgent;

  if (/Windows NT 10.0/i.test(agente)) return "Windows";
  if (/Mac OS X/i.test(agente)) return "macOS";
  if (/Android/i.test(agente)) return "Android";
  if (/iPhone|iPad|iPod/i.test(agente)) return "iOS";
  if (/Linux/i.test(agente)) return "Linux";

  return "Sistema desconocido";
}

function detectarNombreDispositivo(): string {
  const sistema = detectarSistemaOperativo();
  const esMovil = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  return esMovil
    ? `${sistema} · Dispositivo móvil`
    : `${sistema} · Computadora`;
}

export function obtenerInformacionDispositivo(): InformacionDispositivo {
  return {
    dispositivoId: obtenerDispositivoId(),
    nombreDispositivo: detectarNombreDispositivo(),
    navegador: detectarNavegador(),
    sistemaOperativo: detectarSistemaOperativo(),
  };
}