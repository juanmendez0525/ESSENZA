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
function editarApartadoProductos(id) {
  if (window.perfilActual?.rol !== "administrador") {
    toast("Solo un administrador puede editar los productos");
    return;
  }

  const a = DB.apartados.find(x => x.id === id);

  if (!a) {
    toast("Apartado no encontrado");
    return;
  }

  if (a.estado === "Entregado") {
    toast("No puedes editar un pedido ya entregado");
    return;
  }

  let items = (a.items || []).map(item => ({
    productoId: item.productoId,
    cantidad: Number(item.cantidad),
    precio: Number(item.precio)
  }));

  function renderEditor() {
    const html = items.map((item, index) => {
      const producto = getProduct(item.productoId);

      if (!producto) return "";

      return `
        <div
          class="list-item"
          style="align-items:center;gap:12px"
        >

          <div style="flex:1">
            <b>${producto.nombre}</b>

            <div class="small">
              ${producto.marca || ""}
              · ${money(item.precio)}
            </div>
          </div>

          <input
            class="input"
            type="number"
            min="1"
            value="${item.cantidad}"
            style="width:90px"
            onchange="window._editarApartadoItems[${index}].cantidad = Number(this.value)"
          >

          <button
            type="button"
            class="secondary-btn"
            onclick="window._editarApartadoItems.splice(${index},1); editarApartadoProductos(${id})"
          >
            Quitar
          </button>

        </div>
      `;
    }).join("");

    openModal(
      "Editar productos del apartado",
      `
        <div class="small">
          Modifica las cantidades o elimina productos del pedido.
        </div>

        <div class="list mt">
          ${
            html ||
            `<div class="empty">
              No hay productos en este apartado.
            </div>`
          }
        </div>

        <div class="card mt" style="box-shadow:none;background:var(--soft)">
          <div class="row space">
            <span>Total actualizado</span>
            <b>
              ${money(
                items.reduce(
                  (s, item) =>
                    s + Number(item.precio) * Number(item.cantidad),
                  0
                )
              )}
            </b>
          </div>
        </div>

        <div class="modal-actions">

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
            onclick="guardarEdicionApartado(${id})"
          >
            Guardar cambios
          </button>

        </div>
      `
    );
  }

  window._editarApartadoItems = items;

  renderEditor();
}
function guardarEdicionApartado(id) {
  if (window.perfilActual?.rol !== "administrador") {
    toast("Solo un administrador puede editar");
    return;
  }

  const a = DB.apartados.find(x => x.id === id);

  if (!a) {
    toast("Apartado no encontrado");
    return;
  }

  const nuevosItems = window._editarApartadoItems || [];

  if (!nuevosItems.length) {
    toast("El apartado debe tener al menos un producto");
    return;
  }

  for (const item of nuevosItems) {
    const producto = getProduct(item.productoId);

    if (!producto) {
      toast("Uno de los productos ya no existe");
      return;
    }

    if (item.cantidad < 1) {
      toast("Las cantidades deben ser mayores a 0");
      return;
    }
  }

  /*
   * Primero devolvemos al inventario las cantidades
   * que tenía originalmente el apartado.
   */
  (a.items || []).forEach(item => {
    const producto = getProduct(item.productoId);

    if (producto) {
      producto.stock =
        Number(producto.stock || 0) +
        Number(item.cantidad || 0);
    }
  });

  /*
   * Después reservamos nuevamente las cantidades
   * del apartado ya editado.
   */
  for (const item of nuevosItems) {
    const producto = getProduct(item.productoId);

    if (Number(producto.stock || 0) < Number(item.cantidad)) {
      toast(
        `No hay suficiente stock de ${producto.nombre}`
      );

      /*
       * Revertir al estado anterior.
       */
      (a.items || []).forEach(original => {
        const p = getProduct(original.productoId);

        if (p) {
          p.stock =
            Number(p.stock || 0) -
            Number(original.cantidad || 0);
        }
      });

      return;
    }

    producto.stock =
      Number(producto.stock || 0) -
      Number(item.cantidad);
  }

  a.items = nuevosItems.map(item => ({
    productoId: item.productoId,
    cantidad: Number(item.cantidad),
    precio: Number(item.precio)
  }));

  a.total = nuevosItems.reduce(
    (s, item) =>
      s +
      Number(item.precio || 0) *
      Number(item.cantidad || 0),
    0
  );

  /*
   * Si el total cambió y el abonado ahora supera
   * el total, lo limitamos al nuevo total.
   */
  a.abonado = Math.min(
    Number(a.abonado || 0),
    Number(a.total || 0)
  );

  a.estado =
    a.abonado >= a.total
      ? "Pagado"
      : "Pendiente";

  saveData();

  window._editarApartadoItems = null;

  closeModal();
  renderView("apartados");

  toast("Apartado actualizado correctamente");
}
function crearApartadoDesdeVenta() {

  if (!cart || !cart.length) {
    toast("Agrega productos antes de crear el apartado");
    return;
  }

  /*
   * Guardamos una copia del carrito actual.
   * No modificamos el carrito original.
   */
  const itemsVenta = cart.map(item => ({
    productoId: item.productoId,
    cantidad: Number(item.cantidad),
    precio: Number(item.precio)
  }));

  /*
   * Cerramos Finalizar venta y abrimos
   * el formulario de apartado.
   */
  closeModal();

  openApartadoModalDesdeVenta(itemsVenta);
}
function openApartadoModalDesdeVenta(itemsIniciales) {

  let items = itemsIniciales.map(item => ({
    productoId: item.productoId,
    cantidad: Number(item.cantidad),
    precio: Number(item.precio)
  }));

  let clienteSeleccionado = null;

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

            <div>
              <h3>Cliente</h3>
            </div>

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

              <div class="row">

                <input
                  class="input"
                  type="text"
                  id="apIdentificacion"
                  placeholder="Ej: 1090123456"
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
                Cliente encontrado
              </label>

              <input
                class="input"
                id="apNombreCliente"
                value="Consumidor final"
                readonly
              >

            </div>

          </div>

          <div
            id="apDatosCliente"
            class="small mt"
          >
            Busca un cliente registrado por su número de identificación.
          </div>

        </div>


        <!-- FECHA LÍMITE -->

        <div class="form-grid mt">

          <div class="field">

            <label>
              Fecha límite
            </label>

            <input
              class="input"
              type="date"
              name="fechaLimite"
              value="${new Date(
                Date.now() + 7 * 86400000
              ).toISOString().slice(0,10)}"
            >

          </div>

        </div>


        <!-- PRODUCTOS -->

        <div class="card mt">

          <div class="section-head">

            <div>
              <h3>Productos del apartado</h3>
              <p>
                Estos son los productos que estaban en el carrito.
              </p>
            </div>

          </div>

          <div
            id="apItems"
            class="list"
          ></div>

        </div>


        <!-- TOTAL Y ABONO -->

        <div
          class="card mt"
          style="box-shadow:none;background:var(--soft)"
        >

          <div class="row space">

            <span>
              Total
            </span>

            <b id="apTotal">
              ${money(0)}
            </b>

          </div>

          <div class="row space mt">

            <span>
              Abono inicial
            </span>

            <input
              id="apAbono"
              class="input"
              style="max-width:150px"
              type="number"
              min="0"
              value="0"
            >

          </div>

        </div>


        <!-- BOTONES -->

        <div class="modal-actions">

          <button
            type="button"
            class="secondary-btn"
            onclick="closeModal();finalizeSale()"
          >
            Volver a la venta
          </button>

          <button
            class="primary-btn"
          >
            Guardar apartado
          </button>

        </div>

      </form>
    `
  );

  const inputIdentificacion =
    document.getElementById("apIdentificacion");

  const inputNombre =
    document.getElementById("apNombreCliente");

  const datosCliente =
    document.getElementById("apDatosCliente");


  /*
   * CLIENTE
   */

  document
    .getElementById("btnBuscarClienteApartado")
    .onclick = function() {

      const identificacion =
        inputIdentificacion.value
          .trim()
          .toLowerCase();

      if (!identificacion) {
        toast("Escribe el número de identificación.");
        return;
      }

      const cliente =
        DB.clientes.find(
          c =>
            String(c.identificacion || "")
              .trim()
              .toLowerCase() === identificacion
        );

      if (!cliente) {

        clienteSeleccionado = null;

        inputNombre.value =
          "Consumidor final";

        datosCliente.innerHTML = `
          <span style="color:#b45309">
            ⚠️ No encontramos un cliente con esa identificación.
          </span>
        `;

        toast("Cliente no encontrado.");

        return;
      }

      clienteSeleccionado = cliente;

      inputNombre.value =
        cliente.nombre || "";

      datosCliente.innerHTML = `
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

      toast("Cliente encontrado.");
    };


  /*
   * CONSUMIDOR FINAL
   */

  document
    .getElementById("btnConsumidorApartado")
    .onclick = function() {

      clienteSeleccionado = null;

      inputIdentificacion.value = "";

      inputNombre.value =
        "Consumidor final";

      datosCliente.innerHTML = `
        Busca un cliente registrado por su número de identificación.
      `;

    };


  /*
   * MOSTRAR PRODUCTOS
   */

  function renderItems() {

    document.getElementById("apItems").innerHTML =
      items.map(item => {

        const p =
          getProduct(item.productoId);

        if (!p) return "";

        return `
          <div class="list-item">

            <div>
              <b>${p.nombre}</b>

              <div class="small">
                ${item.cantidad} × ${money(item.precio)}
              </div>
            </div>

            <b>
              ${money(
                item.precio * item.cantidad
              )}
            </b>

          </div>
        `;

      }).join("");

    document.getElementById("apTotal").textContent =
      money(
        items.reduce(
          (s, i) =>
            s +
            Number(i.precio) *
            Number(i.cantidad),
          0
        )
      );
  }


  renderItems();


  /*
   * GUARDAR APARTADO
   */

  document.getElementById("apartadoForm").onsubmit =
    e => {

      e.preventDefault();

      if (!items.length) {
        toast("No hay productos para apartar");
        return;
      }

      const fd =
        new FormData(e.target);

      const total =
        items.reduce(
          (s, i) =>
            s +
            Number(i.precio) *
            Number(i.cantidad),
          0
        );

      const abono =
        Math.min(
          total,
          Number(
            document.getElementById("apAbono").value
          ) || 0
        );


      /*
       * DESCONTAR INVENTARIO
       */

      for (const item of items) {

        const producto =
          getProduct(item.productoId);

        if (!producto) {
          toast("No se encontró uno de los productos.");
          return;
        }

        const nuevoStock =
          Number(producto.stock || 0) -
          Number(item.cantidad || 0);

        if (nuevoStock < 0) {
          toast(
            `No hay suficiente stock para ${producto.nombre}.`
          );

          return;
        }

        producto.stock = nuevoStock;
      }


      /*
       * CREAR APARTADO
       */

      DB.apartados.unshift({

        id: Date.now(),

        clienteId:
          clienteSeleccionado?.id || null,

        identificacionCliente:
          clienteSeleccionado?.identificacion || "",

        fecha:
          new Date()
            .toISOString()
            .slice(0, 10),

        fechaLimite:
          fd.get("fechaLimite"),

        items: [...items],

        total: total,

        abonado: abono,

        estado:
          abono >= total
            ? "Pagado"
            : "Pendiente"

      });


      saveData();

      /*
       * Vaciar carrito porque los productos
       * ahora pertenecen al apartado.
       */
      cart = [];

      closeModal();

      renderView("apartados");

      toast("Apartado creado correctamente");
    };
}


