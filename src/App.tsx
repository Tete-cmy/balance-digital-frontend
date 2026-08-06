import { Navigate, Route, Routes } from "react-router-dom";

import RutaProtegida from "./components/RutaProtegida";
import SistemaLayout from "./components/layouts/SistemaLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Movimientos from "./pages/Movimientos/Movimientos";
import Registro from "./pages/Registro/Registro";
import Presupuestos from "./pages/Presupuestos/Presupuestos";
import Metas from "./pages/Metas/Metas";

import "./styles/tipografia.css";
import Reportes from "./Reportes/Reportes";

function ModuloPendiente({ titulo }: { titulo: string }) {
  return (
    <section
      style={{
        minHeight: "320px",
        display: "grid",
        placeItems: "center",
        padding: "30px",
        border: "1px solid #e2e7e4",
        borderRadius: "20px",
        background: "#ffffff",
        color: "#35403c",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px" }}>{titulo}</h2>
        <p style={{ margin: 0, color: "#929ca8" }}>
          Este módulo será desarrollado a continuación.
        </p>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida />}>
        <Route element={<SistemaLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/movimientos" element={<Movimientos />} />
         <Route path="/presupuestos" element={<Presupuestos />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route
            path="/configuracion"
            element={<ModuloPendiente titulo="Configuración" />}
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}