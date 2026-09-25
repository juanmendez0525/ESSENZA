

function openClientModal(id = null, opciones = {}){

  const desdeVenta = opciones.desdeVenta === true;

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
            value="${c?.nombre || ""}"
            required
          >
        </div>

        <div class="field">
          <label>Número de identificación</label>
          <input
            class="input"
            name="identificacion"
            value="${c?.identificacion || ""}"
            placeholder="Ej: 1090123456"
          >
        </div>

        <div class="field">
          <label>Teléfono</label>
          <input
            class="input"
            name="telefono"
            value="${c?.telefono || ""}"
            placeholder="Ej: 3001234567"
          >
        </div>

        <div class="field">
          <label>Dirección</label>
          <input
            class="input"
            name="direccion"
            value="${c?.direccion || ""}"
            placeholder="Ej: Calle 10 # 20-30"
          >
        </div>

        <div class="field full">
          <label>Correo</label>
          <input
            class="input"
            type="email"
            name="email"
            value="${c?.email || ""}"
            placeholder="cliente@email.com"
          >
        </div>

      </div>

      <div class="modal-actions">

        <button
          type="button"
          class="secondary-btn"
          onclick="${desdeVenta ? "restaurarVentaDesdeCliente()" : "closeModal()"}"
        >
          Cancelar
        </button>

        <button class="primary-btn">
          Guardar
        </button>

      </div>

    </form>`
  );

  document.getElementById("clientForm").onsubmit = async e => {

    e.preventDefault();

    const obj = Object.fromEntries(
      new FormData(e.target)
    );

    const identificacion = obj.identificacion.trim();

    // =========================
    // VERIFICAR IDENTIFICACIÓN
    // =========================

    if (identificacion) {

      const { data: existentes, error: errorBusqueda } =
        await supabaseClient
          .from("clientes")
          .select("id")
          .eq("identificacion", identificacion);

      if (errorBusqueda) {

        console.error(
          "ERROR REAL CLIENTES:",
          errorBusqueda
        );

        alert(
          JSON.stringify(
            errorBusqueda,
            null,
            2
          )
        );

        return;
      }

      const existeOtroCliente =
        existentes?.some(
          cliente =>
            String(cliente.id) !== String(id)
        );

      if (existeOtroCliente) {

        toast(
          "Ya existe un cliente con esa identificación"
        );

        return;
      }
    }

    const datosCliente = {

      nombre:
        obj.nombre.trim(),

      identificacion:
        identificacion || null,

      telefono:
        obj.telefono.trim() || null,

      direccion:
        obj.direccion.trim() || null,

      email:
        obj.email.trim() || null
    };


    // =========================
    // EDITAR
    // =========================

    if (id) {

      const { data, error } =
        await supabaseClient
          .from("clientes")
          .update(datosCliente)
          .eq("id", id)
          .select()
          .single();

      if (error) {

        console.error(
          "Error actualizando cliente:",
          error
        );

        toast(
          "No se pudo actualizar el cliente"
        );

        return;
      }

      const index =
        DB.clientes.findIndex(
          c =>
            String(c.id) ===
            String(id)
        );

      if (index !== -1) {
        DB.clientes[index] = data;
      }

      toast("Cliente actualizado");


      // Si se editó desde una venta,
      // no tiene sentido volver a Clientes.
      if (desdeVenta) {

        saveData();

        restaurarVentaDesdeCliente(
          data.identificacion || ""
        );
      
        return;
      }

    }


    // =========================
    // CREAR
    // =========================

    else {

      const { data, error } =
        await supabaseClient
          .from("clientes")
          .insert(datosCliente)
          .select()
          .single();
        
      if (error) {
      
        console.error(
          "Error creando cliente:",
          error
        );
      
        toast(
          "No se pudo guardar el cliente"
        );
      
        return;
      }
    
      DB.clientes.push(data);
    
      toast("Cliente guardado");
    
      if (desdeVenta) {
      
        saveData();
      
        restaurarVentaDesdeCliente(
          data.identificacion || ""
        );
      
        return;
      }
    }


    // Mantener copia local actualizada
    saveData();

    closeModal();

    renderView("clientes");
  };
}
async function cargarClientesDesdeSupabase() {

  const { data, error } = await supabaseClient
    .from("clientes")
    .select(`
      id,
      nombre,
      identificacion,
      telefono,
      email,
      direccion,
      notas,
      activo,
      created_at
    `)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando clientes:", error);
    toast("No se pudieron cargar los clientes");
    return false;
  }

  DB.clientes = data || [];

  return true;
}
async function renderClientes() {

  const cargado = await cargarClientesDesdeSupabase();

  if (!cargado) {
    return `
      <div class="empty-state">
        No fue posible cargar los clientes.
      </div>
    `;
  }

  const q = (
    document.getElementById("clientSearch")?.value || ""
  ).toLowerCase();

  const list = DB.clientes.filter(c =>
    `${c.nombre || ""} ${c.identificacion || ""} ${c.telefono || ""} ${c.direccion || ""}`
      .toLowerCase()
      .includes(q)
  );

  return `
    <div class="hero">

      <div class="section-head">

        <div>
          <h2>Clientes</h2>

          <p>
            Consulta compras y pedidos de cada persona.
          </p>
        </div>

        <button
          class="primary-btn"
          onclick="openClientModal()"
        >
          + Nuevo cliente
        </button>

      </div>

    </div>


    <div class="filters">

      <input
        id="clientSearch"
        oninput="renderView('clientes')"
        class="input search-box"
        placeholder="🔍 Buscar cliente..."
        value="${q}"
      >

    </div>


    <div class="product-grid">

      ${
        list.length

          ? list.map(c => {

              const aps =
                DB.apartados.filter(
                  a =>
                    String(a.clienteId) === String(c.id) &&
                    a.estado !== "Entregado"
                );

              const spent =
                DB.ventas
                  .filter(
                    v =>
                      v.cliente === c.nombre
                  )
                  .reduce(
                    (s, v) =>
                      s + Number(v.total || 0),
                    0
                  );

              const saldo =
                aps.reduce(
                  (s, a) =>
                    s +
                    Number(a.total || 0) -
                    Number(a.abonado || 0),
                  0
                );

              return `

                <div class="card">

                  <div class="row space">

                    <div>

                      <h2>
                        ${c.nombre}
                      </h2>

                      <div class="small">
                        📞 ${c.telefono || "Sin teléfono"}
                      </div>

                      ${
                        c.identificacion
                          ? `
                            <div class="small">
                              🪪 ${c.identificacion}
                            </div>
                          `
                          : ""
                      }

                    </div>

                    <button
                      class="secondary-btn"
                      onclick="openClientModal('${c.id}')"
                    >
                      Editar
                    </button>

                  </div>


                  <div class="list mt">

                    <div class="list-item">

                      <span>
                        Compras
                      </span>

                      <b>
                        ${money(spent)}
                      </b>

                    </div>


                    <div class="list-item">

                      <span>
                        Apartados activos
                      </span>

                      <b>
                        ${aps.length}
                      </b>

                    </div>


                    <div class="list-item">

                      <span>
                        Saldo
                      </span>

                      <b>
                        ${money(saldo)}
                      </b>

                    </div>

                  </div>

                </div>

              `;

            }).join("")

          : `
            <div class="empty-state">

              ${
                q
                  ? "No se encontraron clientes con esa búsqueda."
                  : "No hay clientes registrados."
              }

            </div>
          `
      }

    </div>
  `;
}