function openApartadoModal(){

  let items = [];
  let clienteSeleccionado = null;

  openModal(
    "Nuevo apartado",

    `<form id="apartadoForm">

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

            <div class="row">

              <input
                class="input"
                type="text"
                id="apIdentificacion"
                placeholder="Ej: 1090123456"
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
              Cliente encontrado
            </label>

            <input
              class="input"
              id="apNombreCliente"
              value="Consumidor final"
              readonly
            >

          </div>

        </div>


        <div
          id="apDatosCliente"
          class="small mt"
        >
          Busca un cliente registrado por su número de identificación.
        </div>

      </div>


      <!-- FECHA LÍMITE -->

      <div class="form-grid mt">

        <div class="field">

          <label>
            Fecha límite
          </label>

          <input
            class="input"
            type="date"
            name="fechaLimite"
            value="${new Date(
              Date.now() + 7 * 86400000
            ).toISOString().slice(0,10)}"
          >

        </div>

      </div>


      <!-- PRODUCTOS -->

      <div class="field mt">

        <label>
          Producto
        </label>

        <select
          id="apProduct"
          class="select"
        >

          ${DB.productos
            .filter(p => p.stock > 0)
            .map(p =>
              `<option value="${p.id}">
                ${p.nombre} · ${money(p.precioVenta)} · stock ${p.stock}
              </option>`
            )
            .join("")}

        </select>

      </div>


      <div class="row mt">

        <input
          id="apQty"
          class="input"
          type="number"
          min="1"
          value="1"
        >

        <button
          type="button"
          class="primary-btn"
          onclick="addApartadoItem()"
        >
          Agregar producto
        </button>

      </div>


      <div
        id="apItems"
        class="list mt"
      ></div>


      <!-- TOTAL Y ABONO -->

      <div
        class="card mt"
        style="box-shadow:none;background:var(--soft)"
      >

        <div class="row space">

          <span>
            Total
          </span>

          <b id="apTotal">
            ${money(0)}
          </b>

        </div>


        <div class="row space mt">

          <span>
            Abono inicial
          </span>

          <input
            id="apAbono"
            class="input"
            style="max-width:150px"
            type="number"
            min="0"
            value="0"
          >

        </div>

      </div>


      <!-- BOTONES -->

      <div class="modal-actions">

        <button
          type="button"
          class="secondary-btn"
          onclick="closeModal()"
        >
          Cancelar
        </button>

        <button
          class="primary-btn"
        >
          Guardar apartado
        </button>

      </div>

    </form>`
  );


  // ==========================================
  // ELEMENTOS
  // ==========================================

  const inputIdentificacion =
    document.getElementById(
      "apIdentificacion"
    );

  const inputNombre =
    document.getElementById(
      "apNombreCliente"
    );

  const datosCliente =
    document.getElementById(
      "apDatosCliente"
    );


  // ==========================================
  // BUSCAR CLIENTE
  // ==========================================

  document
    .getElementById(
      "btnBuscarClienteApartado"
    )
    .onclick = function(){

      const identificacion =
        inputIdentificacion.value
          .trim()
          .toLowerCase();


      if(!identificacion){

        toast(
          "Escribe el número de identificación."
        );

        inputIdentificacion.focus();

        return;
      }


      const cliente =
        DB.clientes.find(
          c =>
            String(
              c.identificacion || ""
            )
            .trim()
            .toLowerCase()
            === identificacion
        );


      if(!cliente){

        clienteSeleccionado = null;

        inputNombre.value =
          "Consumidor final";

        datosCliente.innerHTML =
          `
          <span style="color:#b45309">
            ⚠️ No encontramos un cliente con esa identificación.
          </span>
          `;

        toast(
          "Cliente no encontrado."
        );

        return;
      }


      clienteSeleccionado =
        cliente;


      inputNombre.value =
        cliente.nombre || "";


      datosCliente.innerHTML =
        `
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

      toast(
        "Cliente encontrado."
      );

    };


  // ==========================================
  // CONSUMIDOR FINAL
  // ==========================================

  document
    .getElementById(
      "btnConsumidorApartado"
    )
    .onclick = function(){

      clienteSeleccionado = null;

      inputIdentificacion.value = "";

      inputNombre.value =
        "Consumidor final";

      datosCliente.innerHTML =
        `
        Busca un cliente registrado por su número de identificación.
        `;

      inputIdentificacion.focus();

    };


  // ==========================================
  // AGREGAR PRODUCTO
  // ==========================================

  window._apItems = items;


  window.addApartadoItem = () => {

    const id =
      Number(
        document.getElementById(
          "apProduct"
        ).value
      );


    const qty =
      Number(
        document.getElementById(
          "apQty"
        ).value
      );


    const p =
      getProduct(id);


    if(
      !p ||
      qty < 1 ||
      qty > p.stock
    ){

      toast(
        "Cantidad no disponible"
      );

      return;
    }


    const old =
      items.find(
        i =>
          i.productoId === id
      );


    if(old){

      old.cantidad =
        Math.min(
          p.stock,
          old.cantidad + qty
        );

    }else{

      items.push({
        productoId: id,
        cantidad: qty,
        precio: p.precioVenta
      });

    }


    renderApItems();

  };


  // ==========================================
  // MOSTRAR PRODUCTOS
  // ==========================================

  function renderApItems(){

    document.getElementById(
      "apItems"
    ).innerHTML =

      items
        .map(i => {

          const p =
            getProduct(
              i.productoId
            );

          return `
            <div class="list-item">

              <span>
                ${p.nombre}
                × ${i.cantidad}
              </span>

              <b>
                ${money(
                  i.precio * i.cantidad
                )}
              </b>

            </div>
          `;

        })
        .join("")

      ||

      '<div class="empty">No has agregado productos.</div>';


    document.getElementById(
      "apTotal"
    ).textContent =

      money(
        items.reduce(
          (s,i) =>
            s + i.precio * i.cantidad,
          0
        )
      );

  }


  // ==========================================
  // GUARDAR APARTADO
  // ==========================================

  document.getElementById(
    "apartadoForm"
  ).onsubmit = e => {

    e.preventDefault();


    if(!items.length){

      toast(
        "Agrega al menos un producto"
      );

      return;
    }


    const fd =
      new FormData(e.target);


    const total =
      items.reduce(
        (s,i) =>
          s + i.precio * i.cantidad,
        0
      );


    const abono =
      Math.min(
        total,
        Number(
          document.getElementById(
            "apAbono"
          ).value
        ) || 0
      );


    // ========================================
    // DESCONTAR INVENTARIO
    // ========================================

    items.forEach(i => {

      const producto =
        getProduct(
          i.productoId
        );


      if(producto){

        producto.stock -=
          i.cantidad;

      }

    });
 //

    // ========================================
    // CREAR APARTADO
    // ========================================

    DB.apartados.unshift({

      id:
        Date.now(),

      clienteId:
        clienteSeleccionado?.id || null,

      identificacionCliente:
        clienteSeleccionado?.identificacion || "",

      fecha:
        new Date()
          .toISOString()
          .slice(0,10),

      fechaLimite:
        fd.get("fechaLimite"),

      items:
        [...items],

      total:
        total,

      abonado:
        abono,

      estado:
        abono >= total
          ? "Pagado"
          : "Pendiente"

    });


    saveData();

    closeModal();

    renderView(
      "apartados"
    );

    toast(
      "Apartado creado"
    );

  };

}
function registerAbono(id){
  const a=DB.apartados.find(x=>x.id===id),saldo=a.total-a.abonado;
  openModal("Registrar abono",`<div class="card" style="box-shadow:none;background:var(--soft)"><div class="small">Saldo pendiente</div><div class="kpi">${money(saldo)}</div></div><form id="abonoForm" class="mt"><div class="field"><label>Valor del abono</label><input class="input" name="valor" type="number" min="1" max="${saldo}" value="${saldo}"></div><div class="modal-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancelar</button><button class="primary-btn">Registrar abono</button></div></form>`);
  document.getElementById("abonoForm").onsubmit=e=>{e.preventDefault();a.abonado=Math.min(a.total,a.abonado+Number(new FormData(e.target).get("valor")));if(a.abonado>=a.total)a.estado="Pagado";saveData();closeModal();renderView("apartados");toast("Abono registrado")};
}
function deliverApartado(id) {
  const a = DB.apartados.find(x => x.id === id);

  if (!a) {
    toast("Apartado no encontrado");
    return;
  }

  if (a.abonado < a.total) {
    toast("El pedido aún tiene saldo pendiente");
    return;
  }

  const confirmar = confirm(
    `¿Confirmas que deseas entregar el pedido #${a.id}?\n\n` +
    `Esta acción marcará el apartado como entregado.`
  );

  if (!confirmar) return;

  a.estado = "Entregado";

  saveData();
  renderView("apartados");

  toast("Pedido entregado correctamente");
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