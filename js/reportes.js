
// ==========================================
// REPORTES
// ESSENZA
// ==========================================


// ==========================================
// CARGAR MOVIMIENTOS DE DINERO
// ==========================================


async function cargarMovimientosDineroDesdeSupabase() {

  const { data, error } = await supabaseClient
    .from("movimientos_dinero")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {

    console.error(
      "Error cargando movimientos de dinero:",
      error
    );

    return [];
  }

  return data || [];
}
async function cargarVentasDesdeSupabase() {

  const { data, error } = await supabaseClient
    .from("ventas")
    .select(`
      id,
      fecha,
      subtotal,
      descuento,
      total,
      estado
    `)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error cargando ventas desde Supabase:", error);
    return [];
  }

  console.log("Ventas cargadas para Reportes:", data);

  return data || [];
}
// ==========================================
// MES SELECCIONADO
// ==========================================

function obtenerMesActualReporte() {

  if (window.mesReporteSeleccionado) {
    return window.mesReporteSeleccionado;
  }

  const ahora = new Date();

  return `${ahora.getFullYear()}-${String(
    ahora.getMonth() + 1
  ).padStart(2, "0")}`;
}


// ==========================================
// OBTENER MES DE UNA FECHA
// ==========================================

function mesDeFechaReporte(fecha) {

  if (!fecha) return "";

  const texto = String(fecha);

  // Fecha tipo YYYY-MM-DD
  if (/^\d{4}-\d{2}/.test(texto)) {
    return texto.slice(0, 7);
  }

  const d = new Date(fecha);

  if (isNaN(d.getTime())) {
    return texto.slice(0, 7);
  }

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}


// ==========================================
// NOMBRE DEL MES
// ==========================================

function nombreMesReporte(mes) {

  const [anio, numeroMes] = mes.split("-");

  const fecha = new Date(
    Number(anio),
    Number(numeroMes) - 1,
    1
  );

  return fecha.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric"
  });
}


// ==========================================
// FORMATO DE FECHA
// ==========================================

function formatoFechaReporte(fecha) {

  if (!fecha) return "";

  const d = new Date(`${fecha}T00:00:00`);

  if (isNaN(d.getTime())) {
    return fecha;
  }

  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}


// ==========================================
// REGISTRAR MOVIMIENTO DE DINERO
// ==========================================

async function registrarMovimientoDineroReporte() {

  const tipo =
    document.getElementById(
      "reporteMovimientoTipo"
    )?.value;

  const categoria =
    document.getElementById(
      "reporteMovimientoCategoria"
    )?.value || "Otros";

  const concepto =
    document.getElementById(
      "reporteMovimientoConcepto"
    )?.value.trim();

  const valor = Number(
    document.getElementById(
      "reporteMovimientoValor"
    )?.value
  );

  const fecha =
    document.getElementById(
      "reporteMovimientoFecha"
    )?.value;

  const descripcion =
    document.getElementById(
      "reporteMovimientoDescripcion"
    )?.value.trim() || null;


  // ==========================================
  // VALIDACIONES
  // ==========================================

  if (
    tipo !== "entrada" &&
    tipo !== "salida"
  ) {

    alert(
      "Selecciona si es una entrada o una salida."
    );

    return;
  }


  if (!valor || valor <= 0) {

    alert(
      "Ingresa un valor válido."
    );

    return;
  }


  if (!fecha) {

    alert(
      "Selecciona la fecha."
    );

    return;
  }


  if (!concepto) {

    alert(
      "Escribe el concepto del movimiento."
    );

    return;
  }


  // ==========================================
  // INSERTAR
  // ==========================================

  const { error } = await supabaseClient
    .from("movimientos_dinero")
    .insert([{

      tipo,

      categoria,

      concepto,

      valor,

      fecha,

      descripcion,

      usuario_id:
        window.usuarioActual?.id || null

    }]);


  if (error) {

    console.error(
      "Error registrando movimiento:",
      error
    );

    alert(
      "No fue posible registrar el movimiento."
    );

    return;
  }


  alert(
    tipo === "salida"
      ? "Salida de dinero registrada correctamente."
      : "Entrada de dinero registrada correctamente."
  );


  renderView("reportes");
}


// ==========================================
// RENDER REPORTES
// ==========================================

