async function cargarGastosDesdeSupabase() {
  const { data, error } = await supabaseClient
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error cargando gastos:", error);
    return [];
  }

  return data || [];
}

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

function obtenerMesActualReporte() {
  if (window.mesReporteSeleccionado) {
    return window.mesReporteSeleccionado;
  }

  const ahora = new Date();

  return `${ahora.getFullYear()}-${String(
    ahora.getMonth() + 1
  ).padStart(2, "0")}`;
}

function mesDeFechaReporte(fecha) {
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

async function registrarGastoReporte() {
  const concepto =
    document.getElementById("reporteGastoConcepto")?.value.trim();

  const categoria =
    document.getElementById("reporteGastoCategoria")?.value || "Otros";

  const valor = Number(
    document.getElementById("reporteGastoValor")?.value
  );

  const fecha =
    document.getElementById("reporteGastoFecha")?.value;

  const descripcion =
    document.getElementById("reporteGastoDescripcion")?.value.trim() || null;

  if (!concepto) {
    alert("Escribe el concepto del gasto.");
    return;
  }

  if (!valor || valor <= 0) {
    alert("Ingresa un valor válido para el gasto.");
    return;
  }

  if (!fecha) {
    alert("Selecciona la fecha del gasto.");
    return;
  }

  const { error } = await supabaseClient
    .from("gastos")
    .insert([{
      concepto,
      categoria,
      valor,
      fecha,
      descripcion,
      usuario_id: window.usuarioActual?.id || null
    }]);

  if (error) {
    console.error("Error registrando gasto:", error);
    alert("No fue posible registrar el gasto.");
    return;
  }

  alert("Gasto registrado correctamente.");

  renderView("reportes");
}

async function registrarMovimientoDineroReporte() {
  const tipo =
    document.getElementById("reporteMovimientoTipo")?.value;

  const valor = Number(
    document.getElementById("reporteMovimientoValor")?.value
  );

  const fecha =
    document.getElementById("reporteMovimientoFecha")?.value;

  const concepto =
    document.getElementById("reporteMovimientoConcepto")?.value.trim() || null;

  if (!tipo) {
    alert("Selecciona el tipo de movimiento.");
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

  const { error } = await supabaseClient
    .from("movimientos_dinero")
    .insert([{
      tipo,
      valor,
      fecha,
      concepto,
      usuario_id: window.usuarioActual?.id || null
    }]);

  if (error) {
    console.error("Error registrando movimiento:", error);
    alert("No fue posible registrar el movimiento.");
    return;
  }

  alert(
    tipo === "retiro"
      ? "Retiro registrado correctamente."
      : "Devolución registrada correctamente."
  );

  renderView("reportes");
}

async function renderReportes() {
  const mesSeleccionado = obtenerMesActualReporte();

  const gastos = await cargarGastosDesdeSupabase();
  const movimientos = await cargarMovimientosDineroDesdeSupabase();

  const ventas = Array.isArray(DB.ventas)
    ? DB.ventas
    : [];

  // ==========================================
  // VENTAS DEL MES
  // ==========================================

  const ventasDelMes = ventas.filter(v => {
    if (
      v.estado === "anulada" ||
      v.estado === "anulado" ||
      v.estado === "cancelada" ||
      v.estado === "cancelado"
    ) {
      return false;
    }

    return mesDeFechaReporte(v.fecha) === mesSeleccionado;
  });

  let totalVentas = 0;
  let inversionMercancia = 0;

  ventasDelMes.forEach(venta => {
    totalVentas += Number(venta.total || 0);

    const items = Array.isArray(venta.items)
      ? venta.items
      : [];

    items.forEach(item => {
      const cantidad = Number(item.cantidad || 0);

      let precioCompra = Number(
        item.precioCompra || 0
      );

      // Si la venta no guardó el precio de compra,
      // intentamos obtenerlo desde el producto actual.
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

      inversionMercancia += precioCompra * cantidad;
    });
  });

  const gananciaBruta =
    totalVentas - inversionMercancia;

  // ==========================================
  // GASTOS DEL MES
  // ==========================================

  const gastosDelMes = gastos.filter(g =>
    mesDeFechaReporte(g.fecha) === mesSeleccionado
  );

  const totalGastos = gastosDelMes.reduce(
    (total, gasto) =>
      total + Number(gasto.valor || 0),
    0
  );

  


  // ==========================================
  // MOVIMIENTOS DE DINERO
  // ==========================================

  const movimientosDelMes = movimientos.filter(m =>
    mesDeFechaReporte(m.fecha) === mesSeleccionado
  );

  const retirosMes = movimientosDelMes
    .filter(m => m.tipo === "retiro")
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );

  const devolucionesMes = movimientosDelMes
    .filter(m => m.tipo === "devolucion")
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );

  const gananciaFinal =
  gananciaBruta
  - totalGastos
  - retirosMes
  + devolucionesMes;

  // El saldo pendiente se calcula con TODOS los movimientos,
  // porque alguien puede retirar en un mes y devolver en otro.
  const retirosTotales = movimientos
    .filter(m => m.tipo === "retiro")
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );

  const devolucionesTotales = movimientos
    .filter(m => m.tipo === "devolucion")
    .reduce(
      (total, m) =>
        total + Number(m.valor || 0),
      0
    );

  const saldoPendiente =
    retirosTotales - devolucionesTotales;

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
              ${nombreMesReporte(mesSeleccionado)}
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

      <!-- RESUMEN FINANCIERO -->
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
            Gastos del mes
          </div>
          <div class="stat-value">
            ${money(totalGastos)}
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
            Ganancia bruta menos gastos
          </div>
        </div>

      </div>

      <!-- MOVIMIENTOS DEL NEGOCIO -->
      <div class="card mt">

        <div class="section-head">
          <div>
            <h3>Movimientos del negocio</h3>
            <p class="muted">
              Registra los gastos del negocio y el dinero que retires o devuelvas.
            </p>
          </div>
        </div>


        <!-- ==========================================
             REGISTRAR GASTO
             ========================================== -->

        <div style="
          margin-top:20px;
          padding:18px;
          background:var(--soft);
          border:1px solid var(--border);
          border-radius:14px;
        ">

          <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 5px;">
              Registrar gasto
            </h4>

            <p class="muted" style="margin:0;">
              Registra los gastos correspondientes al negocio.
            </p>
          </div>

          <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
          ">

            <div>
              <label>Concepto</label>

              <input
                id="reporteGastoConcepto"
                type="text"
                placeholder="Ej. Pago de luz"
              >
            </div>


            <div>
              <label>Categoría</label>

              <select id="reporteGastoCategoria">
                <option value="Arriendo">Arriendo</option>
                <option value="Servicios">Servicios</option>
                <option value="Transporte">Transporte</option>
                <option value="Publicidad">Publicidad</option>
                <option value="Compras">Compras</option>
                <option value="Nómina">Nómina</option>
                <option value="Otros" selected>Otros</option>
              </select>
            </div>


            <div>
              <label>Valor</label>

              <input
                id="reporteGastoValor"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
              >
            </div>


            <div>
              <label>Fecha</label>

              <input
                id="reporteGastoFecha"
                type="date"
                value="${mesSeleccionado}-01"
              >
            </div>


            <div style="grid-column:1/-1;">
              <label>Descripción</label>

              <input
                id="reporteGastoDescripcion"
                type="text"
                placeholder="Descripción opcional"
              >
            </div>

          </div>


          <button
            class="btn btn-primary"
            style="margin-top:15px;"
            onclick="registrarGastoReporte()"
          >
            Registrar gasto
          </button>

        </div>


        <!-- ==========================================
             DINERO PRESTADO
             ========================================== -->

        <div style="
          margin-top:20px;
          padding:18px;
          background:var(--soft);
          border:1px solid var(--border);
          border-radius:14px;
        ">

          <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 5px;">
              Dinero prestado por el negocio
            </h4>

            <p class="muted" style="margin:0;">
              Registra cuando retires dinero del negocio y cuando lo devuelvas.
            </p>
          </div>


          <!-- RESUMEN DE DINERO -->

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


          <!-- FORMULARIO DE MOVIMIENTO -->

          <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
            margin-top:20px;
          ">

            <div>
              <label>Movimiento</label>

              <select id="reporteMovimientoTipo">
                <option value="retiro">
                  Saqué dinero
                </option>

                <option value="devolucion">
                  Devolví dinero
                </option>
              </select>
            </div>


            <div>
              <label>Valor</label>

              <input
                id="reporteMovimientoValor"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
              >
            </div>


            <div>
              <label>Fecha</label>

              <input
                id="reporteMovimientoFecha"
                type="date"
                value="${mesSeleccionado}-01"
              >
            </div>


            <div>
              <label>Concepto</label>

              <input
                id="reporteMovimientoConcepto"
                type="text"
                placeholder="Ej. Dinero personal"
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

      </div>


      <!-- ==========================================
           LISTA DE GASTOS
           ========================================== -->

      <div class="card mt">

        <div class="section-head">
          <div>
            <h3>Gastos de ${nombreMesReporte(mesSeleccionado)}</h3>
          </div>

          <strong>
            ${money(totalGastos)}
          </strong>
        </div>

        ${
          gastosDelMes.length
            ? gastosDelMes.map(gasto => `
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
                      ${gasto.concepto || "Sin concepto"}
                    </strong>

                    <div class="muted">
                      ${gasto.categoria || "Otros"}
                      ·
                      ${formatoFechaReporte(gasto.fecha)}
                    </div>

                    ${
                      gasto.descripcion
                        ? `<div class="muted">${gasto.descripcion}</div>`
                        : ""
                    }

                  </div>

                  <strong>
                    ${money(gasto.valor)}
                  </strong>

                </div>
              `).join("")
            : `
              <div class="empty">
                No hay gastos registrados en este mes.
              </div>
            `
        }

      </div>

      <!-- HISTORIAL DE MOVIMIENTOS -->
      <div class="card mt">

        <div class="section-head">
          <div>
            <h3>
              Movimientos de dinero de ${nombreMesReporte(mesSeleccionado)}
            </h3>
          </div>
        </div>

        ${
          movimientosDelMes.length
            ? movimientosDelMes.map(mov => `
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
                        mov.tipo === "retiro"
                          ? "Saqué dinero"
                          : "Devolví dinero"
                      }
                    </strong>

                    <div class="muted">
                      ${formatoFechaReporte(mov.fecha)}
                      ${
                        mov.concepto
                          ? ` · ${mov.concepto}`
                          : ""
                      }
                    </div>
                  </div>

                  <strong>
                    ${money(mov.valor)}
                  </strong>

                </div>
              `).join("")
            : `
              <div class="empty">
                No hay movimientos de dinero registrados en este mes.
              </div>
            `
        }

      </div>

    </div>
  `;
}