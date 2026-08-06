import { useState } from "react";
import { Outlet } from "react-router-dom";

import PanelConfiguracion from "../Configuracion/PanelConfiguracion";
import PanelNotificaciones from "../Notificaciones/PanelNotificaciones";
import PanelUsuario from "../Usuarios/PanelUsuario";
import Header from "./Header";
import Sidebar from "./Sidebar";

import "./SistemaLayout.css";

export default function SistemaLayout() {
  const [
    configuracionAbierta,
    setConfiguracionAbierta,
  ] = useState(false);

  const [
    usuarioAbierto,
    setUsuarioAbierto,
  ] = useState(false);

  const [
    notificacionesAbiertas,
    setNotificacionesAbiertas,
  ] = useState(false);

  function cerrarPaneles(): void {
    setConfiguracionAbierta(false);
    setUsuarioAbierto(false);
    setNotificacionesAbiertas(false);
  }

  function abrirConfiguracion(): void {
    cerrarPaneles();
    setConfiguracionAbierta(true);
  }

  function abrirUsuario(): void {
    cerrarPaneles();
    setUsuarioAbierto(true);
  }

  function abrirNotificaciones(): void {
    cerrarPaneles();
    setNotificacionesAbiertas(true);
  }

  return (
    <div className="sistema-layout">
      <Sidebar
        onAbrirConfiguracion={
          abrirConfiguracion
        }
      />

      <div className="sistema-layout__principal">
        <Header
          onAbrirUsuario={abrirUsuario}
          onAbrirNotificaciones={
            abrirNotificaciones
          }
        />

        <main className="sistema-layout__contenido">
          <Outlet />
        </main>
      </div>

      {configuracionAbierta ? (
        <PanelConfiguracion
          abierto={configuracionAbierta}
          onCerrar={cerrarPaneles}
        />
      ) : null}

      {usuarioAbierto ? (
        <PanelUsuario
          abierto={usuarioAbierto}
          onCerrar={cerrarPaneles}
          onAbrirConfiguracion={
            abrirConfiguracion
          }
        />
      ) : null}

      {notificacionesAbiertas ? (
        <PanelNotificaciones
          abierto={notificacionesAbiertas}
          onCerrar={cerrarPaneles}
        />
      ) : null}
    </div>
  );
}