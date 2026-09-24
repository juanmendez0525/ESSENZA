let apartadosSupabase = [];
let detallesApartadosSupabase = [];

function getClient(id){
  return DB.clientes.find(c => String(c.id) === String(id));
}
async function cargarApartadosSupabase() {
  const { data: apartados, error: errorApartados } =
    await supabaseClient
      .from("apartados")
      .select(`
        id,
        cliente_id,
        fecha,
        fecha_limite,
        total,
        total_abonado,
        saldo,
        estado,
        notas,
        usuario_id
      `)
      .order("fecha", { ascending: false });

  if (errorApartados) {
    console.error("Error cargando apartados:", errorApartados);
    toast("No se pudieron cargar los apartados");
    return false;
  }

  const ids = (apartados || []).map(a => a.id);

  let detalles = [];

  if (ids.length) {
    const { data, error } = await supabaseClient
      .from("detalle_apartados")
      .select(`
        id,
        apartado_id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal
      `)
      .in("apartado_id", ids);

    if (error) {
      console.error("Error cargando detalles:", error);
      toast("No se pudieron cargar los productos de los apartados");
      return false;
    }

    detalles = data || [];
  }

  apartadosSupabase = apartados || [];
  detallesApartadosSupabase = detalles;

  return true;
}
async function cargarClientesApartados() {
  const { data, error } = await supabaseClient
    .from("clientes")
    .select(`
      id,
      nombre,
      identificacion,
      telefono,
      direccion
    `);

  if (error) {
    console.error("Error cargando clientes:", error);
    return [];
  }

  return data || [];
}
async function verApartado(id) {
  const { data: apartado, error: errorApartado } =
    await supabaseClient
      .from("apartados")
      .select(`
        id,
        cliente_id,
        fecha,
        fecha_limite,
        total,
        total_abonado,
        saldo,
        estado,
        notas,
        usuario_id
      `)
      .eq("id", id)
      .single();

  if (errorApartado || !apartado) {
    console.error("Error cargando apartado:", errorApartado);
    toast("Apartado no encontrado");
    return;
  }

  const { data: detalles, error: errorDetalles } =
    await supabaseClient
      .from("detalle_apartados")
      .select(`
        id,
        apartado_id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal
      `)
      .eq("apartado_id", id);

  if (errorDetalles) {
    console.error("Error cargando productos del apartado:", errorDetalles);
    toast("No se pudieron cargar los productos del pedido");
    return;
  }

  const { data: cliente, error: errorCliente } =
    await supabaseClient
      .from("clientes")
      .select(`
        id,
        nombre,
        identificacion,
        telefono,
        email,
        direccion,
        notas
      `)
      .eq("id", apartado.cliente_id)
      .maybeSingle();

  if (errorCliente) {
    console.error("Error cargando cliente:", errorCliente);
  }

  const productoIds = (detalles || [])
    .map(item => item.producto_id)
    .filter(Boolean);

  let productos = [];

  if (productoIds.length) {
    const { data, error } = await supabaseClient
      .from("productos")
      .select(`
        id,
        nombre,
        marca,
        referencia
      `)
      .in("id", productoIds);

    if (error) {
      console.error("Error cargando productos:", error);
    } else {
      productos = data || [];
    }
  }

  const mapaProductos = Object.fromEntries(
    productos.map(producto => [
      producto.id,
      producto
    ])
  );

  const estadoValor =
    String(apartado.estado || "").toLowerCase();

  let estadoTexto = "Pendiente";
  let estadoClase = "warning";

  if (estadoValor === "pagado") {
    estadoTexto = "Pagado";
    estadoClase = "info";
  }

  if (estadoValor === "entregado") {
    estadoTexto = "Entregado";
    estadoClase = "success";
  }

  const productosHTML = (detalles || [])
    .map(item => {
      const producto =
        mapaProductos[item.producto_id];

      const nombre =
        producto?.nombre || "Producto";

      const marca =
        producto?.marca || "";

      const referencia =
        producto?.referencia || "";

      return `
        <div
          class="list-item"
          style="align-items:flex-start;gap:16px"
        >

          <div style="flex:1">

            <b>${nombre}</b>

            ${
              marca
                ? `<div class="small">${marca}</div>`
                : ""
            }

            ${
              referencia
                ? `<div class="small">
                    Ref: ${referencia}
                  </div>`
                : ""
            }

            <div class="small">
              Cantidad:
              ${Number(item.cantidad || 0)}
            </div>

            <div class="small">
              Precio unitario:
              ${money(item.precio_unitario)}
            </div>

          </div>

          <div style="text-align:right">
            <b>
              ${money(item.subtotal)}
            </b>
          </div>

        </div>
      `;
    })
    .join("");

  const esAdmin =
    window.perfilActual?.rol === "administrador";

  openModal(
    "Detalle del pedido",
    `
      <div class="card" style="box-shadow:none;background:var(--soft)">

        <div class="section-head">

          <div>

            <h3>
              Pedido #${String(apartado.id).slice(0, 8)}
            </h3>

            <div class="small">
              Creado:
              ${
                apartado.fecha
                  ? new Date(apartado.fecha).toLocaleString("es-CO")
                  : "—"
              }
            </div>

            ${
              apartado.fecha_limite
                ? `
                  <div class="small">
                    Fecha límite:
                    ${apartado.fecha_limite}
                  </div>
                `
                : ""
            }

          </div>

          <span class="badge ${estadoClase}">
            ${estadoTexto}
          </span>

        </div>

      </div>


      <div class="card mt" style="box-shadow:none">

        <div class="section-head">

          <div>

            <h3>Cliente</h3>

          </div>

        </div>

        <div>

          <b>
            ${cliente?.nombre || "Consumidor final"}
          </b>

          ${
            cliente?.identificacion
              ? `
                <div class="small mt">
                  Identificación:
                  ${cliente.identificacion}
                </div>
              `
              : ""
          }

          ${
            cliente?.telefono
              ? `
                <div class="small">
                  Teléfono:
                  ${cliente.telefono}
                </div>
              `
              : ""
          }

          ${
            cliente?.email
              ? `
                <div class="small">
                  Correo:
                  ${cliente.email}
                </div>
              `
              : ""
          }

          ${
            cliente?.direccion
              ? `
                <div class="small">
                  Dirección:
                  ${cliente.direccion}
                </div>
              `
              : ""
          }

        </div>

      </div>


      <div class="card mt" style="box-shadow:none">

        <div class="section-head">

          <div>

            <h3>Productos</h3>

            <p>
              Productos incluidos en este pedido.
            </p>

          </div>

        </div>

        <div class="list">

          ${
            productosHTML ||
            `
              <div class="empty">
                No hay productos registrados.
              </div>
            `
          }

        </div>

      </div>


      <div
        class="card mt"
        style="box-shadow:none;background:var(--soft)"
      >

        <div class="row space">

          <span>Total</span>

          <b>
            ${money(apartado.total)}
          </b>

        </div>

        <div class="row space mt">

          <span>Abonado</span>

          <b>
            ${money(apartado.total_abonado)}
          </b>

        </div>

        <div class="row space mt">

          <span>Saldo pendiente</span>

          <b>
            ${money(apartado.saldo)}
          </b>

        </div>

      </div>


      ${
        apartado.notas
          ? `
            <div class="card mt" style="box-shadow:none">

              <div class="section-head">
                <div>
                  <h3>Notas</h3>
                </div>
              </div>

              <div class="small">
                ${apartado.notas}
              </div>

            </div>
          `
          : ""
      }


      <div class="modal-actions">

        ${
          esAdmin &&
          estadoValor !== "entregado"
            ? `
              <button
                type="button"
                class="secondary-btn"
                onclick="editarApartadoProductos('${apartado.id}')"
              >
                ✏️ Editar productos
              </button>
            `
            : ""
        }

        <button
          type="button"
          class="primary-btn"
          onclick="closeModal()"
        >
          Cerrar
        </button>

      </div>
    `
  );
}
async function editarApartadoProductos(id) {
  // Solo administrador
  if (window.perfilActual?.rol !== "administrador") {
    toast("Solo un administrador puede editar los productos");
    return;
  }

  // ==========================================
  // CARGAR APARTADO
  // ==========================================

  const { data: apartado, error: errorApartado } =
    await supabaseClient
      .from("apartados")
      .select(`
        id,
        cliente_id,
        fecha,
        fecha_limite,
        total,
        total_abonado,
        saldo,
        estado
      `)
      .eq("id", id)
      .single();

  if (errorApartado || !apartado) {
    console.error("Error cargando apartado:", errorApartado);
    toast("No se pudo cargar el apartado");
    return;
  }

  if (String(apartado.estado || "").toLowerCase() === "entregado") {
    toast("No se puede editar un apartado entregado");
    return;
  }


  // ==========================================
  // CARGAR DETALLES
  // ==========================================

  const { data: detalles, error: errorDetalles } =
    await supabaseClient
      .from("detalle_apartados")
      .select(`
        id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal
      `)
      .eq("apartado_id", id);

  if (errorDetalles) {
    console.error("Error cargando detalles:", errorDetalles);
    toast("No se pudieron cargar los productos del apartado");
    return;
  }


  // ==========================================
  // CARGAR PRODUCTOS
  // ==========================================

  const { data: productos, error: errorProductos } =
    await supabaseClient
      .from("productos")
      .select(`
        id,
        nombre,
        marca,
        referencia,
        precioVenta,
        stock,
        activo
      `)
      .eq("activo", true)
      .order("nombre");

  if (errorProductos) {
    console.error("Error cargando productos:", errorProductos);
    toast("No se pudieron cargar los productos");
    return;
  }


  // ==========================================
  // ITEMS EDITABLES
  // ==========================================

  let items = (detalles || []).map(detalle => ({
    productoId: detalle.producto_id,
    cantidad: Number(detalle.cantidad),
    precio: Number(detalle.precio_unitario)
  }));


  // ==========================================
  // RENDER DEL MODAL
  // ==========================================

  const renderItems = () => {
    const contenedor = document.getElementById("editarApartadoItems");

    if (!contenedor) return;

    if (!items.length) {
      contenedor.innerHTML = `
        <div class="empty-state">
          No hay productos seleccionados.
        </div>
      `;
      return;
    }

    contenedor.innerHTML = items.map((item, index) => {
      const producto = productos.find(
        p => String(p.id) === String(item.productoId)
      );

      if (!producto) return "";

      return `
        <div
          class="card"
          style="
            box-shadow:none;
            margin-bottom:10px;
            padding:12px;
          "
        >
          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:12px;
            "
          >

            <div style="flex:1;">
              <strong>${producto.nombre}</strong>

              <div class="small">
                ${producto.marca || ""}
                ${producto.referencia ? " · " + producto.referencia : ""}
              </div>

              <div class="small">
                Precio: ${money(item.precio)}
              </div>
            </div>

            <div
              style="
                display:flex;
                align-items:center;
                gap:6px;
              "
            >
              <button
                type="button"
                class="secondary-btn"
                onclick="cambiarCantidadEditarApartado(${index}, -1)"
              >
                −
              </button>

              <strong
                style="
                  min-width:30px;
                  text-align:center;
                "
              >
                ${item.cantidad}
              </strong>

              <button
                type="button"
                class="secondary-btn"
                onclick="cambiarCantidadEditarApartado(${index}, 1)"
              >
                +
              </button>

              <button
                type="button"
                class="secondary-btn"
                onclick="eliminarProductoEditarApartado(${index})"
                style="margin-left:6px;"
              >
                Eliminar
              </button>
            </div>

          </div>
        </div>
      `;
    }).join("");
  };


  const totalActual = () =>
    items.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );


  openModal(
    "Editar productos del apartado",
    `
      <div>

        <div
          class="card"
          style="
            box-shadow:none;
            background:var(--soft);
            margin-bottom:16px;
          "
        >
          <div class="small">
            Total actual
          </div>

          <div class="kpi">
            ${money(apartado.total)}
          </div>

          <div
            class="small"
            style="margin-top:6px;"
          >
            Abonado: ${money(apartado.total_abonado)}
          </div>

          <div class="small">
            Saldo actual: ${money(apartado.saldo)}
          </div>
        </div>


        <div class="field">
          <label>
            Agregar producto
          </label>

          <select
            class="input"
            id="editarApartadoProducto"
          >
            <option value="">
              Selecciona un producto
            </option>

            ${productos.map(producto => `
              <option value="${producto.id}">
                ${producto.nombre}
                ${producto.marca ? " · " + producto.marca : ""}
                — ${money(producto.precioVenta)}
              </option>
            `).join("")}

          </select>
        </div>


        <div
          style="
            margin-top:10px;
            display:flex;
            justify-content:flex-end;
          "
        >
          <button
            type="button"
            class="secondary-btn"
            onclick="agregarProductoEditarApartado()"
          >
            + Agregar producto
          </button>
        </div>


        <div
          id="editarApartadoItems"
          style="margin-top:16px;"
        ></div>


        <div
          class="card"
          style="
            box-shadow:none;
            background:var(--soft);
            margin-top:16px;
          "
        >
          <div
            style="
              display:flex;
              justify-content:space-between;
            "
          >
            <strong>Nuevo total</strong>
            <strong id="editarApartadoTotal">
              ${money(totalActual())}
            </strong>
          </div>

          <div
            style="
              display:flex;
              justify-content:space-between;
              margin-top:8px;
            "
          >
            <span>Abonado</span>
            <span>${money(apartado.total_abonado)}</span>
          </div>

          <div
            style="
              display:flex;
              justify-content:space-between;
              margin-top:8px;
            "
          >
            <strong>Nuevo saldo</strong>
            <strong id="editarApartadoSaldo">
              ${money(
                totalActual() - Number(apartado.total_abonado || 0)
              )}
            </strong>
          </div>
        </div>


        <div class="modal-actions mt">

          <button
            type="button"
            class="secondary-btn"
            onclick="closeModal()"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="primary-btn"
            onclick="guardarEdicionApartado('${id}')"
          >
            Guardar cambios
          </button>

        </div>

      </div>
    `
  );


  // ==========================================
  // FUNCIONES DEL MODAL
  // ==========================================

  window._editarApartadoItems = items;
  window._editarApartadoProductos = productos;
  window._editarApartado = apartado;


  window.cambiarCantidadEditarApartado = function(index, delta) {

    const item = window._editarApartadoItems[index];

    if (!item) return;

    const nuevaCantidad =
      Number(item.cantidad) + Number(delta);

    if (nuevaCantidad <= 0) {
      window._editarApartadoItems.splice(index, 1);
    } else {
      item.cantidad = nuevaCantidad;
    }

    renderItems();

    actualizarResumenEditarApartado();
  };


  window.eliminarProductoEditarApartado = function(index) {

    window._editarApartadoItems.splice(index, 1);

    renderItems();

    actualizarResumenEditarApartado();
  };


  window.agregarProductoEditarApartado = function() {

    const select =
      document.getElementById("editarApartadoProducto");

    const productoId = select?.value;

    if (!productoId) {
      toast("Selecciona un producto");
      return;
    }

    const producto = productos.find(
      p => String(p.id) === String(productoId)
    );

    if (!producto) {
      toast("Producto no encontrado");
      return;
    }

    const existente =
      window._editarApartadoItems.find(
        item =>
          String(item.productoId) === String(producto.id)
      );

    if (existente) {
      existente.cantidad += 1;
    } else {
      window._editarApartadoItems.push({
        productoId: producto.id,
        cantidad: 1,
        precio: Number(producto.precioVenta || 0)
      });
    }

    select.value = "";

    renderItems();

    actualizarResumenEditarApartado();
  };


  window.actualizarResumenEditarApartado = function() {

    const total =
      window._editarApartadoItems.reduce(
        (sum, item) =>
          sum + Number(item.precio) * Number(item.cantidad),
        0
      );

    const abonado =
      Number(apartado.total_abonado || 0);

    const saldo =
      total - abonado;

    const totalElement =
      document.getElementById("editarApartadoTotal");

    const saldoElement =
      document.getElementById("editarApartadoSaldo");

    if (totalElement) {
      totalElement.textContent = money(total);
    }

    if (saldoElement) {
      saldoElement.textContent = money(saldo);
    }
  };


  renderItems();
}
async function guardarEdicionApartado(id) {

  if (window.perfilActual?.rol !== "administrador") {
    toast("Solo un administrador puede editar los productos");
    return;
  }

  const items = window._editarApartadoItems || [];

  if (!items.length) {
    toast("El apartado debe tener al menos un producto");
    return;
  }

  const payload = items.map(item => ({
    producto_id: item.productoId,
    cantidad: Number(item.cantidad),
    precio_unitario: Number(item.precio)
  }));

  const { error } = await supabaseClient.rpc(
    "editar_apartado_productos",
    {
      p_apartado_id: id,
      p_items: payload
    }
  );

  if (error) {
    console.error(
      "Error editando apartado:",
      error
    );

    toast(
      error.message ||
      "No se pudieron guardar los cambios"
    );

    return;
  }

  // Limpiar referencias temporales
  window._editarApartadoItems = null;
  window._editarApartadoProductos = null;
  window._editarApartado = null;

  closeModal();

  renderView("apartados");

  toast("Productos del apartado actualizados");
}
// ======================================================
// APARTADOS - SUPABASE
// ======================================================
// ======================================================
// APARTADOS - SUPABASE
// ======================================================

