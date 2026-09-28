async function cargarAbonosDesdeSupabase() {
  const { data, error } = await supabaseClient
    .from("abonos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error cargando abonos:", error);
    return [];
  }

  return data || [];
}

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

async function cargarMovimientosFinancierosDesdeSupabase() {
  const { data, error } = await supabaseClient
    .from("movimientos_financieros")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error cargando movimientos financieros:", error);
    return [];
  }

  return data || [];
}


// =====================================================
// FECHA DEL REPORTE
// =====================================================

function obtenerMesReporte() {
  if (window.mesReporteSeleccionado) {
    return window.mesReporteSeleccionado;
  }

  const hoy = new Date();

  const mes =
    hoy.getFullYear() +
    "-" +
    String(hoy.getMonth() + 1).padStart(2, "0");

  window.mesReporteSeleccionado = mes;

  return mes;
}


// =====================================================
// CAMBIAR MES DEL REPORTE
// =====================================================

async function cambiarMesReporte(valor) {
  if (!valor) return;

  window.mesReporteSeleccionado = valor;

  renderView("reportes");
}


// =====================================================
// GUARDAR GASTO
// =====================================================

async function guardarGastoReporte() {
  const concepto =
    document.getElementById("reporteGastoConcepto")?.value.trim();

  const categoria =
    document.getElementById("reporteGastoCategoria")?.value.trim() ||
    "Otros";

  const valor =
    Number(document.getElementById("reporteGastoValor")?.value || 0);

  const fecha =
    document.getElementById("reporteGastoFecha")?.value;

  const descripcion =
    document.getElementById("reporteGastoDescripcion")?.value.trim() || "";

  if (!concepto) {
    alert("Escribe el concepto del gasto.");
    return;
  }

  if (!valor || valor <= 0) {
    alert("Escribe un valor válido para el gasto.");
    return;
  }

  if (!fecha) {
    alert("Selecciona la fecha del gasto.");
    return;
  }

  const { data: authData } =
    await supabaseClient.auth.getUser();

  const usuarioId =
    authData?.user?.id || null;

  const { error } = await supabaseClient
    .from("gastos")
    .insert([{
      concepto,
      categoria,
      valor,
      fecha,
      descripcion,
      usuario_id: usuarioId
    }]);

  if (error) {
    console.error("Error guardando gasto:", error);
    alert("No fue posible guardar el gasto.");
    return;
  }

  alert("Gasto registrado correctamente.");

  window.mesReporteSeleccionado =
    fecha.substring(0, 7);

  renderView("reportes");
}


// =====================================================
// GUARDAR MOVIMIENTO DE DINERO
// =====================================================

async function guardarMovimientoDineroReporte() {
  const tipo =
    document.getElementById("reporteMovimientoTipo")?.value;

  const valor =
    Number(
      document.getElementById("reporteMovimientoValor")?.value || 0
    );

  const fecha =
    document.getElementById("reporteMovimientoFecha")?.value;

  const concepto =
    document.getElementById("reporteMovimientoConcepto")?.value.trim() || "";

  if (!tipo) {
    alert("Selecciona el tipo de movimiento.");
    return;
  }

  if (!valor || valor <= 0) {
    alert("Escribe un valor válido.");
    return;
  }

  if (!fecha) {
    alert("Selecciona la fecha.");
    return;
  }

  const { data: authData } =
    await supabaseClient.auth.getUser();

  const usuarioId =
    authData?.user?.id || null;

  const { error } = await supabaseClient
    .from("movimientos_dinero")
    .insert([{
      tipo,
      valor,
      fecha,
      concepto,
      usuario_id: usuarioId
    }]);

  if (error) {
    console.error(
      "Error guardando movimiento de dinero:",
      error
    );

    alert("No fue posible guardar el movimiento.");
    return;
  }

  alert("Movimiento registrado correctamente.");

  window.mesReporteSeleccionado =
    fecha.substring(0, 7);

  renderView("reportes");
}


// =====================================================
// RENDER REPORTES
// =====================================================

