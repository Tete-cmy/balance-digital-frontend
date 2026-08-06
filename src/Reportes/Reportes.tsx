import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  obtenerReportes,
  type ReporteCategoria,
  type ReporteMes,
  type ReportesRespuesta,
} from "../services/reportesService";

import "./Reportes.css";

const respuestaVacia: ReportesRespuesta = {
  ok: true,
  resumen: {
    ingresos6m: 0,
    gastos6m: 0,
    ahorro6m: 0,
    tasaAhorro: 0,
  },
  meses: [],
  categorias: [],
};

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

function monedaCompacta(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    notation: "compact",
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 1,
  }).format(valor);
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function puntoPolar(
  centroX: number,
  centroY: number,
  radio: number,
  angulo: number
) {
  const radianes = ((angulo - 90) * Math.PI) / 180;

  return {
    x: centroX + radio * Math.cos(radianes),
    y: centroY + radio * Math.sin(radianes),
  };
}

function arcoDona(
  inicio: number,
  fin: number,
  radioExterior = 92,
  radioInterior = 55
): string {
  const centroX = 110;
  const centroY = 110;

  const exteriorInicio = puntoPolar(centroX, centroY, radioExterior, fin);
  const exteriorFin = puntoPolar(centroX, centroY, radioExterior, inicio);
  const interiorInicio = puntoPolar(centroX, centroY, radioInterior, inicio);
  const interiorFin = puntoPolar(centroX, centroY, radioInterior, fin);

  const arcoGrande = fin - inicio <= 180 ? 0 : 1;

  return [
    `M ${exteriorInicio.x} ${exteriorInicio.y}`,
    `A ${radioExterior} ${radioExterior} 0 ${arcoGrande} 0 ${exteriorFin.x} ${exteriorFin.y}`,
    `L ${interiorInicio.x} ${interiorInicio.y}`,
    `A ${radioInterior} ${radioInterior} 0 ${arcoGrande} 1 ${interiorFin.x} ${interiorFin.y}`,
    "Z",
  ].join(" ");
}