async function openApartadoModalDesdeVenta() {
  await crearApartadoDesdeVenta();
}


// ======================================================
// CREAR APARTADO DESDE LA VENTA
// ======================================================

async function crearApartadoDesdeVenta() {

  if (!cart || !cart.length) {
    toast("Agrega productos antes de crear el apartado");
    return;
  }

  const itemsIniciales = cart.map(item => ({
    productoId: item.productoId,
    cantidad: Number(item.cantidad),
    precio: Number(item.precio)
  }));

  /*
   * Abrimos el formulario indicando que viene
   * desde la ventana de ventas.
   *
   * En este caso el consumidor final se seleccionará
   * automáticamente si no se busca otro cliente.
   */
  await abrirModalNuevoApartadoSupabase(
    itemsIniciales,
    true
  );
}


// ======================================================
// NUEVO APARTADO DESDE APARTADOS
// ======================================================

async function openApartadoModal() {

  await abrirModalNuevoApartadoSupabase(
    [],
    false
  );
}


// ======================================================
// FORMULARIO NUEVO APARTADO
// ======================================================

async function abrirModalNuevoApartadoSupabase(
  itemsIniciales = [],
  desdeVenta = false
) {

  let items = [...itemsIniciales];

  /*
   * Cliente seleccionado.
   *
   * IMPORTANTE:
   * Si el usuario no busca ningún cliente,
   * posteriormente utilizaremos Consumidor final.
   */
  let clienteSeleccionado = null;


  // ----------------------------------------------------
  // CARGAR CLIENTES
  // ----------------------------------------------------

  const {
    data: clientes,
    error: errorClientes
  } = await supabaseClient
    .from("clientes")
    .select(`
      id,
      nombre,
      identificacion,
      telefono,
      direccion,
      activo
    `)
    .eq("activo", true)
    .order("nombre");

  if (errorClientes) {

    console.error(
      "Error cargando clientes:",
      errorClientes
    );

    toast("No se pudieron cargar los clientes");

    return;
  }


  /*
   * BUSCAR CONSUMIDOR FINAL
   *
   * Primero buscamos por identificación.
   * Si no existe, también intentamos encontrarlo
   * por nombre.
   */

  const consumidorFinal =
    (clientes || []).find(cliente => {

      const identificacion =
        String(cliente.identificacion || "")
          .trim()
          .toUpperCase();

      const nombre =
        String(cliente.nombre || "")
          .trim()
          .toLowerCase();

      return (
        identificacion === "CONSUMIDOR_FINAL" ||
        nombre === "consumidor final"
      );

    });


  /*
   * Si venimos desde una venta,
   * Consumidor final queda seleccionado
   * automáticamente.
   */

  if (desdeVenta && consumidorFinal) {

    clienteSeleccionado =
      consumidorFinal;

  }


  // ----------------------------------------------------
  // CARGAR PRODUCTOS
  // ----------------------------------------------------

  const {
    data: productos,
    error: errorProductos
  } = await supabaseClient
    .from("productos")
    .select(`
      id,
      nombre,
      marca,
      referencia,
      precioVenta,
      stock,
      activo
    `)
    .eq("activo", true)
    .order("nombre");

  if (errorProductos) {

    console.error(
      "Error cargando productos:",
      errorProductos
    );

    toast("No se pudieron cargar los productos");

    return;
  }


  // ----------------------------------------------------
  // FECHA LÍMITE
  // ----------------------------------------------------

  const fechaDefault = new Date();

  fechaDefault.setDate(
    fechaDefault.getDate() + 7
  );

  const fechaLimiteDefault =
    fechaDefault
      .toISOString()
      .slice(0, 10);


  // ----------------------------------------------------
  // HTML
  // ----------------------------------------------------

  openModal(
    "Nuevo apartado",
    `
      <form id="apartadoForm">

        <!-- CLIENTE -->

        <div
          class="card"
          style="box-shadow:none;background:var(--soft)"
        >

          <div class="section-head">

            <h3>Cliente</h3>

            <button
              type="button"
              class="secondary-btn"
              id="btnConsumidorApartado"
            >
              Usar consumidor final
            </button>

          </div>


          <div class="form-grid">

            <div class="field">

              <label>
                Número de identificación
              </label>

              <div
                style="
                  display:flex;
                  gap:8px;
                  align-items:flex-start;
                "
              >

                <input
                  class="input"
                  type="text"
                  id="apIdentificacion"
                  placeholder="Número de identificación"
                  autocomplete="off"
                  style="flex:1;"
                >

                <button
                  type="button"
                  class="secondary-btn"
                  id="btnBuscarClienteApartado"
                >
                  🔍 Buscar
                </button>

              </div>

            </div>


            <div class="field">

              <label>
                Cliente seleccionado
              </label>

              <input
                class="input"
                id="apNombreCliente"
                value="${
                  clienteSeleccionado?.nombre ||
                  "Consumidor final"
                }"
                readonly
              >

            </div>

          </div>


          <div
            id="apDatosCliente"
            class="small"
            style="margin-top:10px;"
          >
            ${
              clienteSeleccionado
                ? `
                  <b>Consumidor final seleccionado</b>
                  <div class="small">
                    Puedes buscar otro cliente si lo deseas.
                  </div>
                `
                : `
                  Busca un cliente registrado o usa
                  consumidor final.
                `
            }
          </div>

        </div>


        <!-- PRODUCTOS -->

        <div class="card mt">

          <div class="section-head">

            <div>

              <h3>
                Productos
              </h3>

              <div class="small">
                Agrega los productos que quedarán apartados.
              </div>

            </div>

          </div>


          <div
            class="form-grid"
            style="align-items:end;"
          >

            <div class="field">

              <label>
                Producto
              </label>

              <select
                class="input"
                id="apProducto"
              >

                <option value="">
                  Selecciona un producto
                </option>

                ${
                  (productos || [])
                    .filter(
                      p =>
                        Number(p.stock || 0) > 0
                    )
                    .map(
                      p => `
                        <option value="${p.id}">
                          ${p.nombre}
                          ${
                            p.marca
                              ? ` - ${p.marca}`
                              : ""
                          }
                          · Stock: ${p.stock}
                          · ${money(p.precioVenta)}
                        </option>
                      `
                    )
                    .join("")
                }

              </select>

            </div>


            <div class="field">

              <label>
                Cantidad
              </label>

              <input
                class="input"
                id="apCantidad"
                type="number"
                min="1"
                value="1"
              >

            </div>


            <div class="field">

              <button
                type="button"
                class="secondary-btn"
                onclick="addApartadoItem()"
              >
                + Agregar
              </button>

            </div>

          </div>


          <div
            id="apItems"
            style="margin-top:16px;"
          ></div>

        </div>


        <!-- DATOS DEL APARTADO -->

        <div class="card mt">

          <div class="form-grid">

            <div class="field">

              <label>
                Fecha límite
              </label>

              <input
                class="input"
                type="date"
                id="apFechaLimite"
                value="${fechaLimiteDefault}"
                required
              >

            </div>


            <div class="field">

              <label>
                Abono inicial
              </label>

              <input
                class="input"
                type="number"
                id="apAbono"
                min="0"
                step="0.01"
                value="0"
              >

            </div>

          </div>


          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              margin-top:16px;
              padding-top:16px;
              border-top:1px solid #eee;
            "
          >

            <strong>
              Total
            </strong>

            <strong id="apTotal">
              ${money(0)}
            </strong>

          </div>


          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              margin-top:8px;
            "
          >

            <span>
              Saldo inicial
            </span>

            <strong id="apSaldo">
              ${money(0)}
            </strong>

          </div>

        </div>


        <!-- BOTONES -->

        <div class="modal-actions mt">

          <button
            type="button"
            class="secondary-btn"
            onclick="closeModal()"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="primary-btn"
          >
            Crear apartado
          </button>

        </div>

      </form>
    `
  );


  // ====================================================
  // CONSUMIDOR FINAL
  // ====================================================

  document
    .getElementById("btnConsumidorApartado")
    .onclick = function() {

      if (!consumidorFinal) {

        toast(
          "No se encontró el cliente Consumidor final en Supabase"
        );

        return;
      }

      clienteSeleccionado =
        consumidorFinal;


      document
        .getElementById("apIdentificacion")
        .value =
          consumidorFinal.identificacion || "";


      document
        .getElementById("apNombreCliente")
        .value =
          consumidorFinal.nombre ||
          "Consumidor final";


      document
        .getElementById("apDatosCliente")
        .innerHTML = `
          <b>Cliente seleccionado</b>

          <div class="small">
            Consumidor final
          </div>
        `;

    };


  // ====================================================
  // BUSCAR CLIENTE
  // ====================================================

  document
    .getElementById("btnBuscarClienteApartado")
    .onclick = function() {

      const identificacion =
        document
          .getElementById("apIdentificacion")
          .value
          .trim();


      /*
       * Si dejan vacío el campo,
       * NO obligamos a buscar.
       *
       * Se vuelve automáticamente a
       * Consumidor final.
       */

      if (!identificacion) {

        if (!consumidorFinal) {

          toast(
            "No se encontró el cliente Consumidor final"
          );

          return;
        }

        clienteSeleccionado =
          consumidorFinal;


        document
          .getElementById("apNombreCliente")
          .value =
            consumidorFinal.nombre ||
            "Consumidor final";


        document
          .getElementById("apDatosCliente")
          .innerHTML = `
            <b>Consumidor final</b>

            <div class="small">
              No se seleccionó un cliente específico.
            </div>
          `;

        return;
      }


      const cliente =
        (clientes || []).find(
          c =>
            String(c.identificacion || "")
              .trim()
              .toLowerCase()
            ===
            identificacion.toLowerCase()
        );


      if (!cliente) {

        /*
         * Si la búsqueda falla,
         * regresamos a Consumidor final.
         */

        clienteSeleccionado =
          consumidorFinal || null;


        document
          .getElementById("apNombreCliente")
          .value =
            consumidorFinal?.nombre ||
            "Consumidor final";


        document
          .getElementById("apDatosCliente")
          .innerHTML = `
            <span style="color:#b45309">
              ⚠️ No encontramos ese cliente.
              Se utilizará Consumidor final.
            </span>
          `;

        toast(
          "Cliente no encontrado. Se utilizará Consumidor final."
        );

        return;
      }


      /*
       * Cliente encontrado correctamente.
       */

      clienteSeleccionado =
        cliente;


      document
        .getElementById("apNombreCliente")
        .value =
          cliente.nombre || "";


      document
        .getElementById("apDatosCliente")
        .innerHTML = `
          <div>
            <b>Cliente encontrado</b>
          </div>

          <div class="small">
            Teléfono:
            ${cliente.telefono || "No registrado"}
          </div>

          <div class="small">
            Dirección:
            ${cliente.direccion || "No registrada"}
          </div>
        `;

      toast("Cliente encontrado");

    };


  // ====================================================
  // PRODUCTOS
  // ====================================================

  window._apItems = items;


  window.addApartadoItem = function() {

    const productoId =
      document
        .getElementById("apProducto")
        .value;


    const cantidad =
      Number(
        document
          .getElementById("apCantidad")
          .value
      );


    if (!productoId) {

      toast(
        "Selecciona un producto"
      );

      return;
    }


    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {

      toast(
        "Ingresa una cantidad válida"
      );

      return;
    }


    const producto =
      (productos || []).find(
        p =>
          String(p.id) ===
          String(productoId)
      );


    if (!producto) {

      toast(
        "Producto no encontrado"
      );

      return;
    }


    const existente =
      items.find(
        i =>
          String(i.productoId) ===
          String(producto.id)
      );


    const cantidadActual =
      existente
        ? Number(existente.cantidad)
        : 0;


    if (
      cantidadActual + cantidad >
      Number(producto.stock || 0)
    ) {

      toast(
        `Stock insuficiente para ${producto.nombre}`
      );

      return;
    }


    if (existente) {

      existente.cantidad =
        cantidadActual + cantidad;

    } else {

      items.push({

        productoId:
          producto.id,

        cantidad:
          cantidad,

        precio:
          Number(
            producto.precioVenta || 0
          )

      });

    }


    renderApartadoItems();


    document
      .getElementById("apCantidad")
      .value = 1;

  };


  // ====================================================
  // RENDER PRODUCTOS
  // ====================================================

  function renderApartadoItems() {

    const contenedor =
      document.getElementById("apItems");


    if (!items.length) {

      contenedor.innerHTML = `
        <div class="empty-state">
          No hay productos agregados.
        </div>
      `;

      actualizarTotales();

      return;
    }


    contenedor.innerHTML =
      items
        .map(
          (item, index) => {

            const producto =
              (productos || []).find(
                p =>
                  String(p.id) ===
                  String(item.productoId)
              );


            const nombre =
              producto?.nombre ||
              "Producto";


            const subtotal =
              Number(item.precio) *
              Number(item.cantidad);


            return `
              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  gap:10px;
                  padding:10px 0;
                  border-bottom:1px solid #eee;
                "
              >

                <div style="flex:1;">

                  <strong>
                    ${nombre}
                  </strong>

                  <div class="small">
                    ${money(item.precio)}
                    ×
                    ${item.cantidad}
                  </div>

                </div>


                <strong>
                  ${money(subtotal)}
                </strong>


                <div
                  style="
                    display:flex;
                    gap:6px;
                  "
                >

                  <button
                    type="button"
                    class="secondary-btn"
                    onclick="
                      cambiarCantidadNuevoApartado(
                        ${index},
                        -1
                      )
                    "
                  >
                    −
                  </button>


                  <button
                    type="button"
                    class="secondary-btn"
                    onclick="
                      cambiarCantidadNuevoApartado(
                        ${index},
                        1
                      )
                    "
                  >
                    +
                  </button>


                  <button
                    type="button"
                    class="secondary-btn"
                    onclick="
                      eliminarProductoNuevoApartado(
                        ${index}
                      )
                    "
                  >
                    🗑
                  </button>

                </div>

              </div>
            `;

          }
        )
        .join("");


    actualizarTotales();

  }


  // ====================================================
  // CAMBIAR CANTIDAD
  // ====================================================

  window.cambiarCantidadNuevoApartado =
    function(index, delta) {

      const item =
        items[index];

      if (!item) return;


      const producto =
        (productos || []).find(
          p =>
            String(p.id) ===
            String(item.productoId)
        );


      const nuevaCantidad =
        Number(item.cantidad) +
        Number(delta);


      if (nuevaCantidad <= 0) {

        items.splice(
          index,
          1
        );

        renderApartadoItems();

        return;
      }


      if (
        nuevaCantidad >
        Number(producto?.stock || 0)
      ) {

        toast(
          "No hay suficiente stock"
        );

        return;
      }


      item.cantidad =
        nuevaCantidad;


      renderApartadoItems();

    };


  // ====================================================
  // ELIMINAR PRODUCTO
  // ====================================================

  window.eliminarProductoNuevoApartado =
    function(index) {

      items.splice(
        index,
        1
      );

      renderApartadoItems();

    };


  // ====================================================
  // TOTALES
  // ====================================================

  function actualizarTotales() {

    const total =
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.precio) *
          Number(item.cantidad),
        0
      );


    const campoAbono =
      document.getElementById(
        "apAbono"
      );


    let abono =
      Number(
        campoAbono?.value || 0
      );


    if (abono < 0) {
      abono = 0;
    }


    if (abono > total) {

      abono = total;

      if (campoAbono) {
        campoAbono.value =
          abono;
      }

    }


    const saldo =
      total - abono;


    document
      .getElementById("apTotal")
      .textContent =
        money(total);


    document
      .getElementById("apSaldo")
      .textContent =
        money(saldo);

  }


  document
    .getElementById("apAbono")
    .addEventListener(
      "input",
      actualizarTotales
    );


  // ====================================================
  // GUARDAR APARTADO
  // ====================================================

  document
    .getElementById("apartadoForm")
    .onsubmit = async function(event) {

      event.preventDefault();


      /*
       * SI NO SE SELECCIONÓ CLIENTE,
       * USAMOS CONSUMIDOR FINAL.
       */

      if (!clienteSeleccionado) {

        clienteSeleccionado =
          consumidorFinal;

      }


      /*
       * Como la columna cliente_id
       * de apartados es obligatoria,
       * debe existir Consumidor final
       * en la tabla clientes.
       */

      if (!clienteSeleccionado) {

        toast(
          "No se encontró el cliente Consumidor final. Créalo en Clientes antes de continuar."
        );

        return;
      }


      if (!items.length) {

        toast(
          "Agrega al menos un producto"
        );

        return;
      }


      const fechaLimite =
        document
          .getElementById("apFechaLimite")
          .value;


      if (!fechaLimite) {

        toast(
          "Selecciona una fecha límite"
        );

        return;
      }


      const total =
        items.reduce(
          (sum, item) =>
            sum +
            Number(item.precio) *
            Number(item.cantidad),
          0
        );


      const abono =
        Math.min(
          total,
          Math.max(
            0,
            Number(
              document
                .getElementById("apAbono")
                .value
            ) || 0
          )
        );


      const payload =
        items.map(item => ({
          producto_id:
            item.productoId,

          cantidad:
            Number(item.cantidad),

          precio_unitario:
            Number(item.precio)
        }));


      const confirmar =
        confirm(
          "¿Deseas crear este apartado?\n\n" +
          "Cliente: " +
          (
            clienteSeleccionado.nombre ||
            "Consumidor final"
          ) +
          "\n" +
          "Total: " +
          money(total) +
          "\n" +
          "Abono: " +
          money(abono) +
          "\n" +
          "Saldo: " +
          money(total - abono)
        );


      if (!confirmar) {
        return;
      }


      /*
       * CREAR EN SUPABASE
       */

      const {
        data,
        error
      } =
        await supabaseClient.rpc(
          "crear_apartado",
          {
            p_cliente_id:
              clienteSeleccionado.id,

            p_fecha_limite:
              fechaLimite,

            p_abono:
              abono,

            p_items:
              payload
          }
        );


      if (error) {

        console.error(
          "Error creando apartado:",
          error
        );

        toast(
          error.message ||
          "No se pudo crear el apartado"
        );

        return;
      }


      console.log(
        "Apartado creado:",
        data
      );


      /*
       * SI VIENE DESDE VENTA,
       * VACÍAMOS EL CARRITO.
       */

      if (
        desdeVenta &&
        typeof cart !== "undefined" &&
        Array.isArray(cart)
      ) {

        cart = [];

      }


      closeModal();


      await renderView(
        "apartados"
      );


      toast(
        "Apartado creado correctamente"
      );

    };


  // ====================================================
  // PRIMER RENDER
  // ====================================================

  renderApartadoItems();

  actualizarTotales();

}
async function registerAbono(id) {
  if (!id) {
    toast("Apartado no válido");
    return;
  }

  const { data: apartado, error } = await supabaseClient
    .from("apartados")
    .select(`
      id,
      total,
      total_abonado,
      saldo,
      estado
    `)
    .eq("id", id)
    .single();

  if (error || !apartado) {
    console.error("Error cargando apartado para abono:", error);
    toast("No se pudo cargar el apartado");
    return;
  }

  const saldo = Number(apartado.saldo || 0);

  if (saldo <= 0) {
    toast("Este apartado ya está pagado");
    return;
  }

  openModal(
    "Registrar abono",
    `
      <form id="abonoForm">
        <div class="form-grid">
          <div class="field">
            <label>Saldo pendiente</label>
            <input
              type="text"
              value="${money(saldo)}"
              readonly
            >
          </div>

          <div class="field">
            <label>Valor del abono</label>
            <input
              type="number"
              name="valor"
              min="0.01"
              max="${saldo}"
              step="0.01"
              required
              autofocus
            >
          </div>
        </div>

        <div class="modal-actions mt">
          <button
            type="button"
            class="secondary-btn"
            onclick="closeModal()"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="primary-btn"
          >
            Registrar abono
          </button>
        </div>
      </form>
    `
  );

  document.getElementById("abonoForm").onsubmit = async event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const valor = Number(formData.get("valor") || 0);

    if (!Number.isFinite(valor) || valor <= 0) {
      toast("Ingresa un valor válido");
      return;
    }

    if (valor > saldo) {
      toast("El abono no puede superar el saldo pendiente");
      return;
    }

    const { error: errorAbono } = await supabaseClient.rpc(
      "registrar_abono_apartado",
      {
        p_apartado_id: id,
        p_abono: valor
      }
    );

    if (errorAbono) {
      console.error("Error registrando abono:", errorAbono);
      toast(errorAbono.message || "No se pudo registrar el abono");
      return;
    }

    closeModal();
    await renderView("apartados");
    toast("Abono registrado correctamente");
  };
}
async function deliverApartado(id) {
  if (!id) {
    toast("Apartado no válido");
    return;
  }

  const { data: apartado, error: errorApartado } = await supabaseClient
    .from("apartados")
    .select(`
      id,
      saldo,
      estado
    `)
    .eq("id", id)
    .single();

  if (errorApartado || !apartado) {
    console.error("Error cargando apartado:", errorApartado);
    toast("Apartado no encontrado");
    return;
  }

  const saldo = Number(apartado.saldo || 0);

  if (saldo > 0) {
    toast("El pedido aún tiene saldo pendiente");
    return;
  }

  if (String(apartado.estado || "").toLowerCase() === "entregado") {
    toast("Este apartado ya fue entregado");
    return;
  }

  const confirmar = confirm(
    "¿Confirmas que este apartado fue entregado al cliente?"
  );

  if (!confirmar) {
    return;
  }

  const { error } = await supabaseClient.rpc(
    "entregar_apartado",
    {
      p_apartado_id: id
    }
  );

  if (error) {
    console.error("Error entregando apartado:", error);
    toast(error.message || "No se pudo entregar el apartado");
    return;
  }

  await renderView("apartados");
  toast("Apartado entregado correctamente");
}
async function renderApartados() {
  const cargado = await cargarApartadosSupabase();

  if (!cargado) {
    return `
      <div class="empty-state">
        No fue posible cargar los apartados.
      </div>
    `;
  }

  const clientes = await cargarClientesApartados();

  const mapaClientes = Object.fromEntries(
    clientes.map(cliente => [
      cliente.id,
      cliente
    ])
  );

  const esAdmin =
    window.perfilActual?.rol === "administrador";

  const apartados = apartadosSupabase;

  const getEstadoVisual = estado => {
    const valor = String(estado || "").toLowerCase();

    if (valor === "entregado") {
      return {
        texto: "Entregado",
        clase: "success"
      };
    }

    if (
      valor === "pagado" ||
      valor === "completado"
    ) {
      return {
        texto: "Pagado",
        clase: "info"
      };
    }

    return {
      texto: "Pendiente",
      clase: "warning"
    };
  };

  const pendientes = apartados.filter(a => {
    const estado = String(a.estado || "").toLowerCase();
    return estado === "activo" || estado === "pendiente";
  });

  const pagados = apartados.filter(a => {
    const estado = String(a.estado || "").toLowerCase();
    return estado === "pagado";
  });

  const entregados = apartados.filter(a => {
    const estado = String(a.estado || "").toLowerCase();
    return estado === "entregado";
  });

  const saldoPendiente = apartados
    .filter(a => {
      const estado = String(a.estado || "").toLowerCase();
      return estado !== "entregado";
    })
    .reduce(
      (s, a) => s + Number(a.saldo || 0),
      0
    );

  return `
    <div class="hero">
      <div class="section-head">
        <div>
          <h2>Pedidos apartados</h2>
          <p>
            Controla abonos, saldos, productos y entregas.
          </p>
        </div>
      </div>
    </div>

    <div class="stats-grid grid">

      <div class="card stat-card">
        <div class="stat-label">
          Pendiente
        </div>

        <div class="stat-value">
          ${pendientes.length}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">
          Pagado
        </div>

        <div class="stat-value">
          ${pagados.length}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">
          Entregado
        </div>

        <div class="stat-value">
          ${entregados.length}
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">
          Saldo pendiente
        </div>

        <div class="stat-value">
          ${money(saldoPendiente)}
        </div>
      </div>

    </div>

    <div class="card mt">

      <div class="table-wrap">

        <table>

          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha límite</th>
              <th>Total</th>
              <th>Abonado</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            ${
              apartados.length
                ? apartados
                    .map(a => {

                      const cliente =
                        mapaClientes[a.cliente_id];

                      const estado =
                        getEstadoVisual(a.estado);

                      const detalles =
                        detallesApartadosSupabase.filter(
                          d => d.apartado_id === a.id
                        );

                      return `
                        <tr>

                          <td>
                            <b>#${String(a.id).slice(0, 8)}</b>
                          </td>

                          <td>
                            ${
                              cliente?.nombre ||
                              "Consumidor final"
                            }
                          </td>

                          <td>
                            ${a.fecha_limite || "—"}
                          </td>

                          <td>
                            ${money(a.total)}
                          </td>

                          <td>
                            ${money(a.total_abonado)}
                          </td>

                          <td>
                            ${money(a.saldo)}
                          </td>

                          <td>
                            <span class="badge ${estado.clase}">
                              ${estado.texto}
                            </span>
                          </td>

                          <td>

                            <div
                              class="row"
                              style="gap:6px;flex-wrap:wrap"
                            >

                              <button
                                class="secondary-btn"
                                onclick="verApartado('${a.id}')"
                              >
                                Ver pedido
                              </button>

                              ${
                                esAdmin &&
                                estado.texto !== "Entregado"
                                  ? `
                                    <button
                                      class="secondary-btn"
                                      onclick="editarApartadoProductos('${a.id}')"
                                    >
                                      ✏️ Editar
                                    </button>
                                  `
                                  : ""
                              }

                              ${
                                estado.texto === "Pendiente"
                                  ? `
                                    <button
                                      class="secondary-btn"
                                      onclick="registerAbono('${a.id}')"
                                    >
                                      Abono
                                    </button>
                                  `
                                  : ""
                              }

                              ${
                                estado.texto === "Pagado"
                                  ? `
                                    <button
                                      class="primary-btn"
                                      onclick="deliverApartado('${a.id}')"
                                    >
                                      Entregar
                                    </button>
                                  `
                                  : ""
                              }

                            </div>

                          </td>

                        </tr>
                      `;
                    })
                    .join("")
                : `
                  <tr>
                    <td
                      colspan="8"
                      class="empty"
                    >
                      No hay apartados registrados.
                    </td>
                  </tr>
                `
            }

          </tbody>

        </table>

      </div>

    </div>
  `;
}