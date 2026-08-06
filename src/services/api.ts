const API_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:4000/api";

function obtenerToken(): string | null {
  return (
    localStorage.getItem("bd_token") ??
    sessionStorage.getItem("bd_token")
  );
}

async function request<T>(
  ruta: string,
  opciones: RequestInit = {}
): Promise<T> {
  const token = obtenerToken();

  const headers = new Headers(
    opciones.headers
  );

  if (
    !headers.has("Content-Type") &&
    opciones.body
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (
    token &&
    !headers.has("Authorization")
  ) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const urlCompleta =
    `${API_URL}${ruta}`;

  const respuesta = await fetch(
    urlCompleta,
    {
      ...opciones,
      headers,
    }
  );

  let data: unknown = null;

  try {
    data = await respuesta.json();
  } catch {
    data = null;
  }

  if (!respuesta.ok) {
    const mensaje =
      typeof data === "object" &&
      data !== null &&
      "mensaje" in data &&
      typeof data.mensaje === "string"
        ? data.mensaje
        : "Ocurrió un error al comunicarse con el servidor";

    throw new Error(mensaje);
  }

  return data as T;
}

export {
  API_URL,
  request,
};