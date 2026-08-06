import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Usuario } from "../types/auth";

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  iniciar: (usuario: Usuario, token: string, recordar: boolean) => void;
  cerrar: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function leerUsuario(): Usuario | null {
  const raw = localStorage.getItem("bd_usuario") ?? sessionStorage.getItem("bd_usuario");
  return raw ? JSON.parse(raw) : null;
}

function leerToken(): string | null {
  return localStorage.getItem("bd_token") ?? sessionStorage.getItem("bd_token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario);
  const [token, setToken] = useState<string | null>(leerToken);

  const valor = useMemo<AuthContextValue>(() => ({
    usuario,
    token,
    iniciar(nuevoUsuario, nuevoToken, recordar) {
      localStorage.removeItem("bd_usuario");
      localStorage.removeItem("bd_token");
      sessionStorage.removeItem("bd_usuario");
      sessionStorage.removeItem("bd_token");

      const almacenamiento = recordar ? localStorage : sessionStorage;
      almacenamiento.setItem("bd_usuario", JSON.stringify(nuevoUsuario));
      almacenamiento.setItem("bd_token", nuevoToken);
      setUsuario(nuevoUsuario);
      setToken(nuevoToken);
    },
    cerrar() {
      localStorage.removeItem("bd_usuario");
      localStorage.removeItem("bd_token");
      sessionStorage.removeItem("bd_usuario");
      sessionStorage.removeItem("bd_token");
      setUsuario(null);
      setToken(null);
    },
  }), [usuario, token]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return contexto;
}
