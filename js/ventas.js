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

  openModal("Finalizar venta",`

    <form id="saleForm">

      <div class="form-grid">

        <div class="field">
          <label>Cliente</label>

          <select
            class="select"
            name="cliente"
          >
            <option>
              Consumidor final
            </option>

            ${DB.clientes.map(c =>
              `<option>${c.nombre}</option>`
            ).join("")}

          </select>
        </div>


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
            name="descuento"
            value="0"
            min="0"
          >

        </div>

      </div>


      <div
        class="card mt"
        style="box-shadow:none;background:var(--soft)"
      >

        <div class="small">
          Total productos
        </div>

        <div class="kpi">
          ${money(cartTotal())}
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
  `);


  document.getElementById("saleForm").onsubmit = e => {

    e.preventDefault();


    const fd =
      new FormData(e.target);

    const desc =
      Number(
        fd.get("descuento") || 0
      );

    const total =
      Math.max(
        0,
        cartTotal() - desc
      );


    // ==========================================
    // CONFIRMACIÓN FINAL
    // ==========================================

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


    // ==========================================
    // DESCONTAR INVENTARIO
    // ==========================================

    cart.forEach(i => {

      const producto =
        getProduct(i.productoId);

      if(producto){
        producto.stock -= i.cantidad;
      }

    });


    // ==========================================
    // CREAR VENTA
    // ==========================================

    DB.ventas.unshift({

      id: Date.now(),

      fecha:
        new Date()
          .toISOString()
          .slice(0,10),

      cliente:
        fd.get("cliente"),

      items:
        [...cart],

      descuento:
        desc,

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


    // Mostrar venta exitosa + comprobante
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