async function renderReportes() {

  const mesSeleccionado =
    obtenerMesActualReporte();

  const movimientos =
    await cargarMovimientosDineroDesdeSupabase();

  const ventas =
    await cargarVentasDesdeSupabase();


  // ==========================================
  // VENTAS DEL MES
  // ==========================================

  const ventasDelMes = ventas.filter(venta => {

    if (
      venta.estado === "anulada" ||
      venta.estado === "anulado" ||
      venta.estado === "cancelada" ||
      venta.estado === "cancelado"
    ) {

      return false;
    }

    return (
      mesDeFechaReporte(venta.fecha) ===
      mesSeleccionado
    );
  });


  let totalVentas = 0;

  let inversionMercancia = 0;


// ==========================================
// CALCULAR VENTAS E INVERSIÓN
// ==========================================

ventasDelMes.forEach(venta => {

  totalVentas += Number(
    venta.total || 0
  );

  const detalles =
    Array.isArray(venta.venta_detalles)
      ? venta.venta_detalles
      : [];

  detalles.forEach(detalle => {

    const cantidad =
      Number(detalle.cantidad || 0);

    const precioCompra =
      Number(detalle.precio_compra || 0);

    inversionMercancia +=
      precioCompra * cantidad;

  });

});


// ==========================================
// GANANCIA BRUTA
// ==========================================

const gananciaBruta =
  totalVentas -
  inversionMercancia;

  // ==========================================
  // MOVIMIENTOS DEL MES
  // ==========================================

  const movimientosDelMes =
    movimientos.filter(movimiento =>
      mesDeFechaReporte(
        movimiento.fecha
      ) === mesSeleccionado
    );


  // ==========================================
  // SALIDAS DEL MES
  // ==========================================

  const salidasMes =
    movimientosDelMes
      .filter(
        movimiento =>
          movimiento.tipo === "salida"
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(
            movimiento.valor || 0
          ),
        0
      );


  // ==========================================
  // ENTRADAS DEL MES
  // ==========================================

  const entradasMes =
    movimientosDelMes
      .filter(
        movimiento =>
          movimiento.tipo === "entrada"
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(
            movimiento.valor || 0
          ),
        0
      );


  // ==========================================
  // GANANCIA FINAL
  // ==========================================

  const gananciaFinal =
    gananciaBruta -
    salidasMes +
    entradasMes;


  // ==========================================
  // DINERO PERSONAL
  // ==========================================
  //
  // Una salida con categoría "Dinero personal"
  // significa dinero tomado del negocio.
  //
  // Una entrada con categoría "Dinero personal"
  // significa dinero devuelto al negocio.
  //
  // Se revisan TODOS los movimientos para saber
  // cuánto queda pendiente por devolver.
  // ==========================================

  const salidasPersonales =
    movimientos
      .filter(
        movimiento =>
          movimiento.tipo === "salida" &&
          movimiento.categoria === "Dinero personal"
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(
            movimiento.valor || 0
          ),
        0
      );


  const entradasPersonales =
    movimientos
      .filter(
        movimiento =>
          movimiento.tipo === "entrada" &&
          movimiento.categoria === "Dinero personal"
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(
            movimiento.valor || 0
          ),
        0
      );


  const saldoPersonal =
    salidasPersonales -
    entradasPersonales;


  // ==========================================
  // MOVIMIENTOS PERSONALES DEL MES
  // ==========================================

  const salidasPersonalesMes =
    movimientosDelMes
      .filter(
        movimiento =>
          movimiento.tipo === "salida" &&
          movimiento.categoria === "Dinero personal"
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(
            movimiento.valor || 0
          ),
        0
      );


  const entradasPersonalesMes =
    movimientosDelMes
      .filter(
        movimiento =>
          movimiento.tipo === "entrada" &&
          movimiento.categoria === "Dinero personal"
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(
            movimiento.valor || 0
          ),
        0
      );


  // ==========================================
  // HTML
  // ==========================================

  return `

    <div class="view-content">


      <!-- ======================================
           SELECTOR DE MES
           ====================================== -->

      <div class="card">

        <div class="section-head">

          <div>

            <h3>
              Reporte mensual
            </h3>

            <p class="muted">
              ${nombreMesReporte(
                mesSeleccionado
              )}
            </p>

          </div>


          <input
            type="month"
            value="${mesSeleccionado}"
            onchange="
              window.mesReporteSeleccionado = this.value;
              renderView('reportes');
            "
            style="
              padding:10px;
              border:1px solid #ddd;
              border-radius:8px;
            "
          >

        </div>

      </div>


      <!-- ======================================
           RESUMEN FINANCIERO
           ====================================== -->

      <div class="stats-grid">


        <div class="stat-card">

          <div class="stat-label">
            Ventas del mes
          </div>

          <div class="stat-value">
            ${money(totalVentas)}
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Inversión en mercancía
          </div>

          <div class="stat-value">
            ${money(inversionMercancia)}
          </div>

          <div class="stat-extra">
            Costo de los productos vendidos
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Ganancia bruta
          </div>

          <div class="stat-value">
            ${money(gananciaBruta)}
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Salidas del mes
          </div>

          <div class="stat-value">
            ${money(salidasMes)}
          </div>

          <div class="stat-extra">
            Gastos y dinero retirado
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Entradas del mes
          </div>

          <div class="stat-value">
            ${money(entradasMes)}
          </div>

          <div class="stat-extra">
            Dinero ingresado al negocio
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Ganancia final
          </div>

          <div class="stat-value">
            ${money(gananciaFinal)}
          </div>

          <div class="stat-extra">
            Ventas − inversión − salidas + entradas
          </div>

        </div>

      </div>


      <!-- ======================================
           DINERO PERSONAL
           ====================================== -->

      <div class="card mt">

        <div class="section-head">

          <div>

            <h3>
              Dinero personal
            </h3>

            <p class="muted">
              Control del dinero retirado del negocio
              y posteriormente devuelto.
            </p>

          </div>

        </div>


        <div class="stats-grid">


          <div class="stat-card">

            <div class="stat-label">
              Retirado este mes
            </div>

            <div class="stat-value">
              ${money(
                salidasPersonalesMes
              )}
            </div>

          </div>


          <div class="stat-card">

            <div class="stat-label">
              Devuelto este mes
            </div>

            <div class="stat-value">
              ${money(
                entradasPersonalesMes
              )}
            </div>

          </div>


          <div class="stat-card">

            <div class="stat-label">
              Pendiente por devolver
            </div>

            <div class="stat-value">
              ${money(
                Math.max(
                  0,
                  saldoPersonal
                )
              )}
            </div>

          </div>


        </div>

      </div>


      <!-- ======================================
           REGISTRAR MOVIMIENTO
           ====================================== -->

      <div class="card mt">

        <div class="section-head">

          <div>

            <h3>
              Movimiento del negocio
            </h3>

            <p class="muted">
              Registra cualquier entrada o salida
              de dinero del negocio.
            </p>

          </div>

        </div>


        <div
          style="
            margin-top:20px;
            padding:18px;
            background:var(--soft);
            border:1px solid var(--border);
            border-radius:14px;
          "
        >


          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(
                  auto-fit,
                  minmax(180px,1fr)
                );
              gap:12px;
            "
          >


            <!-- TIPO -->

            <div>

              <label>
                Tipo de movimiento
              </label>

              <select
                id="reporteMovimientoTipo"
              >

                <option value="salida">
                  Salida de dinero
                </option>

                <option value="entrada">
                  Entrada de dinero
                </option>

              </select>

            </div>


            <!-- CATEGORÍA -->

            <div>

              <label>
                Categoría
              </label>

              <select
                id="reporteMovimientoCategoria"
              >

                <option value="Arriendo">
                  Arriendo
                </option>

                <option value="Servicios">
                  Servicios
                </option>

                <option value="Transporte">
                  Transporte
                </option>

                <option value="Publicidad">
                  Publicidad
                </option>

                <option value="Compras">
                  Compras
                </option>

                <option value="Nómina">
                  Nómina
                </option>

                <option value="Dinero personal">
                  Dinero personal
                </option>

                <option value="Otros" selected>
                  Otros
                </option>

              </select>

            </div>


            <!-- CONCEPTO -->

            <div>

              <label>
                Concepto
              </label>

              <input
                id="reporteMovimientoConcepto"
                type="text"
                placeholder="Ej. Pago de luz"
              >

            </div>


            <!-- VALOR -->

            <div>

              <label>
                Valor
              </label>

              <input
                id="reporteMovimientoValor"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
              >

            </div>


            <!-- FECHA -->

            <div>

              <label>
                Fecha
              </label>

              <input
                id="reporteMovimientoFecha"
                type="date"
                value="${mesSeleccionado}-01"
              >

            </div>


            <!-- DESCRIPCIÓN -->

            <div
              style="
                grid-column:1/-1;
              "
            >

              <label>
                Descripción
              </label>

              <input
                id="reporteMovimientoDescripcion"
                type="text"
                placeholder="Descripción o motivo opcional"
              >

            </div>


          </div>


          <button
            class="btn btn-primary"
            style="margin-top:15px;"
            onclick="
              registrarMovimientoDineroReporte()
            "
          >
            Registrar movimiento
          </button>


        </div>

      </div>


      <!-- ======================================
           HISTORIAL DE MOVIMIENTOS
           ====================================== -->

      <div class="card mt">

        <div class="section-head">

          <div>

            <h3>
              Movimientos de
              ${nombreMesReporte(
                mesSeleccionado
              )}
            </h3>

            <p class="muted">
              Todas las entradas y salidas
              registradas en el mes.
            </p>

          </div>


          <strong>
            ${movimientosDelMes.length}
            movimientos
          </strong>

        </div>


        ${
          movimientosDelMes.length

            ? movimientosDelMes
                .map(movimiento => `

              <div
                class="list-item"
                style="
                  display:flex;
                  justify-content:
                    space-between;
                  align-items:center;
                  gap:15px;
                "
              >


                <div>


                  <strong>

                    ${
                      movimiento.tipo === "salida"
                        ? "Salida de dinero"
                        : "Entrada de dinero"
                    }

                  </strong>


                  <div class="muted">

                    ${
                      movimiento.categoria ||
                      "Otros"
                    }

                    ·

                    ${formatoFechaReporte(
                      movimiento.fecha
                    )}

                  </div>


                  <div>

                    ${
                      movimiento.concepto ||
                      "Sin concepto"
                    }

                  </div>


                  ${
                    movimiento.descripcion

                      ? `
                        <div class="muted">
                          ${movimiento.descripcion}
                        </div>
                      `

                      : ""
                  }


                </div>


                <strong>

                  ${
                    movimiento.tipo === "salida"
                      ? "-"
                      : "+"
                  }

                  ${money(
                    movimiento.valor
                  )}

                </strong>


              </div>

            `)
                .join("")

            : `

              <div class="empty">

                No hay movimientos registrados
                en este mes.

              </div>

            `
        }


      </div>


    </div>

  `;
}