export default function Reportes() {
  const [datos, setDatos] = useState<ReportesRespuesta>(respuestaVacia);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mesHover, setMesHover] = useState<number | null>(null);
  const [categoriaHover, setCategoriaHover] = useState<number | null>(null);
  const [ahorroHover, setAhorroHover] = useState<number | null>(null);

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await obtenerReportes();
      setDatos(respuesta);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar los reportes"
      );
    } finally {
      setCargando(false);
    }
  }

  const maximoBarras = useMemo(() => {
    const valores = datos.meses.flatMap((mes) => [
      mes.ingresos,
      mes.gastos,
    ]);

    return Math.max(...valores, 1);
  }, [datos.meses]);

  const maximoAhorro = useMemo(() => {
    return Math.max(
      ...datos.meses.map((mes) => Math.max(mes.ahorro, 0)),
      1
    );
  }, [datos.meses]);

  const puntosAhorro = useMemo(() => {
    const ancho = 760;
    const alto = 180;

    if (datos.meses.length === 0) {
      return "";
    }

    return datos.meses
      .map((mes, indice) => {
        const x =
          datos.meses.length === 1
            ? ancho / 2
            : (indice / (datos.meses.length - 1)) * ancho;

        const y =
          alto - (Math.max(mes.ahorro, 0) / maximoAhorro) * (alto - 20);

        return `${x},${y}`;
      })
      .join(" ");
  }, [datos.meses, maximoAhorro]);

  function exportarPDF() {
    const ventana = window.open("", "_blank", "width=980,height=760");

    if (!ventana) {
      setError("Permite las ventanas emergentes para exportar el PDF");
      return;
    }

    const filasMeses = datos.meses
      .map(
        (mes) => `
          <tr>
            <td>${escaparHtml(mes.mes)}</td>
            <td>${moneda(mes.ingresos)}</td>
            <td>${moneda(mes.gastos)}</td>
            <td>${moneda(mes.ahorro)}</td>
          </tr>
        `
      )
      .join("");

    ventana.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Reporte financiero - Balance Digital</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 38px; color: #24312c; }
            h1 { margin-bottom: 4px; }
            p { color: #738078; }
            .resumen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
            .tarjeta { padding: 16px; border: 1px solid #dfe5e2; border-radius: 12px; }
            .tarjeta strong { display: block; margin-top: 8px; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 11px; border-bottom: 1px solid #e5e9e7; text-align: left; }
            th { background: #f4f7f5; }
          </style>
        </head>
        <body>
          <h1>Balance Digital</h1>
          <p>Reporte financiero de los últimos 6 meses</p>
          <section class="resumen">
            <div class="tarjeta">Ingresos 6M<strong>${moneda(datos.resumen.ingresos6m)}</strong></div>
            <div class="tarjeta">Gastos 6M<strong>${moneda(datos.resumen.gastos6m)}</strong></div>
            <div class="tarjeta">Ahorro 6M<strong>${moneda(datos.resumen.ahorro6m)}</strong></div>
            <div class="tarjeta">Tasa de ahorro<strong>${datos.resumen.tasaAhorro.toFixed(1)}%</strong></div>
          </section>
          <table>
            <thead>
              <tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Ahorro</th></tr>
            </thead>
            <tbody>${filasMeses}</tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);

    ventana.document.close();
  }

  function exportarExcel() {
    const encabezados = ["Mes", "Ingresos", "Gastos", "Ahorro"];
    const filas = datos.meses.map((mes) => [
      mes.mes,
      mes.ingresos,
      mes.gastos,
      mes.ahorro,
    ]);

    const tabla = `
      <table>
        <thead>
          <tr>${encabezados.map((item) => `<th>${item}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${filas
            .map(
              (fila) =>
                `<tr>${fila.map((valor) => `<td>${valor}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    const blob = new Blob(
      [`\ufeff<html><head><meta charset="UTF-8"></head><body>${tabla}</body></html>`],
      { type: "application/vnd.ms-excel;charset=utf-8" }
    );

    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "balance-digital-reporte.xls";
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  return (
    <div className="reportes-page">
      {error ? <div className="reportes-error">{error}</div> : null}

      <section className="reportes-resumen">
        <ResumenCard
          icono="📈"
          valor={monedaCompacta(datos.resumen.ingresos6m)}
          etiqueta="Ingresos 6M"
          clase="ingresos"
        />

        <ResumenCard
          icono="📉"
          valor={monedaCompacta(datos.resumen.gastos6m)}
          etiqueta="Gastos 6M"
          clase="gastos"
        />

        <ResumenCard
          icono="💰"
          valor={monedaCompacta(datos.resumen.ahorro6m)}
          etiqueta="Ahorro 6M"
          clase="ahorro"
        />

        <ResumenCard
          icono="📊"
          valor={`${datos.resumen.tasaAhorro.toFixed(1)}%`}
          etiqueta="Tasa ahorro"
          clase="tasa"
        />
      </section>

      <section className="reporte-panel">
        <header className="reporte-panel__header">
          <div>
            <h2>Ingresos vs Gastos</h2>
            <p>Últimos 6 meses</p>
          </div>
        </header>

        {cargando ? (
          <EstadoVacio texto="Cargando gráfica..." />
        ) : (
          <GraficaBarras
            meses={datos.meses}
            maximo={maximoBarras}
            indiceHover={mesHover}
            onHover={setMesHover}
          />
        )}
      </section>

      <section className="reporte-panel">
        <header className="reporte-panel__header reporte-panel__header--fila">
          <h2>Distribución de Gastos</h2>
          <span>Mes actual</span>
        </header>

        {datos.categorias.length === 0 ? (
          <EstadoVacio texto="No hay gastos confirmados este mes." />
        ) : (
          <DistribucionGastos
            categorias={datos.categorias}
            indiceHover={categoriaHover}
            onHover={setCategoriaHover}
          />
        )}
      </section>

      <section className="reporte-panel">
        <header className="reporte-panel__header">
          <h2>Ahorro Mensual</h2>
        </header>

        {cargando ? (
          <EstadoVacio texto="Cargando gráfica..." />
        ) : (
          <GraficaAhorro
            meses={datos.meses}
            puntos={puntosAhorro}
            maximo={maximoAhorro}
            indiceHover={ahorroHover}
            onHover={setAhorroHover}
          />
        )}
      </section>

      <section className="reportes-exportar">
        <button
          type="button"
          className="reportes-exportar__pdf"
          onClick={exportarPDF}
        >
          <span className="reportes-exportar__emoji" aria-hidden="true">📄</span>
          <span>Exportar PDF</span>
        </button>

        <button
          type="button"
          className="reportes-exportar__excel"
          onClick={exportarExcel}
        >
          <span className="reportes-exportar__emoji" aria-hidden="true">📊</span>
          <span>Exportar Excel</span>
        </button>
      </section>
    </div>
  );
}

function ResumenCard({
  icono,
  valor,
  etiqueta,
  clase,
}: {
  icono: ReactNode;
  valor: string;
  etiqueta: string;
  clase: string;
}) {
  return (
    <article className={`reporte-resumen-card reporte-resumen-card--${clase}`}>
      <span className="reporte-resumen-card__icono">{icono}</span>
      <strong>{valor}</strong>
      <p>{etiqueta}</p>
    </article>
  );
}

function GraficaBarras({
  meses,
  maximo,
  indiceHover,
  onHover,
}: {
  meses: ReporteMes[];
  maximo: number;
  indiceHover: number | null;
  onHover: (indice: number | null) => void;
}) {
  const mesActivo = indiceHover === null ? null : meses[indiceHover];

  return (
    <div className="grafica-barras">
      <div className="grafica-barras__contenedor">
        {mesActivo ? (
          <div
            className="grafica-tooltip grafica-tooltip--barras"
            style={{
              left: `${((indiceHover ?? 0) + 0.5) * (100 / meses.length)}%`,
            }}
          >
            <strong>{mesActivo.mes}</strong>
            <div>
              <span className="tooltip-ingreso">● Ingresos</span>
              <b className="tooltip-ingreso">{moneda(mesActivo.ingresos)}</b>
            </div>
            <div>
              <span className="tooltip-gasto">● Gastos</span>
              <b className="tooltip-gasto">{moneda(mesActivo.gastos)}</b>
            </div>
          </div>
        ) : null}

        <div className="grafica-barras__area">
          {meses.map((mes, indice) => (
            <div
              key={mes.clave}
              className="grafica-barras__grupo"
              onMouseEnter={() => onHover(indice)}
              onMouseLeave={() => onHover(null)}
            >
              <div className="grafica-barras__columnas">
                <span
                  className="grafica-barras__columna grafica-barras__columna--ingreso"
                  style={{
                    height: `${Math.max((mes.ingresos / maximo) * 100, 2)}%`,
                  }}
                />

                <span
                  className="grafica-barras__columna grafica-barras__columna--gasto"
                  style={{
                    height: `${Math.max((mes.gastos / maximo) * 100, 2)}%`,
                  }}
                />
              </div>

              <span className="grafica-barras__mes">{mes.mes}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grafica-leyenda">
        <span><i className="leyenda-ingreso" />Ingresos</span>
        <span><i className="leyenda-gasto" />Gastos</span>
      </div>
    </div>
  );
}

function DistribucionGastos({
  categorias,
  indiceHover,
  onHover,
}: {
  categorias: ReporteCategoria[];
  indiceHover: number | null;
  onHover: (indice: number | null) => void;
}) {
  let anguloAcumulado = 0;

  const segmentos = categorias.map((categoria) => {
    const inicio = anguloAcumulado;
    const fin = inicio + (categoria.porcentaje / 100) * 360;
    anguloAcumulado = fin;

    return { categoria, inicio, fin };
  });

  const categoriaActiva =
    indiceHover === null ? null : categorias[indiceHover];

  return (
    <div className="distribucion-gastos">
      <div className="distribucion-gastos__grafica">
        <div className="distribucion-gastos__svg-wrap">
          {categoriaActiva ? (
            <div className="grafica-tooltip grafica-tooltip--dona">
              <strong>{categoriaActiva.nombre}</strong>
              <span>{moneda(categoriaActiva.monto)}</span>
              <small>{categoriaActiva.porcentaje.toFixed(1)}%</small>
            </div>
          ) : null}

          <svg
            viewBox="0 0 220 220"
            className="distribucion-gastos__svg"
            aria-label="Distribución de gastos"
          >
            {segmentos.map((segmento, indice) => (
              <path
                key={segmento.categoria.nombre}
                d={arcoDona(segmento.inicio, segmento.fin)}
                fill={segmento.categoria.color}
                className={
                  indiceHover === indice
                    ? "distribucion-gastos__segmento distribucion-gastos__segmento--activo"
                    : "distribucion-gastos__segmento"
                }
                onMouseEnter={() => onHover(indice)}
                onMouseLeave={() => onHover(null)}
              />
            ))}
          </svg>
        </div>
      </div>

      <div className="distribucion-gastos__lista">
        {categorias.map((categoria, indice) => (
          <article
            key={categoria.nombre}
            className="distribucion-categoria"
            onMouseEnter={() => onHover(indice)}
            onMouseLeave={() => onHover(null)}
          >
            <div className="distribucion-categoria__encabezado">
              <span>
                <i style={{ background: categoria.color }} />
                {categoria.nombre}
              </span>

              <strong>{categoria.porcentaje.toFixed(1)}%</strong>
            </div>

            <div className="distribucion-categoria__barra">
              <span
                style={{
                  width: `${categoria.porcentaje}%`,
                  background: categoria.color,
                }}
              />
            </div>

            <small>{moneda(categoria.monto)}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function GraficaAhorro({
  meses,
  puntos,
  maximo,
  indiceHover,
  onHover,
}: {
  meses: ReporteMes[];
  puntos: string;
  maximo: number;
  indiceHover: number | null;
  onHover: (indice: number | null) => void;
}) {
  const area = puntos ? `0,180 ${puntos} 760,180` : "";
  const mesActivo = indiceHover === null ? null : meses[indiceHover];

  return (
    <div className="grafica-ahorro">
      <div className="grafica-ahorro__svg-wrap">
        {mesActivo ? (() => {
          const indice = indiceHover ?? 0;
          const xPorcentaje =
            (indice / Math.max(meses.length - 1, 1)) * 100;
          const yPorcentaje =
            90 - (Math.max(mesActivo.ahorro, 0) / maximo) * 76;

          return (
            <div
              className="grafica-tooltip grafica-tooltip--ahorro"
              style={{
                left: `${xPorcentaje}%`,
                top: `${Math.max(yPorcentaje - 22, 3)}%`,
              }}
            >
              <strong>{mesActivo.mes}</strong>
              <div>
                <span className="tooltip-ahorro">● Ahorro</span>
                <b className="tooltip-ahorro">{moneda(mesActivo.ahorro)}</b>
              </div>
            </div>
          );
        })() : null}

        <svg
          viewBox="0 0 760 200"
          preserveAspectRatio="none"
          aria-label="Gráfica de ahorro mensual"
        >
          <polygon
            className="grafica-ahorro__relleno"
            points={area}
          />

          <polyline
            className="grafica-ahorro__linea"
            points={puntos}
          />

          {meses.map((mes, indice) => {
            const x =
              meses.length === 1
                ? 380
                : (indice / (meses.length - 1)) * 760;

            const y =
              180 -
              (Math.max(mes.ahorro, 0) / maximo) * 160;

            return (
              <circle
                key={mes.clave}
                cx={x}
                cy={y}
                r={indiceHover === indice ? 4.8 : 3.2}
                className="grafica-ahorro__punto"
                onMouseEnter={() => onHover(indice)}
                onMouseLeave={() => onHover(null)}
              />
            );
          })}
        </svg>
      </div>

      <div className="grafica-ahorro__meses">
        {meses.map((mes) => (
          <span key={mes.clave}>{mes.mes}</span>
        ))}
      </div>
    </div>
  );
}

function EstadoVacio({ texto }: { texto: string }) {
  return <div className="reportes-vacio">{texto}</div>;
}