async function renderReportes() {

  const mesSeleccionado = obtenerMesReporte();

  const [
    abonos,
    gastos,
    movimientosDinero
  ] = await Promise.all([
    cargarAbonosDesdeSupabase(),
    cargarGastosDesdeSupabase(),
    cargarMovimientosDineroDesdeSupabase()
  ]);


  // ===================================================
  // RANGO DEL MES
  // ===================================================

  const inicioMes =
    mesSeleccionado + "-01";

  const [anio, mes] =
    mesSeleccionado.split("-").map(Number);

  const ultimoDia =
    new Date(anio, mes, 0).getDate();

  const finMes =
    mesSeleccionado +
    "-" +
    String(ultimoDia).padStart(2, "0");


  // ===================================================
  // VENTAS DEL MES
  // ===================================================

  const todasLasVentas =
    DB.ventas || [];

  const ventas =
    todasLasVentas.filter(v => {

      const estado =
        String(v.estado || "").toLowerCase();

      if (
        estado === "anulada" ||
        estado === "anulado" ||
        estado === "cancelada" ||
        estado === "cancelado"
      ) {
        return false;
      }

      const fecha =
        String(
          v.fecha ||
          v.created_at ||
          ""
        ).substring(0, 10);

      return (
        fecha >= inicioMes &&
        fecha <= finMes
      );
    });


  // ===================================================
  // TOTAL VENTAS
  // ===================================================

  const totalVentas =
    ventas.reduce(
      (s, v) =>
        s + Number(v.total || 0),
      0
    );


  // ===================================================
  // COSTO / INVERSIÓN DE MERCANCÍA VENDIDA
  // ===================================================

  const costos =
    ventas.reduce(
      (s, v) => {

        const items =
          v.items || [];

        const costoVenta =
          items.reduce(
            (a, i) => {

              const producto =
                getProduct(i.productoId);

              const precioCompra =
                Number(
                  producto?.precioCompra || 0
                );

              const cantidad =
                Number(i.cantidad || 0);

              return (
                a +
                precioCompra * cantidad
              );
            },
            0
          );

        return s + costoVenta;
      },
      0
    );


  // ===================================================
  // GANANCIA BRUTA
  // ===================================================

  const gananciaBruta =
    totalVentas - costos;


  // ===================================================
  // VENTAS POR MÉTODO
  // ===================================================

  const methods = {};

  ventas.forEach(v => {

    const metodo =
      v.metodo ||
      v.metodo_pago ||
      "Sin especificar";

    methods[metodo] =
      (methods[metodo] || 0) +
      Number(v.total || 0);
  });


  // ===================================================
  // PRODUCTOS MÁS VENDIDOS
  // ===================================================

  const top = {};

  ventas.forEach(v => {

    (v.items || []).forEach(i => {

      top[i.productoId] =
        (top[i.productoId] || 0) +
        Number(i.cantidad || 0);

    });
  });

  const topList =
    Object.entries(top)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);


  // ===================================================
  // ABONOS DEL MES
  // ===================================================

  const abonosMes =
    abonos.filter(a => {

      const fecha =
        String(
          a.fecha ||
          a.created_at ||
          ""
        ).substring(0, 10);

      return (
        fecha >= inicioMes &&
        fecha <= finMes
      );
    });

  const totalAbonos =
    abonosMes.reduce(
      (s, a) =>
        s + Number(a.monto || 0),
      0
    );


  // ===================================================
  // GASTOS DEL MES
  // ===================================================

  const gastosMes =
    gastos.filter(g => {

      const fecha =
        String(
          g.fecha || ""
        ).substring(0, 10);

      return (
        fecha >= inicioMes &&
        fecha <= finMes
      );
    });

  const totalGastos =
    gastosMes.reduce(
      (s, g) =>
        s + Number(g.valor || 0),
      0
    );


  // ===================================================
  // MOVIMIENTOS DEL MES
  // ===================================================

  const movimientosMes =
    movimientosDinero.filter(m => {

      const fecha =
        String(
          m.fecha || ""
        ).substring(0, 10);

      return (
        fecha >= inicioMes &&
        fecha <= finMes
      );
    });


  let retiros = 0;
  let devoluciones = 0;

  movimientosMes.forEach(m => {

    const tipo =
      String(
        m.tipo || ""
      ).toLowerCase();

    const valor =
      Number(m.valor || 0);

    if (
      tipo === "retiro" ||
      tipo.includes("retiro") ||
      tipo.includes("salida")
    ) {
      retiros += valor;
    }

    if (
      tipo === "devolucion" ||
      tipo === "devolución" ||
      tipo.includes("devol")
    ) {
      devoluciones += valor;
    }
  });


  // ===================================================
  // UTILIDAD REAL DEL MES
  // ===================================================

  const utilidadDespuesGastos =
    gananciaBruta -
    totalGastos;


  // ===================================================
  // FLUJO DE DINERO
  // ===================================================

  const flujoDinero =
    totalVentas +
    totalAbonos +
    devoluciones -
    totalGastos -
    retiros;


  // ===================================================
  // INVENTARIO ACTUAL
  // ===================================================

  const inventarioValorizado =
    (DB.productos || []).reduce(
      (s, p) =>
        s +
        Number(p.stock || 0) *
        Number(p.precioCompra || 0),
      0
    );


  // ===================================================
  // FECHA PARA FORMULARIOS
  // ===================================================

  const hoy =
    new Date()
      .toISOString()
      .substring(0, 10);


  return `

    <!-- ========================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================= -->

    <div class="card">

      <div class="section-head">

        <div>
          <h2>Reporte financiero</h2>

          <div class="muted">
            Ventas, inversión, utilidad y movimientos
            del dinero del negocio.
          </div>
        </div>

        <div>

          <label>
            Mes
          </label>

          <input
            type="month"
            id="reporteMes"
            value="${mesSeleccionado}"
            onchange="cambiarMesReporte(this.value)"
          >

        </div>

      </div>

    </div>


    <!-- ========================================= -->
    <!-- RESUMEN PRINCIPAL -->
    <!-- ========================================= -->

    <div class="stats-grid grid mt">

      <div class="card stat-card">

        <div class="stat-label">
          Ventas del mes
        </div>

        <div class="stat-value">
          ${money(totalVentas)}
        </div>

        <div class="stat-extra">
          ${ventas.length} ventas
        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-label">
          Inversión / costo de mercancía
        </div>

        <div class="stat-value">
          ${money(costos)}
        </div>

        <div class="stat-extra">
          Costo de los productos vendidos
        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-label">
          Ganancia bruta
        </div>

        <div class="stat-value text-success">
          ${money(gananciaBruta)}
        </div>

        <div class="stat-extra">
          Ventas menos costo de mercancía
        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-label">
          Gastos del mes
        </div>

        <div class="stat-value">
          ${money(totalGastos)}
        </div>

        <div class="stat-extra">
          ${gastosMes.length} gastos registrados
        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-label">
          Utilidad después de gastos
        </div>

        <div class="stat-value text-success">
          ${money(utilidadDespuesGastos)}
        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-label">
          Abonos de apartados
        </div>

        <div class="stat-value">
          ${money(totalAbonos)}
        </div>

        <div class="stat-extra">
          Dinero recibido de apartados
        </div>

      </div>

    </div>


    <!-- ========================================= -->
    <!-- MOVIMIENTO DE DINERO -->
    <!-- ========================================= -->

    <div class="card mt">

      <div class="section-head">

        <div>
          <h2>Movimiento del dinero</h2>

          <div class="muted">
            Los retiros del dueño no se descuentan
            de la utilidad; son movimientos de efectivo.
          </div>
        </div>

      </div>


      <div class="two-col grid">

        <div class="list-item">

          <span>
            Ventas
          </span>

          <b>
            ${money(totalVentas)}
          </b>

        </div>


        <div class="list-item">

          <span>
            Abonos de apartados
          </span>

          <b>
            ${money(totalAbonos)}
          </b>

        </div>


        <div class="list-item">

          <span>
            Gastos
          </span>

          <b>
            - ${money(totalGastos)}
          </b>

        </div>


        <div class="list-item">

          <span>
            Retiros del dueño
          </span>

          <b>
            - ${money(retiros)}
          </b>

        </div>


        <div class="list-item">

          <span>
            Dinero devuelto al negocio
          </span>

          <b>
            ${money(devoluciones)}
          </b>

        </div>


        <div class="list-item">

          <span>
            Flujo neto registrado
          </span>

          <b>
            ${money(flujoDinero)}
          </b>

        </div>

      </div>

    </div>


    <!-- ========================================= -->
    <!-- REGISTRAR GASTO -->
    <!-- ========================================= -->

    <div class="two-col grid mt">

      <div class="card">

        <div class="section-head">

          <div>
            <h2>Registrar gasto</h2>

            <div class="muted">
              Registra los gastos del negocio.
            </div>
          </div>

        </div>


        <div class="form-grid">

          <div>

            <label>
              Concepto
            </label>

            <input
              id="reporteGastoConcepto"
              type="text"
              placeholder="Ej. Arriendo"
            >

          </div>


          <div>

            <label>
              Categoría
            </label>

            <input
              id="reporteGastoCategoria"
              type="text"
              placeholder="Ej. Servicios"
              value="Otros"
            >

          </div>


          <div>

            <label>
              Valor
            </label>

            <input
              id="reporteGastoValor"
              type="number"
              min="0"
              step="1"
              placeholder="0"
            >

          </div>


          <div>

            <label>
              Fecha
            </label>

            <input
              id="reporteGastoFecha"
              type="date"
              value="${hoy}"
            >

          </div>


          <div style="grid-column:1/-1">

            <label>
              Descripción
            </label>

            <textarea
              id="reporteGastoDescripcion"
              placeholder="Descripción opcional"
              rows="3"
            ></textarea>

          </div>


          <div>

            <button
              class="btn btn-primary"
              onclick="guardarGastoReporte()"
            >
              Registrar gasto
            </button>

          </div>

        </div>

      </div>


      <!-- ===================================== -->
      <!-- REGISTRAR RETIRO / DEVOLUCIÓN -->
      <!-- ===================================== -->

      <div class="card">

        <div class="section-head">

          <div>
            <h2>Dinero del negocio</h2>

            <div class="muted">
              Registra cuando sacas dinero y cuando
              lo devuelves al negocio.
            </div>
          </div>

        </div>


        <div class="form-grid">

          <div>

            <label>
              Movimiento
            </label>

            <select id="reporteMovimientoTipo">

              <option value="retiro">
                Retiro del negocio
              </option>

              <option value="devolucion">
                Dinero devuelto al negocio
              </option>

            </select>

          </div>


          <div>

            <label>
              Valor
            </label>

            <input
              id="reporteMovimientoValor"
              type="number"
              min="0"
              step="1"
              placeholder="0"
            >

          </div>


          <div>

            <label>
              Fecha
            </label>

            <input
              id="reporteMovimientoFecha"
              type="date"
              value="${hoy}"
            >

          </div>


          <div>

            <label>
              Concepto
            </label>

            <input
              id="reporteMovimientoConcepto"
              type="text"
              placeholder="Ej. Dinero tomado para uso personal"
            >

          </div>


          <div>

            <button
              class="btn btn-primary"
              onclick="guardarMovimientoDineroReporte()"
            >
              Registrar movimiento
            </button>

          </div>

        </div>

      </div>

    </div>


    <!-- ========================================= -->
    <!-- PRODUCTOS MÁS VENDIDOS / MÉTODOS -->
    <!-- ========================================= -->

    <div class="two-col grid mt">

      <div class="card">

        <div class="section-head">
          <h2>Productos más vendidos</h2>
        </div>

        ${
          topList.map(([id, n], idx) => {

            const p =
              getProduct(id);

            const max =
              topList[0]?.[1] || 1;

            return `

              <div class="list-item">

                <span>
                  ${idx + 1}.
                  ${p?.nombre || "Producto"}
                </span>

                <div st