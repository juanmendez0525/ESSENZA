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
async function renderReportes() {
  // Cargar información financiera desde Supabase
  const [abonos, gastos, movimientosDinero] = await Promise.all([
    cargarAbonosDesdeSupabase(),
    cargarGastosDesdeSupabase(),
    cargarMovimientosDineroDesdeSupabase()
  ]);

  // =========================
  // VENTAS
  // =========================
  const ventas = DB.ventas || [];

  const totalVentas = ventas.reduce(
    (s, v) => s + Number(v.total || 0),
    0
  );

  const costos = ventas.reduce(
    (s, v) =>
      s +
      (v.items || []).reduce(
        (a, i) =>
          a +
          (Number(getProduct(i.productoId)?.precioCompra || 0) *
            Number(i.cantidad || 0)),
        0
      ),
    0
  );

  const ganancia = totalVentas - costos;

  // =========================
  // VENTAS POR MÉTODO
  // =========================
  const methods = {};

  ventas.forEach(v => {
    const metodo = v.metodo || "Sin especificar";
    methods[metodo] =
      (methods[metodo] || 0) + Number(v.total || 0);
  });

  // =========================
  // PRODUCTOS MÁS VENDIDOS
  // =========================
  const top = {};

  ventas.forEach(v => {
    (v.items || []).forEach(i => {
      top[i.productoId] =
        (top[i.productoId] || 0) + Number(i.cantidad || 0);
    });
  });

  const topList = Object.entries(top)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // =========================
  // ABONOS DE APARTADOS
  // =========================
  const totalAbonos = abonos.reduce(
    (s, a) => s + Number(a.monto || 0),
    0
  );

  // =========================
  // GASTOS
  // =========================
  const totalGastos = gastos.reduce(
    (s, g) => s + Number(g.valor || 0),
    0
  );

  // =========================
  // MOVIMIENTOS DE DINERO
  // =========================
  let retiros = 0;
  let devoluciones = 0;

  movimientosDinero.forEach(m => {
    const tipo = String(m.tipo || "").toLowerCase();
    const valor = Number(m.valor || 0);

    if (
      tipo.includes("retiro") ||
      tipo.includes("salida") ||
      tipo.includes("sacar")
    ) {
      retiros += valor;
    }

    if (
      tipo.includes("devol") ||
      tipo.includes("ingreso") ||
      tipo.includes("entrada") ||
      tipo.includes("retorno")
    ) {
      devoluciones += valor;
    }
  });

  // =========================
  // INVENTARIO
  // =========================
  const inventarioValorizado = (DB.productos || []).reduce(
    (s, p) =>
      s +
      Number(p.stock || 0) *
        Number(p.precioCompra || 0),
    0
  );

  // =========================
  // UTILIDAD DESPUÉS DE GASTOS
  // =========================
  const utilidadDespuesGastos =
    ganancia - totalGastos;

  return `
    <div class="stats-grid grid">

      <div class="card stat-card">
        <div class="stat-label">Ventas registradas</div>
        <div class="stat-value">${money(totalVentas)}</div>
        <div class="stat-extra">${ventas.length} ventas</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Costo de mercancía</div>
        <div class="stat-value">${money(costos)}</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Ganancia bruta</div>
        <div class="stat-value text-success">
          ${money(ganancia)}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Gastos</div>
        <div class="stat-value">
          ${money(totalGastos)}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Utilidad después de gastos</div>
        <div class="stat-value text-success">
          ${money(utilidadDespuesGastos)}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Abonos de apartados</div>
        <div class="stat-value">
          ${money(totalAbonos)}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Retiros del negocio</div>
        <div class="stat-value">
          ${money(retiros)}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Devoluciones al negocio</div>
        <div class="stat-value">
          ${money(devoluciones)}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Inventario valorizado</div>
        <div class="stat-value">
          ${money(inventarioValorizado)}
        </div>
      </div>

    </div>

    <div class="two-col grid mt">

      <div class="card">
        <div class="section-head">
          <h2>Productos más vendidos</h2>
        </div>

        ${
          topList.map(([id, n], idx) => {
            const p = getProduct(id);
            const max = topList[0]?.[1] || 1;

            return `
              <div class="list-item">
                <span>
                  ${idx + 1}. ${p?.nombre || "Producto"}
                </span>

                <div style="min-width:130px">
                  <b>${n} uds.</b>

                  <div class="bar mt">
                    <i style="width:${(n / max) * 100}%"></i>
                  </div>
                </div>
              </div>
            `;
          }).join("") ||
          '<div class="empty">Aún no hay ventas.</div>'
        }
      </div>

      <div class="card">
        <div class="section-head">
          <h2>Ventas por método</h2>
        </div>

        ${
          Object.entries(methods)
            .map(
              ([m, v]) => `
                <div class="list-item">
                  <span>${m}</span>
                  <b>${money(v)}</b>
                </div>
              `
            )
            .join("") ||
          '<div class="empty">Sin datos.</div>'
        }
      </div>

    </div>

    <div class="two-col grid mt">

      <div class="card">
        <div class="section-head">
          <h2>Resumen financiero</h2>
        </div>

        <div class="list-item">
          <span>Ventas</span>
          <b>${money(totalVentas)}</b>
        </div>

        <div class="list-item">
          <span>Costo de mercancía</span>
          <b>${money(costos)}</b>
        </div>

        <div class="list-item">
          <span>Ganancia bruta</span>
          <b>${money(ganancia)}</b>
        </div>

        <div class="list-item">
          <span>Gastos</span>
          <b>${money(totalGastos)}</b>
        </div>

        <div class="list-item">
          <span>Utilidad después de gastos</span>
          <b>${money(utilidadDespuesGastos)}</b>
        </div>
      </div>

      <div class="card">
        <div class="section-head">
          <h2>Movimiento de dinero</h2>
        </div>

        <div class="list-item">
          <span>Abonos de apartados</span>
          <b>${money(totalAbonos)}</b>
        </div>

        <div class="list-item">
          <span>Retiros</span>
          <b>${money(retiros)}</b>
        </div>

        <div class="list-item">
          <span>Devoluciones</span>
          <b>${money(devoluciones)}</b>
        </div>

        <div class="list-item">
          <span>Balance de retiros</span>
          <b>${money(devoluciones - retiros)}</b>
        </div>
      </div>

    </div>
  `;
}