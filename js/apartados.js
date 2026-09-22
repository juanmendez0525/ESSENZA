function getClient(id){return DB.clientes.find(c=>c.id===Number(id))}
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
function deliverApartado(id){
  const a=DB.apartados.find(x=>x.id===id);if(a.abonado<a.total){toast("El pedido aún tiene saldo pendiente");return}
  a.estado="Entregado";saveData();renderView("apartados");toast("Pedido entregado");
}
function renderApartados(){
  return `<div class="hero"><div class="section-head"><div><h2>Pedidos apartados</h2><p>Controla abonos, saldos y entregas.</p></div><button class="primary-btn" onclick="openApartadoModal()">+ Nuevo apartado</button></div></div>
  <div class="stats-grid grid">
    ${["Pendiente","Pagado","Entregado"].map(s=>`<div class="card stat-card"><div class="stat-label">${s}</div><div class="stat-value">${DB.apartados.filter(a=>a.estado===s).length}</div></div>`).join("")}
    <div class="card stat-card"><div class="stat-label">Saldo pendiente</div><div class="stat-value">${money(DB.apartados.filter(a=>a.estado!=="Entregado").reduce((s,a)=>s+a.total-a.abonado,0))}</div></div>
  </div>
  <div class="card mt"><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha límite</th><th>Total</th><th>Abonado</th><th>Saldo</th><th>Estado</th><th></th></tr></thead><tbody>
  ${DB.apartados.map(a=>`<tr><td>#${a.id}</td><td><b>${getClient(a.clienteId)?.nombre||"Cliente"}</b></td><td>${a.fechaLimite}</td><td>${money(a.total)}</td><td>${money(a.abonado)}</td><td>${money(a.total-a.abonado)}</td><td><span class="badge ${a.estado==="Entregado"?"success":a.estado==="Pagado"?"info":"warning"}">${a.estado}</span></td><td>${a.estado==="Pendiente"?`<button class="secondary-btn" onclick="registerAbono(${a.id})">Abono</button>`:""} ${a.estado==="Pagado"?`<button class="primary-btn" onclick="deliverApartado(${a.id})">Entregar</button>`:""}</td></tr>`).join("")}
  </tbody></table></div></div>`;
}