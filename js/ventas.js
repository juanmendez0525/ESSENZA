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

      <!-- CLIENTE -->

      <div class="card" style="box-shadow:none;background:var(--soft)">

        <div class="section-head">

          <h3>Cliente</h3>

          <button
            type="button"
            class="secondary-btn"
            id="btnConsumidorFinal"
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
                id="identificacionCliente"
                name="identificacion"
                placeholder="Ej: 1090123456"
              >

              <button
                type="button"
                class="secondary-btn"
                id="btnBuscarCliente"
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
              type="text"
              id="nombreCliente"
              name="cliente"
              value="Consumidor final"
              readonly
            >

          </div>

        </div>


        <div
          id="datosClienteVenta"
          class="small mt"
        >
          Puedes buscar un cliente registrado por su número de identificación.
        </div>

      </div>


      <!-- PAGO Y DESCUENTO -->

      <div class="form-grid mt">

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


        <div class="field">

          <label>
            Descuento
          </label>

          <input
            class="input"
            type="number"
            id="descuentoVenta"
            name="descuento"
            value="0"
            min="0"
            step="1"
          >

        </div>


        <div class="field full">

          <label>
            Descripción del descuento
          </label>

          <textarea
            class="input"
            id="descripcionDescuento"
            name="descripcionDescuento"
            rows="2"
            placeholder="Ej: Descuento por cliente frecuente, promoción, producto con detalle..."
          ></textarea>

          <div class="small">
            La descripción es obligatoria si aplicas un descuento.
          </div>

        </div>

      </div>


      <!-- RESUMEN -->

      <div
        class="card mt"
        style="box-shadow:none;background:var(--soft)"
      >

        <div class="small">
          Total productos
        </div>

        <div
          id="subtotalVenta"
          class="kpi"
        >
          ${money(cartTotal())}
        </div>


        <div
          class="row space mt"
          id="filaDescuentoVenta"
          style="display:none"
        >

          <span>
            Descuento
          </span>

          <b id="valorDescuentoVenta">
            $0
          </b>

        </div>


        <div class="row space mt">

          <span class="kpi" style="font-size:18px">
            TOTAL
          </span>

          <b
            id="totalVenta"
            class="kpi"
            style="font-size:22px"
          >
            ${money(cartTotal())}
          </b>

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
          Confirmar venta
        </button>

      </div>

    </form>

    `
  );


  // ==========================================
  // ELEMENTOS
  // ==========================================

  const saleForm =
    document.getElementById("saleForm");

  const inputIdentificacion =
    document.getElementById(
      "identificacionCliente"
    );

  const inputNombre =
    document.getElementById(
      "nombreCliente"
    );

  const datosCliente =
    document.getElementById(
      "datosClienteVenta"
    );

  const inputDescuento =
    document.getElementById(
      "descuentoVenta"
    );

  const inputDescripcion =
    document.getElementById(
      "descripcionDescuento"
    );

  const filaDescuento =
    document.getElementById(
      "filaDescuentoVenta"
    );

  const valorDescuento =
    document.getElementById(
      "valorDescuentoVenta"
    );

  const totalVenta =
    document.getElementById(
      "totalVenta"
    );


  // ==========================================
  // BUSCAR CLIENTE
  // ==========================================

  document
    .getElementById("btnBuscarCliente")
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
          Correo:
          ${cliente.email || "No registrado"}
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
    .getElementById("btnConsumidorFinal")
    .onclick = function(){

      inputIdentificacion.value = "";

      inputNombre.value =
        "Consumidor final";

      datosCliente.innerHTML =
        `
        Puedes buscar un cliente registrado por su número de identificación.
        `;

      inputIdentificacion.focus();

    };


  // ==========================================
  // ACTUALIZAR TOTAL
  // ==========================================

  function actualizarTotalVenta(){

    const subtotal =
      cartTotal();

    let descuento =
      Number(
        inputDescuento.value || 0
      );


    if(descuento < 0){

      descuento = 0;

      inputDescuento.value = 0;

    }


    if(descuento > subtotal){

      descuento = subtotal;

      inputDescuento.value =
        subtotal;

    }


    const total =
      Math.max(
        0,
        subtotal - descuento
      );


    if(descuento > 0){

      filaDescuento.style.display =
        "flex";

      valorDescuento.textContent =
        "-" + money(descuento);

    } else {

      filaDescuento.style.display =
        "none";

    }


    totalVenta.textContent =
      money(total);

  }


  inputDescuento.addEventListener(
    "input",
    actualizarTotalVenta
  );


  // ==========================================
  // GUARDAR VENTA
  // ==========================================

  saleForm.onsubmit = function(e){

    e.preventDefault();


    const fd =
      new FormData(saleForm);


    const identificacion =
      String(
        fd.get("identificacion") || ""
      ).trim();


    const cliente =
      String(
        fd.get("cliente") ||
        "Consumidor final"
      ).trim();

     const clienteEncontrado =
        DB.clientes.find(
          c =>
            String(c.identificacion || "").trim()
            === identificacion
        );

    const descuento =
      Number(
        fd.get("descuento") || 0
      );


    const descripcionDescuento =
      String(
        fd.get(
          "descripcionDescuento"
        ) || ""
      ).trim();


    // ========================================
    // VALIDAR DESCUENTO
    // ========================================

    if(descuento > 0){

      if(!descripcionDescuento){

        toast(
          "Debes indicar el motivo del descuento."
        );

        inputDescripcion.focus();

        return;
      }

    }


    // ========================================
    // CALCULAR TOTAL
    // ========================================

    const total =
      Math.max(
        0,
        cartTotal() - descuento
      );


    // ========================================
    // CONFIRMACIÓN FINAL
    // ========================================

    const confirmar =
      confirm(

        "¿Deseas confirmar esta venta?\n\n" +

        "Cliente: " +
        cliente +

        "\n" +

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


    // ========================================
    // DESCONTAR INVENTARIO
    // ========================================

    cart.forEach(i => {

      const producto =
        getProduct(
          i.productoId
        );


      if(producto){

        producto.stock -=
          i.cantidad;

      }

    });


    // ========================================
    // CREAR VENTA
    // ========================================

    DB.ventas.unshift({

  id:
    Date.now(),

  fecha:
    new Date()
      .toISOString()
      .slice(0,10),

  cliente:
    cliente,

  clienteId:
    clienteEncontrado?.id || null,

  identificacionCliente:
    identificacion,

  telefonoCliente:
    clienteEncontrado?.telefono || "",

  direccionCliente:
    clienteEncontrado?.direccion || "",

  items:
    [...cart],

  descuento:
    descuento,

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


    // Vaciar carrito

    cart = [];


    // Cerrar formulario

    closeModal();


    // Mostrar comprobante

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
      Nombre: ${sale.cliente || "Consumidor final"}
    </p>

    <p>
      Contacto: ${sale.telefonoCliente || "—"}
    </p>

    <p>
      Dirección: ${sale.direccionCliente || "—"}
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
