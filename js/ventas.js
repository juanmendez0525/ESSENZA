let cart=[];
function addToCart(id){
  const p=getProduct(id);
  if(!p||p.stock<=0){toast("Producto sin stock");return}
  const item=cart.find(x=>x.productoId===p.id);
  if(item){if(item.cantidad<p.stock)item.cantidad++;else toast("No hay más unidades");}
  else cart.push({productoId:p.id,cantidad:1,precio:p.precioVenta});
  renderView("ventas");
}
function changeCart(id,delta){
  const item=cart.find(x=>x.productoId===id); if(!item)return;
  const p=getProduct(id); item.cantidad+=delta;
  if(item.cantidad<=0)cart=cart.filter(x=>x.productoId!==id);
  if(item.cantidad>p.stock)item.cantidad=p.stock;
  renderView("ventas");
}
function removeFromCart(id){
  cart = cart.filter(i => i.productoId !== id);
  renderView("ventas");
}
function cartTotal(){return cart.reduce((s,i)=>s+i.precio*i.cantidad,0)}
function finalizeSale(){

  if(!cart.length){
    toast("Agrega productos a la venta");
    return;
  }

  openModal(
    "Finalizar venta",

    `
    <form id="saleForm">

      <div class="form-grid">

        <!-- CLIENTE -->
        <div class="field full">

          <label>
            Buscar cliente por número de identificación
          </label>

          <input
            class="input"
            id="clienteIdentificacion"
            name="identificacion"
            placeholder="Escribe el número de identificación..."
            autocomplete="off"
          >

          <div
            id="clienteResultado"
            class="small"
            style="margin-top:8px;"
          >
            Consumidor final
          </div>

          <input
            type="hidden"
            id="clienteId"
            name="clienteId"
            value=""
          >

        </div>


        <!-- MÉTODO DE PAGO -->
        <div class="field">

          <label>
            Método de pago
          </label>

          <select
            class="select"
            name="metodo"
          >
            <option>Efectivo</option>
            <option>Nequi</option>
            <option>Daviplata</option>
            <option>Transferencia</option>
            <option>Tarjeta</option>
          </select>

        </div>


        <!-- DESCUENTO -->
        <div class="field">

          <label>
            Descuento
          </label>

          <input
            class="input"
            type="number"
            name="descuento"
            value="0"
            min="0"
            step="0.01"
          >

        </div>


        <!-- DESCRIPCIÓN DEL DESCUENTO -->
        <div class="field full">

          <label id="labelDescripcionDescuento">
            Descripción del descuento
          </label>

          <input
            class="input"
            type="text"
            name="descripcionDescuento"
            placeholder="Ej: Descuento por promoción, cliente frecuente..."
          >

        </div>

      </div>


      <!-- RESUMEN DE LA VENTA -->
<div
  class="card mt"
  style="box-shadow:none;background:var(--soft)"
>

  <div class="row space">
    <span>Subtotal</span>
    <b id="saleSubtotal">
      ${money(cartTotal())}
    </b>
  </div>

  <div
    class="row space"
    style="margin-top:10px;"
  >
    <span>Descuento</span>
    <b id="saleDiscount">
      ${money(0)}
    </b>
  </div>

  <div
    class="row space"
    style="
      margin-top:14px;
      padding-top:12px;
      border-top:1px solid rgba(0,0,0,.12);
    "
  >
    <span
      class="kpi"
      style="font-size:18px"
    >
      TOTAL
    </span>

    <b
      id="saleTotal"
      class="kpi"
      style="font-size:22px"
    >
      ${money(cartTotal())}
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
          class="primary-btn"
        >
          Confirmar venta
        </button>

      </div>

    </form>
    `
  );


  // =========================
  // BUSCAR CLIENTE
  // =========================

  const inputCliente =
    document.getElementById("clienteIdentificacion");

  const resultadoCliente =
    document.getElementById("clienteResultado");

  const clienteId =
    document.getElementById("clienteId");

  const inputDescuento =
  document.querySelector(
    '#saleForm input[name="descuento"]'
  );

const saleDiscount =
  document.getElementById("saleDiscount");

const saleTotal =
  document.getElementById("saleTotal");

const subtotalVenta =
  cartTotal();


function actualizarTotales(){

  const descuento =
    Number(inputDescuento.value || 0);

  const descuentoValido =
    Math.max(
      0,
      Math.min(
        descuento,
        subtotalVenta
      )
    );

  const total =
    subtotalVenta -
    descuentoValido;


  saleDiscount.textContent =
    money(descuentoValido);

  saleTotal.textContent =
    money(total);

}


inputDescuento.addEventListener(
  "input",
  actualizarTotales
);

actualizarTotales();

const campoDescripcion =
  document.querySelector(
    '#saleForm input[name="descripcionDescuento"]'
  );

const labelDescripcion =
  document.getElementById(
    "labelDescripcionDescuento"
  );


function actualizarObligatoriedadDescuento(){

  const descuento =
    Number(inputDescuento.value || 0);

  if(descuento > 0){

    campoDescripcion.required = true;

    labelDescripcion.innerHTML =
      "Descripción del descuento <span style=\"color:#b91c1c\">*</span>";

  }else{

    campoDescripcion.required = false;

    labelDescripcion.textContent =
      "Descripción del descuento";

  }

}


inputDescuento.addEventListener(
  "input",
  actualizarObligatoriedadDescuento
);

actualizarObligatoriedadDescuento();
  
  inputCliente.addEventListener(
    "input",
    function(){

      const identificacion =
        this.value.trim();

      clienteId.value = "";


      if(!identificacion){

        resultadoCliente.innerHTML =
          "Consumidor final";

        return;
      }


      const cliente =
        DB.clientes.find(
          c =>
            String(c.identificacion || "")
              .trim() === identificacion
        );


      if(cliente){

        clienteId.value = cliente.id;

        resultadoCliente.innerHTML =
          `
          <div
            class="badge success"
            style="display:inline-block;margin-top:4px;"
          >
            ✓ Cliente encontrado:
            ${cliente.nombre}
          </div>
          `;

      }else{

        resultadoCliente.innerHTML =
          `
          <span style="color:#b45309;">
            No se encontró un cliente con esa identificación.
          </span>
          `;

      }

    }
  );


  // =========================
  // GUARDAR VENTA
  // =========================

  document.getElementById("saleForm").onsubmit = e => {

    e.preventDefault();


    const fd =
      new FormData(e.target);


    const desc =
      Number(
        fd.get("descuento") || 0
      );


    const descripcionDescuento =
      String(
        fd.get("descripcionDescuento") || ""
      ).trim();

    if(desc > 0 && !descripcionDescuento){

  toast(
    "Debes indicar el motivo o descripción del descuento."
  );

  const campoDescripcion =
    document.querySelector(
      '#saleForm input[name="descripcionDescuento"]'
    );

  if(campoDescripcion){
    campoDescripcion.focus();
  }

  return;
    }


    const total =
      Math.max(
        0,
        cartTotal() - desc
      );


    // =========================
    // CONFIRMACIÓN FINAL
    // =========================

    const confirmar =
      confirm(
        "¿Deseas confirmar esta venta?\n\n" +
        "Total: " +
        money(total) +
        "\n\n" +
        "Una vez confirmada, se registrará " +
        "la venta y se descontarán los productos " +
        "del inventario."
      );


    if(!confirmar){
      return;
    }


    // =========================
    // DESCONTAR INVENTARIO
    // =========================

    cart.forEach(i => {

      const producto =
        getProduct(i.productoId);

      if(producto){

        producto.stock -=
          i.cantidad;

      }

    });


    // =========================
    // OBTENER CLIENTE
    // =========================

    const clienteEncontrado =
      DB.clientes.find(
        c =>
          String(c.id) ===
          String(fd.get("clienteId"))
      );


    // =========================
    // CREAR VENTA
    // =========================

    DB.ventas.unshift({

      id: Date.now(),

      fecha:
        new Date()
          .toISOString()
          .slice(0,10),

      cliente:
        clienteEncontrado
          ? clienteEncontrado.nombre
          : "Consumidor final",

      clienteId:
        clienteEncontrado
          ? clienteEncontrado.id
          : null,

      identificacionCliente:
        clienteEncontrado
          ? clienteEncontrado.identificacion
          : "",

      items:
        [...cart],

      descuento:
        desc,

      descripcionDescuento:
        descripcionDescuento,

      metodo:
        fd.get("metodo"),

      total:
        total

    });


    const sale =
      DB.ventas[0];


    saveData();

    cart = [];

    closeModal();

    showReceipt(sale);

    toast(
      "Venta registrada correctamente"
    );

  };

}
function showReceipt(sale) {

  const fechaVenta = new Date();

  const fecha = fechaVenta.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const hora = fechaVenta.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const subtotal = sale.items.reduce(
    (s, item) =>
      s + (Number(item.precio) * Number(item.cantidad)),
    0
  );

  const filasProductos = sale.items.map((item, index) => {

    const producto = getProduct(item.productoId);

    const nombre = producto?.nombre || "Producto";

    const totalProducto =
      Number(item.precio) * Number(item.cantidad);

    return `
      <tr>
        <td>${index + 1}</td>

        <td class="desc">
          ${nombre}
        </td>

        <td>
          ${item.cantidad}
        </td>

        <td>
          ${money(item.precio)}
        </td>

        <td>
          ${money(totalProducto)}
        </td>
      </tr>
    `;

  }).join("");

  const filaDescuento = sale.descuento > 0
    ? `
      <tr>
        <td></td>

        <td class="desc">
          Descuento
        </td>

        <td></td>

        <td>
          -${money(sale.descuento)}
        </td>

        <td>
          -${money(sale.descuento)}
        </td>
      </tr>
    `
    : "";

  openModal(
    "¡Venta exitosa! 🎉",

    `

    <div class="receipt-wrapper">

      <div id="receipt" class="invoice-card">

        <!-- ENCABEZADO -->

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


        <!-- INFORMACIÓN -->

        <div class="info-section">

          <div class="client-info">

            <h3>
              INF. CLIENTE:
            </h3>

            <p>
              Nombre: ${sale.cliente}
            </p>

            <p>
              Contacto: —
            </p>

            <p>
              Dirección: —
            </p>

          </div>


          <div class="receipt-info">

            <p>
              Comprobante: ${sale.id}
            </p>

            <p>
              Fecha: ${fecha}
            </p>

            <p>
              Hora: ${hora}
            </p>

          </div>

        </div>


        <!-- TABLA DE PRODUCTOS -->

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


        <!-- PARTE INFERIOR -->

        <div class="footer-section">

          <div class="observaciones">

            <h4>
              Observaciones
            </h4>

            <p>
              ${sale.metodo}
            </p>

            <div class="check-icon">
              ✓
            </div>

          </div>


          <div class="totals">

            <div class="subtotal">

              Sub Total:
              ${money(subtotal)}

            </div>

            ${
              sale.descuento > 0
              ? `
                <div class="subtotal">
                  Descuento:
                  -${money(sale.descuento)}
                </div>
              `
              : ""
            }

            <div class="total-border">

              Total:
              ${money(sale.total)}

            </div>

          </div>

        </div>


        <!-- AGRADECIMIENTO -->

        <div class="thank-you">
          Thank You
        </div>

      </div>


      <!-- BOTONES -->

      <div class="modal-actions">

        <button
          class="secondary-btn"
          onclick="window.print()"
        >
          🖨 Imprimir
        </button>

        <button
          class="primary-btn"
          onclick="closeModal();renderView('ventas')"
        >
          Nueva venta
        </button>

      </div>

    </div>

    `
  );

}
function renderVentas(){
  const q=(document.getElementById("saleSearch")?.value||"").toLowerCase();
  const products=DB.productos.filter(p=>`${p.nombre} ${p.marca}`.toLowerCase().includes(q));
  return `<div class="two-col grid">
    <div class="card"><div class="section-head"><h2>Productos</h2><span class="badge info">${cart.length} en carrito</span></div>
      <input id="saleSearch" oninput="renderView('ventas')" class="input" placeholder="🔍 Buscar producto..." value="${q}">
      <div class="product-grid mt">${products.map(p=>`<div class="product-card"><img src="${p.img}" onerror="this.style.visibility='hidden'"><div class="pc-body"><h3>${p.nombre}</h3><div class="small">${p.marca} · Stock ${p.stock}</div><div class="price">${money(p.precioVenta)}</div><button class="primary-btn" style="width:100%" onclick="addToCart(${p.id})" ${p.stock<=0?"disabled":""}>Agregar</button></div></div>`).join("")}</div>
    </div>
    <div class="card"><div class="section-head"><h2>Carrito</h2><button class="danger-btn" onclick="cart=[];renderView('ventas')">Vaciar</button></div>
      ${cart.length?cart.map(i=>{const p=getProduct(i.productoId);return `<div class="list-item"><div><b>${p.nombre}</b><div class="small">${money(i.precio)} c/u</div></div><div class="row">   <button class="secondary-btn" onclick="changeCart(${p.id},-1)">−</button>   <b>${i.cantidad}</b>   <button class="secondary-btn" onclick="changeCart(${p.id},1)">+</button>   <button     class="danger-btn"     onclick="removeFromCart(${p.id})"     title="Eliminar del carrito"   >     🗑️   </button> </div></div>`}).join(""):`<div class="empty">El carrito está vacío.<br>Agrega productos para comenzar.</div>`}
      <div class="mt"><div class="row space"><span>Subtotal</span><b>${money(cartTotal())}</b></div><div class="row space mt"><span class="kpi" style="font-size:18px">TOTAL</span><b class="kpi" style="font-size:22px">${money(cartTotal())}</b></div><button class="primary-btn mt" style="width:100%" onclick="finalizeSale()">Continuar al pago</button></div>
    </div>
  </div>`;
}