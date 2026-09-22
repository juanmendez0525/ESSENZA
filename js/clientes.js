function openClientModal(id=null){

  const c = id
    ? getClient(id)
    : {
        nombre: "",
        identificacion: "",
        telefono: "",
        direccion: "",
        email: ""
      };

  openModal(
    id ? "Editar cliente" : "Nuevo cliente",

    `<form id="clientForm">

      <div class="form-grid">

        <div class="field">
          <label>Nombre</label>
          <input
            class="input"
            name="nombre"
            value="${c.nombre || ""}"
            required
          >
        </div>

        <div class="field">
          <label>Número de identificación</label>
          <input
            class="input"
            name="identificacion"
            value="${c.identificacion || ""}"
            placeholder="Ej: 1090123456"
          >
        </div>

        <div class="field">
          <label>Teléfono</label>
          <input
            class="input"
            name="telefono"
            value="${c.telefono || ""}"
            placeholder="Ej: 3001234567"
          >
        </div>

        <div class="field">
          <label>Dirección</label>
          <input
            class="input"
            name="direccion"
            value="${c.direccion || ""}"
            placeholder="Ej: Calle 10 # 20-30"
          >
        </div>

        <div class="field full">
          <label>Correo</label>
          <input
            class="input"
            type="email"
            name="email"
            value="${c.email || ""}"
            placeholder="cliente@email.com"
          >
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
          Guardar
        </button>

      </div>

    </form>`
  );

  document.getElementById("clientForm").onsubmit = e => {

    e.preventDefault();

    const obj =
      Object.fromEntries(
        new FormData(e.target)
      );

    if(id){

      Object.assign(
        getClient(id),
        obj
      );

    }else{

      DB.clientes.push({
        id: Date.now(),
        ...obj
      });

    }

    saveData();

    closeModal();

    renderView("clientes");

    toast("Cliente guardado");
  };
}
function renderClientes(){
  const q=(document.getElementById("clientSearch")?.value||"").toLowerCase();
  const list = DB.clientes.filter(c =>
      `${c.nombre} ${c.identificacion} ${c.telefono} ${c.direccion}`
        .toLowerCase()
        .includes(q)
  );  
  return `<div class="hero"><div class="section-head"><div><h2>Clientes</h2><p>Consulta compras y pedidos de cada persona.</p></div><button class="primary-btn" onclick="openClientModal()">+ Nuevo cliente</button></div></div>
  <div class="filters"><input id="clientSearch" oninput="renderView('clientes')" class="input search-box" placeholder="🔍 Buscar cliente..." value="${q}"></div>
  <div class="product-grid">${list.map(c=>{const aps=DB.apartados.filter(a=>a.clienteId===c.id&&a.estado!=="Entregado");const spent=DB.ventas.filter(v=>v.cliente===c.nombre).reduce((s,v)=>s+v.total,0);return `<div class="card"><div class="row space"><div><h2>${c.nombre}</h2><div class="small">📞 ${c.telefono||"Sin teléfono"}</div></div><button class="secondary-btn" onclick="openClientModal(${c.id})">Editar</button></div><div class="list mt"><div class="list-item"><span>Compras</span><b>${money(spent)}</b></div><div class="list-item"><span>Apartados activos</span><b>${aps.length}</b></div><div class="list-item"><span>Saldo</span><b>${money(aps.reduce((s,a)=>s+a.total-a.abonado,0))}</b></div></div></div>`}).join("")}</div>`;
}