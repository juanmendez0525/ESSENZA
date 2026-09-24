let ventasHistorial = [];
let perfilesHistorial = [];

function renderHistorial() {

  setTimeout(() => {
    cargarHistorialVentas();
  }, 0);

  return `
    <section class="card">

      <div class="section-head">

        <div>
          <h3>Historial de ventas</h3>
          <p>Consulta las ventas registradas en el sistema.</p>
        </div>

      </div>


      <div class="historial-search">
        <input
          type="text"
          id="buscarVentas"
          placeholder="🔎 Buscar por comprobante o cliente..."
          autocomplete="off"
        >
      </div>


      <div id="historialVentas">

        <div class="empty-state">
          Cargando ventas...
        </div>

      </div>

    </section>
  `;
}

function renderTablaHistorial(ventas, mapaUsuarios = {}) {
  const contenedor = document.getElementById("historialVentas");

  if (!contenedor) return;

  if (!ventas.length) {
    contenedor.innerHTML = `
      <div class="empty-state">
        No se encontraron ventas.
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Comprobante</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Método de pago</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          ${ventas.map(venta => {
            const fecha = new Date(venta.fecha);

            const fechaTexto = fecha.toLocaleDateString("es-CO");
            const cliente = obtenerClienteVenta(venta.notas);
            const vendedor = mapaUsuarios[venta.usuario_id] || "—";

            return `
              <tr>
                <td>
                  <strong>${venta.id}</strong>
                </td>

                <td>
                  ${fechaTexto}
                </td>

                <td>
                  ${cliente}
                </td>

                <td>
                  ${vendedor}
                </td>

                <td>
                  ${venta.metodo_pago || "—"}
                </td>

                <td>
                  <strong>
                    $${Number(venta.total || 0).toLocaleString("es-CO")}
                  </strong>
                </td>

                <td>
                  ${venta.estado || "—"}
                </td>

                <td>
                  <button
                    class="secondary-btn"
                    onclick="verDetalleVenta('${venta.id}')"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function cargarHistorialVentas() {
  
  const contenedor = document.getElementById("historialVentas");

  if (!contenedor) return;

  if (window.perfilActual?.rol !== "administrador") {
    contenedor.innerHTML = `
      <div class="empty-state">
        No tienes permiso para consultar el historial de ventas.
      </div>
    `;
    return;
  }

  const { data: ventas, error } = await supabaseClient
    .from("ventas")
    .select(`
      id,
      fecha,
      subtotal,
      descuento,
      total,
      metodo_pago,
      estado,
      notas,
      usuario_id,
      descripcion_descuento,
      created_at
    `)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error cargando historial:", error);

    contenedor.innerHTML = `
      <div class="empty-state">
        No se pudo cargar el historial de ventas.
      </div>
    `;

    return;
  }

  ventasHistorial = ventas || [];

  if (!ventas || ventas.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-state">
        No hay ventas registradas todavía.
      </div>
    `;

    return;
  }

  const usuarioIds = [
  ...new Set(
    ventas
      .map(v => v.usuario_id)
      .filter(Boolean)
  )
];

let perfiles = [];

if (usuarioIds.length > 0) {

  const {
    data: perfilesData,
    error: errorPerfiles
  } = await supabaseClient
    .from("perfiles")
    .select("id, nombre")
    .in("id", usuarioIds);

  if (!errorPerfiles) {
    perfiles = perfilesData || [];
  }
}

ventasHistorial = ventas || [];
perfilesHistorial = perfiles;
  const mapaUsuarios = Object.fromEntries(
    perfiles.map(p => [p.id, p.nombre])
  );

  renderTablaHistorial(
    ventasHistorial,
    mapaUsuarios
  );
  document.addEventListener(
    "input",
    function(event) {

      if (
        event.target.id ===
        "buscarVentas"
      ) {

        buscarVentasHistorial();

      }

    }
  );
}

function buscarVentasHistorial() {
  const input = document.getElementById("buscarVentas");
  if (!input) return;

  const texto = input.value.trim().toLowerCase();

  const mapaUsuarios = Object.fromEntries(
    perfilesHistorial.map(p => [p.id, p.nombre])
  );

  const ventasFiltradas = ventasHistorial.filter(venta => {
    const cliente = obtenerClienteVenta(venta.notas).toLowerCase();
    const comprobante = String(venta.id || "").toLowerCase();

    return (
      comprobante.includes(texto) ||
      cliente.includes(texto)
    );
  });

  renderTablaHistorial(ventasFiltradas, mapaUsuarios);
}

function formatearFechaVenta(fecha) {
  if (!fecha) return "-";

  return new Date(fecha).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  });
}


function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}


function obtenerClienteVenta(notas) {
  if (!notas) return "Consumidor final";

  if (notas.startsWith("Cliente:")) {
    return notas.replace("Cliente:", "").trim();
  }

  return notas;
}


async function verDetalleVenta(ventaId) {

  const { data: venta, error: errorVenta } =
    await supabaseClient
      .from("ventas")
      .select(`
        id,
        fecha,
        subtotal,
        descuento,
        total,
        metodo_pago,
        estado,
        notas,
        descripcion_descuento
      `)
      .eq("id", ventaId)
      .single();

  if (errorVenta || !venta) {

    console.error(
      "Error obteniendo venta:",
      errorVenta
    );

    toast(
      "No se pudo cargar el detalle de la venta"
    );

    return;
  }


  const {
    data: detalles,
    error: errorDetalles
  } = await supabaseClient
    .from("venta_detalles")
    .select(`
      producto_nombre,
      producto_marca,
      cantidad,
      precio_unitario,
      subtotal,
      created_at
    `)
    .eq("venta_id", ventaId)
    .order("created_at", {
      ascending: true
    });


  if (errorDetalles) {

    console.error(
      "Error obteniendo detalles:",
      errorDetalles
    );

    toast(
      "No se pudo cargar el detalle de los productos"
    );

    return;
  }


  // ==========================================
  // FECHA Y HORA
  // ==========================================

  const fechaVenta = new Date(
    venta.fecha
  );

  const fecha =
    fechaVenta.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );

  const hora =
    fechaVenta.toLocaleTimeString(
      "es-CO",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }
    );


  // ==========================================
  // CLIENTE
  // ==========================================

  const cliente =
    obtenerClienteVenta(
      venta.notas
    );


  // ==========================================
  // PRODUCTOS
  // ==========================================

  const filasProductos =
    (detalles || [])
      .map(
        (item, index) => `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${item.producto_nombre}
              ${
                item.producto_marca
                  ? `<br>
                     <small>
                       ${item.producto_marca}
                     </small>`
                  : ""
              }
            </td>

            <td>
              ${item.cantidad}
            </td>

            <td>
              ${formatearDinero(
                item.precio_unitario
              )}
            </td>

            <td>
              ${formatearDinero(
                item.subtotal
              )}
            </td>

          </tr>
        `
      )
      .join("");


  // ==========================================
  // FILA DESCUENTO
  // ==========================================

  const filaDescuento =
    Number(venta.descuento || 0) > 0
      ? `
        <tr>

          <td></td>

          <td>
            <strong>
              Descuento
            </strong>

            ${
              venta.descripcion_descuento
                ? `
                  <br>
                  <small>
                    ${venta.descripcion_descuento}
                  </small>
                `
                : ""
            }
          </td>

          <td></td>

          <td></td>

          <td>
            -${formatearDinero(
              venta.descuento
            )}
          </td>

        </tr>
      `
      : "";


  // ==========================================
  // MOSTRAR COMPROBANTE
  // ==========================================

  openModal(
    "¡Detalle de venta! 🎉",

    `

    <div class="receipt-wrapper">

      <div
        id="receipt"
        class="invoice-card"
      >


        <!-- ============================= -->
        <!-- ENCABEZADO -->
        <!-- ============================= -->

        <div class="invoice-header">

          <div>

            <div class="brand-title">
              ESSENZA
            </div>

            <div class="brand-subtitle">
              -MAKEUP-
            </div>

          </div>


          <div class="logo-container">

            <img
              src="recursos/logo.png"
              alt="Logo ESSENZA MAKEUP"
              class="logo-img"
            >

          </div>

        </div>


        <!-- ============================= -->
        <!-- INFORMACIÓN -->
        <!-- ============================= -->

        <div class="info-section">


          <div class="client-info">

            <h3>
              INF. CLIENTE:
            </h3>

            <p>
              Nombre:
              ${cliente}
            </p>

            <p>
              Contacto:
              —
            </p>

            <p>
              Dirección:
              —
            </p>

          </div>


          <div class="receipt-info">

            <p>
              Comprobante:
              ${venta.id}
            </p>

            <p>
              Fecha:
              ${fecha}
            </p>

            <p>
              Hora:
              ${hora}
            </p>

          </div>

        </div>


        <!-- ============================= -->
        <!-- PRODUCTOS -->
        <!-- ============================= -->

        <table class="invoice-table">

          <thead>

            <tr>

              <th style="width:15%;">
                Item
              </th>

              <th style="width:35%;">
                Descripción
              </th>

              <th style="width:15%;">
                Unidad
              </th>

              <th style="width:17%;">
                Precio unitario
              </th>

              <th style="width:18%;">
                Total
              </th>

            </tr>

          </thead>


          <tbody>

            ${filasProductos}

            ${filaDescuento}


            <tr class="empty-row">

              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>

            </tr>

          </tbody>

        </table>


        <!-- ============================= -->
        <!-- PARTE INFERIOR -->
        <!-- ============================= -->

        <div class="footer-section">


          <div class="observaciones">

            <h4>
              Observaciones
            </h4>

            <p>
              ${venta.metodo_pago || "—"}
            </p>

            <div class="check-icon">
              ✓
            </div>

          </div>


          <div class="totals">


            <div class="subtotal">

              Sub Total:

              ${formatearDinero(
                venta.subtotal
              )}

            </div>


            ${
              Number(venta.descuento || 0) > 0
                ? `
                  <div class="subtotal">

                    Descuento:

                    -${formatearDinero(
                      venta.descuento
                    )}

                  </div>
                `
                : ""
            }


            <div class="total-border">

              Total:

              ${formatearDinero(
                venta.total
              )}

            </div>

          </div>

        </div>


        <!-- ============================= -->
        <!-- AGRADECIMIENTO -->
        <!-- ============================= -->

        <div class="thank-you">
          Thank You
        </div>


      </div>


      <!-- ============================= -->
      <!-- BOTONES -->
      <!-- ============================= -->

      <div class="modal-actions">


        <button
          class="secondary-btn"
          onclick="imprimirVentaHistorial()"
        >
          🖨 Imprimir
        </button>


        <button
          class="primary-btn"
          onclick="closeModal()"
        >
          Cerrar
        </button>


      </div>


    </div>

    `
  );
}