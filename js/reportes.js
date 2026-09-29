async function cargarMovimientosDineroDesdeSupabase() {
  const { data, error } = await supabaseClient
    .from("movimientos_dinero")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error cargando movimientos de dinero:", error);
    return [];
  }

  return data || [];
}

function obtenerActualReporte() {
  if (window.ReporteSeleccionado) {
    return window.ReporteSeleccionado;
  }

  const ahora = new Date();

  return `${ahora.getFullYear()}-${String(
    ahora.getMonth() + 1
  ).padStart(2, "0")}`;
}

function DeFechaReporte(fecha) {
  if (!fecha) return "";

  const texto = String(fecha);

  // Fechas tipo YYYY-MM-DD
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

function nombreReporte(mes) {
  const [anio, numero] = mes.split("-");

  const fecha = new Date(
    Number(anio),
    Number(numero) - 1,
    1
  );

  return fecha.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric"
  });
}

  const fecha = new Date(
    Number(anio),
    Number(numero) - 1,
    1
  );

  return fecha.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric"
  });
}

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

async function registrarMovimientoDineroReporte() {
  const tipo =
    document.getElementById("reporteMovimientoTipo")?.value;

  const categoria =
    document.getElementById("reporteMovimientoCategoria")?.value || "Otros";

  const concepto =
    document.getElementById("reporteMovimientoConcepto")?.value.trim();

  const valor = Number(
    document.getElementById("reporteMovimientoValor")?.value
  );

  const fecha =
    document.getElementById("reporteMovimientoFecha")?.value;

  const descripcion =
    document.getElementById("reporteMovimientoDescripcion")?.value.trim() || null;

  if (!tipo) {
    alert("Selecciona si es una entrada o una salida.");
    return;
  }

  if (!valor || valor <= 0) {
    alert("Ingresa un valor válido.");
    return;
  }

  if (!fecha) {
    alert("Selecciona la fecha.");
    return;
  }

  if (!concepto) {
    alert("Escribe el concepto del movimiento.");
    return;
  }

  const { error } = await supabaseClient
    .from("movimientos_dinero")
    .insert([{
      tipo,
      categoria,
      concepto,
      valor,
      fecha,
      descripcion,
      usuario_id: window.usuarioActual?.id || null
    }]);

  if (error) {
    console.error("Error registrando movimiento:", error);
    alert("No fue posible registrar el movimiento.");
    return;
  }

  alert(
    tipo === "salida"
      ? "Salida de dinero registrada correctamente."
      : "Entrada de dinero registrada correctamente."
  );

  renderView("reportes");
}
async function renderReportes() {
  const Seleccionado = obtenerActualReporte();

  const movimientos =
    await cargarMovimientosDineroDesdeSupabase();

  const ventas = Array.isArray(DB.ventas)
    ? DB.ventas
    : [];

  // ==========================================
  // VENTAS DEL MES
  // ==========================================

  const ventasDel = ventas.filter(v => {
    if (
      v.estado === "anulada" ||
      v.estado === "anulado" ||
      v.estado === "cancelada" ||
      v.estado === "cancelado"
    ) {
      return false;
    }

    return DeFechaReporte(v.fecha) === Seleccionado;
  });

  let totalVentas = 0;
  let inversionMercancia = 0;

  ventasDel.forEach(venta => {
    totalVentas += Number(venta.total || 0);

    const items = Array.isArray(venta.items)
      ? venta.items
      : [];

    items.forEach(item => {
      const cantidad = Number(item.cantidad || 0);

      let precioCompra = Number(
        item.precioCompra || 0
      );

      if (!precioCompra && item.productoId) {
        const producto = DB.productos?.find(
          p => p.id === item.productoId
        );

        if (producto) {
          precioCompra = Number(
            producto.precioCompra || 0
          );
        }
      }

      inversionMercancia +=
        precioCompra * cantidad;
    });
  });

  const gananciaBruta =
    totalVentas - inversionMercancia;


  // ==========================================
  // MOVIMIENTOS DEL MES
  // ==========================================

  const movimientosDel = movimientos.filter(m =>
    DeFechaReporte(m.fecha) === Seleccionado
  );


  // ==========================================
  // SALIDAS DEL MES
  // ==========================================

  const salidasMes = movimientosDel
    .filter(m => m.tipo === "salida")
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );


  // ==========================================
  // ENTRADAS DEL MES
  // ==========================================

  const entradasMes = movimientosDel
    .filter(m => m.tipo === "entrada")
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );


  // ==========================================
  // GANANCIA FINAL
  // ==========================================

  const gananciaFinal =
    gananciaBruta
    - salidasMes
    + entradasMes;


  // ==========================================
  // DINERO PERSONAL
  // ==========================================

  // Solo los movimientos de categoría
  // "Dinero personal" afectan el saldo
  // pendiente de devolver.

  const retirosTotales = movimientos
    .filter(m =>
      m.tipo === "salida" &&
      m.categoria === "Dinero personal"
    )
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );


  const devolucionesTotales = movimientos
    .filter(m =>
      m.tipo === "entrada" &&
      m.categoria === "Dinero personal"
    )
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );


  const saldoPendiente =
    retirosTotales - devolucionesTotales;


  // ==========================================
  // DINERO PERSONAL DEL MES
  // ==========================================

  const retirosMes = movimientosDel
    .filter(m =>
      m.tipo === "salida" &&
      m.categoria === "Dinero personal"
    )
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );


  const devolucionesMes = movimientosDel
    .filter(m =>
      m.tipo === "entrada" &&
      m.categoria === "Dinero personal"
    )
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );


  // ==========================================
  // HTML
  // ==========================================

  return `
    <div class="view-content">

      <!-- SELECTOR DE MES -->
      <div class="card">

        <div class="section-head">

          <div>
            <h3>Reporte mensual</h3>

            <p class="muted">
              ${nombreReporte(Seleccionado)}
            </p>
          </div>

          <input
            type="month"
            value="${Seleccionado}"
            onchange="
              window.ReporteSeleccionado = this.value;
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


      <!-- ==========================================
           RESUMEN FINANCIERO
           ========================================== -->

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

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Entradas del mes
          </div>

          <div class="stat-value">
            ${money(entradasMes)}
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
            Ganancia bruta - salidas + entradas
          </div>

        </div>

      </div>


      <!-- ==========================================
           MOVIMIENTOS DEL NEGOCIO
           ========================================== -->

      <div class="card mt">

        <div class="section-head">

          <div>

            <h3>
              Movimiento del negocio
            </h3>

            <p class="muted">
              Registra cualquier entrada o salida de dinero.
            </p>

          </div>

        </div>


        <!-- FORMULARIO ÚNICO -->

        <div style="
          margin-top:20px;
          padding:18px;
          background:var(--soft);
          border:1px solid var(--border);
          border-radius:14px;
        ">

          <div style="
            display:grid;
            grid-template-columns:
              repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
          ">


            <!-- TIPO -->

            <div>

              <label>
                Tipo de movimiento
              </label>

              <select id="reporteMovimientoTipo">

                <option value="salida">
                  Salida de dinero
                </option>

                <option value="entrada">
                  Entrada de dinero
                </option>

              </select>

            </div>


            <!-- CATEGORIA -->

            <div>

              <label>
                Categoría
              </label>

              <select id="reporteMovimientoCategoria">

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
                placeholder="Ej. Pago de arriendo"
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
                value="${Seleccionado}-01"
              >

            </div>


            <!-- DESCRIPCIÓN -->

            <div style="
              grid-column:1/-1;
            ">

              <label>
                Descripción
              </label>

              <input
                id="reporteMovimientoDescripcion"
                type="text"
                placeholder="Detalle opcional del movimiento"
              >

            </div>

          </div>


          <button
            class="btn btn-primary"
            style="margin-top:15px;"
            onclick="registrarMovimientoDineroReporte()"
          >
            Registrar movimiento
          </button>

        </div>


        <!-- ==========================================
             RESUMEN DINERO PERSONAL
             ========================================== -->

        <div style="
          margin-top:20px;
          padding:18px;
          background:var(--soft);
          border:1px solid var(--border);
          border-radius:14px;
        ">

          <h4 style="margin:0 0 15px;">
            Dinero personal
          </h4>

          <div
            class="stats-grid"
            style="margin-top:15px;"
          >

            <div class="stat-card">

              <div class="stat-label">
                Retirado este mes
              </div>

              <div class="stat-value">
                ${money(retirosMes)}
              </div>

            </div>


            <div class="stat-card">

              <div class="stat-label">
                Devuelto este mes
              </div>

              <div class="stat-value">
                ${money(devolucionesMes)}
              </div>

            </div>


            <div class="stat-card">

              <div class="stat-label">
                Pendiente por devolver
              </div>

              <div class="stat-value">
                ${money(Math.max(0, saldoPendiente))}
              </div>

            </div>

          </div>

        </div>

      </div>


      <!-- ==========================================
           HISTORIAL ÚNICO
           ========================================== -->

      <div class="card mt">

        <div class="section-head">

          <div>

            <h3>
              Movimientos de ${nombreReporte(Seleccionado)}
            </h3>

            <p class="muted">
              Entradas y salidas registradas durante el mes.
            </p>

          </div>

        </div>


        ${
          movimientosDel.length

            ? movimientosDel.map(mov => `

                <div
                  class="list-item"
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                  "
                >

                  <div>

                    <strong>

                      ${
                        mov.tipo === "salida"
                          ? "Salida de dinero"
                          : "Entrada de dinero"
                      }

                    </strong>


                    <div class="muted">

                      ${
                        mov.categoria ||
                        "Otros"
                      }

                      ·

                      ${
                        mov.concepto ||
                        "Sin concepto"
                      }

                      ·

                      ${
                        formatoFechaReporte(
                          mov.fecha
                        )
                      }

                    </div>


                    ${
                      mov.descripcion
                        ? `
                          <div class="muted">
                            ${mov.descripcion}
                          </div>
                        `
                        : ""
                    }

                  </div>


                  <strong>

                    ${
                      mov.tipo === "salida"
                        ? "-"
                        : "+"
                    }

                    ${money(mov.valor)}

                  </strong>

                </div>

              `).join("")

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