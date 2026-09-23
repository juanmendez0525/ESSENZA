function money(v){
  return new Intl.NumberFormat("es-CO",{
    style:"currency",
    currency:"COP",
    maximumFractionDigits:0
  }).format(v||0);
}


// ==========================================
// CONVERTIR PRODUCTO DE SUPABASE
// AL FORMATO QUE USA LA APLICACIÓN
// ==========================================

function mapProductoSupabase(p){

  return {
    id: p.id,
    marca: p.marca || "",
    nombre: p.nombre || "",
    referencia: p.referencia || "",
    categoria: p.categoria || "",
    tono: p.tono || "",
    precioCompra: Number(p.precioCompra || 0),
    precioVenta: Number(p.precioVenta || 0),
    stock: Number(p.stock || 0),
    stockMinimo: Number(p.stockMinimo || 0),
    img: p.img || "",
    activo: p.activo !== false,
    created_at: p.created_at,
    updated_at: p.updated_at
  };

}


// ==========================================
// CARGAR PRODUCTOS DESDE SUPABASE
// ==========================================

async function cargarProductosDesdeSupabase(){

  const {
    data,
    error
  } = await supabaseClient
    .from("productos")
    .select(`
      id,
      marca,
      nombre,
      referencia,
      categoria,
      tono,
      "precioCompra",
      "precioVenta",
      stock,
      "stockMinimo",
      img,
      activo,
      created_at,
      updated_at
    `)
    .eq("activo", true)
    .order("nombre", {
      ascending: true
    });

  if(error){

    console.error(
      "Error cargando productos desde Supabase:",
      error
    );

    toast("No se pudieron cargar los productos.");

    return false;
  }

  DB.productos = data.map(
    mapProductoSupabase
  );

  return true;
}


// ==========================================
// OBTENER PRODUCTO
// ==========================================

function getProduct(id){

  return DB.productos.find(
    p => String(p.id) === String(id)
  );

}


// ==========================================
// ESTADO DEL PRODUCTO
// ==========================================

function productStatus(p){

  if(p.stock<=0)
    return '<span class="badge danger">Agotado</span>';

  if(p.stock<=p.stockMinimo)
    return '<span class="badge warning">Stock bajo</span>';

  return '<span class="badge success">Disponible</span>';

}


// ==========================================
// MODAL PRODUCTO
// ==========================================

function openProductModal(id=null){

  if (
    window.perfilActual?.rol !==
    "administrador"
  ){

    toast(
      "No tienes permiso para administrar productos."
    );

    return;
  }

  const p = id
    ? getProduct(id)
    : {
        nombre:"",
        marca:"",
        categoria:"",
        referencia:"",
        precioCompra:0,
        precioVenta:0,
        stock:0,
        stockMinimo:2,
        img:""
      };


  openModal(
    id
      ? "Editar producto"
      : "Nuevo producto",
    `
      <form id="productForm">

        <div class="form-grid">

          <div class="field">
            <label>Nombre</label>
            <input
              class="input"
              name="nombre"
              value="${p.nombre}"
              required
            >
          </div>

          <div class="field">
            <label>Marca</label>
            <input
              class="input"
              name="marca"
              value="${p.marca || ""}"
              required
            >
          </div>

          <div class="field">
            <label>Categoría</label>

            <select
              class="select"
              name="categoria"
            >

              ${
                [
                  "Labiales",
                  "Bases",
                  "Correctores",
                  "Rubores",
                  "Sombras",
                  "Ojos",
                  "Iluminadores",
                  "Skincare",
                  "Otros"
                ]
                .map(x =>
                  `<option ${
                    x===p.categoria
                      ? "selected"
                      : ""
                  }>${x}</option>`
                )
                .join("")
              }

            </select>

          </div>

          <div class="field">
            <label>Referencia</label>
            <input
              class="input"
              name="referencia"
              value="${p.referencia || ""}"
            >
          </div>

          <div class="field">
            <label>Precio de compra</label>
            <input
              class="input"
              type="number"
              name="precioCompra"
              value="${p.precioCompra}"
              min="0"
            >
          </div>

          <div class="field">
            <label>Precio de venta</label>
            <input
              class="input"
              type="number"
              name="precioVenta"
              value="${p.precioVenta}"
              min="0"
              required
            >
          </div>

          <div class="field">
            <label>Stock inicial / actual</label>
            <input
              class="input"
              type="number"
              name="stock"
              value="${p.stock}"
              min="0"
            >
          </div>

          <div class="field">
            <label>Stock mínimo</label>
            <input
              class="input"
              type="number"
              name="stockMinimo"
              value="${p.stockMinimo}"
              min="0"
            >
          </div>

          <div class="field full">
            <label>URL de imagen (opcional)</label>

            <input
              class="input"
              name="img"
              value="${p.img || ""}"
              placeholder="https://..."
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

      </form>
    `
  );


  document.getElementById("productForm").onsubmit=async e=>{

    e.preventDefault();

    const fd =
      new FormData(e.target);

    const obj =
      Object.fromEntries(fd);

    [
      "precioCompra",
      "precioVenta",
      "stock",
      "stockMinimo"
    ]
    .forEach(
      k =>
        obj[k] =
          Number(obj[k] || 0)
    );


    try {
      let error;
    
      if (id) {
        const { error: updateError } = await supabaseClient
          .from("productos")
          .update({
            marca: obj.marca || null,
            nombre: obj.nombre,
            referencia: obj.referencia || null,
            categoria: obj.categoria || null,
            precioCompra: obj.precioCompra,
            precioVenta: obj.precioVenta,
            stock: obj.stock,
            stockMinimo: obj.stockMinimo,
            img: obj.img || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
        
        error = updateError;
      } else {
        const { error: insertError } = await supabaseClient
          .from("productos")
          .insert({
            marca: obj.marca || null,
            nombre: obj.nombre,
            referencia: obj.referencia || null,
            categoria: obj.categoria || null,
            precioCompra: obj.precioCompra,
            precioVenta: obj.precioVenta,
            stock: obj.stock,
            stockMinimo: obj.stockMinimo,
            img: obj.img || null,
            activo: true
          });
        
        error = insertError;
      }
    
      if (error) {
        console.error("Error guardando producto en Supabase:", error);
        console.error("Código:", error.code);
        console.error("Mensaje:", error.message);
        console.error("Detalles:", error.details);
        console.error("Hint:", error.hint);
            
        toast(`Error Supabase: ${error.message}`);
        return;
      }
    
      closeModal();
    
      await cargarProductosDesdeSupabase();
    
      renderView("inventario");
    
      toast(id ? "Producto actualizado" : "Producto guardado");
    } catch (err) {
      console.error(err);
      toast("Ocurrió un error al guardar el producto.");
    }

  };

}


// ==========================================
// AJUSTAR STOCK
// ==========================================

function adjustStock(id){

  if (
    window.perfilActual?.rol !==
    "administrador"
  ){

    toast(
      "No tienes permiso para modificar el inventario."
    );

    return;
  }


  const p =
    getProduct(id);


  openModal(
    "Movimiento de inventario",
    `
      <div
        class="card"
        style="
          box-shadow:none;
          background:var(--soft);
          margin-bottom:15px
        "
      >

        <b>${p.nombre}</b>

        <div class="small">
          Stock actual: ${p.stock}
        </div>

      </div>

      <form id="stockForm">

        <div class="form-grid">

          <div class="field">

            <label>Tipo</label>

            <select
              class="select"
              name="tipo"
            >

              <option value="entrada">
                Entrada
              </option>

              <option value="salida">
                Salida
              </option>

            </select>

          </div>

          <div class="field">

            <label>Cantidad</label>

            <input
              class="input"
              type="number"
              name="cantidad"
              min="1"
              required
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
            Registrar
          </button>

        </div>

      </form>
    `
  );


  document.getElementById("stockForm").onsubmit=async e=>{
    e.preventDefault();

    const fd = new FormData(e.target);
    const n = Number(fd.get("cantidad"));

    const nuevoStock =
      fd.get("tipo") === "entrada"
        ? p.stock + n
        : Math.max(0, p.stock - n);

    const { error } = await supabaseClient
      .from("productos")
      .update({
        stock: nuevoStock,
        updated_at: new Date().toISOString()
      })
      .eq("id", p.id);

    if (error) {
      console.error("Error actualizando stock:", error);
      toast(`Error Supabase: ${error.message}`);
      return;
    }

    closeModal();

    await cargarProductosDesdeSupabase();

    renderView("inventario");

    toast("Inventario actualizado");
  };

}


// ==========================================
// RENDER INVENTARIO
// ==========================================

function renderInventario(){

  const rol =
    window.perfilActual?.rol;

  const esAdmin =
    rol === "administrador";


  const q =
    (
      document.getElementById(
        "inventorySearch"
      )?.value || ""
    )
    .toLowerCase();


  const cat =
    document.getElementById(
      "inventoryCat"
    )?.value || "";


  const list =
    DB.productos.filter(p =>

      (
        !q ||
        `${p.nombre} ${p.marca} ${p.referencia}`
          .toLowerCase()
          .includes(q)
      )

      &&

      (
        !cat ||
        p.categoria === cat
      )

    );


  const botonNuevoProducto =
    esAdmin

      ? `
        <button
          class="primary-btn"
          onclick="openProductModal()"
        >
          + Nuevo producto
        </button>
      `

      : "";


  return `

    <div class="hero">

      <div class="section-head">

        <div>

          <h2>
            Control de inventario
          </h2>

          <p>
            ${
              esAdmin
                ? "Administra existencias, precios y productos."
                : "Consulta productos y existencias disponibles."
            }
          </p>

        </div>

        ${botonNuevoProducto}

      </div>

    </div>


    <div class="filters">

      <input
        id="inventorySearch"
        oninput="renderView('inventario')"
        class="input search-box"
        placeholder="🔍 Buscar producto..."
        value="${q}"
      >

      <select
        id="inventoryCat"
        onchange="renderView('inventario')"
        class="select"
        style="max-width:190px"
      >

        <option value="">
          Todas las categorías
        </option>

        ${
          [
            ...new Set(
              DB.productos.map(
                p => p.categoria
              )
            )
          ]

          .map(c =>
            `<option ${
              c === cat
                ? "selected"
                : ""
            }>${c}</option>`
          )

          .join("")
        }

      </select>

    </div>


    <div class="card">

      <div class="table-wrap">

        <table>

          <thead>

            <tr>

              <th>Producto</th>
              <th>Categoría</th>
              <th>Compra</th>
              <th>Venta</th>
              <th>Stock</th>
              <th>Estado</th>

              ${
                esAdmin
                  ? "<th>Acciones</th>"
                  : ""
              }

            </tr>

          </thead>


          <tbody>

            ${
              list

                .map(p => `

                  <tr>

                    <td>

                      <div class="product-cell">

                        <img
                          class="product-img"
                          src="${p.img || ""}"
                          onerror="
                            this.style.visibility='hidden'
                          "
                        >

                        <div>

                          <b>
                            ${p.nombre}
                          </b>

                          <div class="small">
                            ${p.marca} · ${p.referencia}
                          </div>

                        </div>

                      </div>

                    </td>

                    <td>
                      ${p.categoria}
                    </td>

                    <td>
                      ${money(p.precioCompra)}
                    </td>

                    <td>
                      <b>
                        ${money(p.precioVenta)}
                      </b>
                    </td>

                    <td>
                      ${p.stock}
                    </td>

                    <td>
                      ${productStatus(p)}
                    </td>

                    ${
                      esAdmin
                        ? `
                          <td>

                            <button
                              class="secondary-btn"
                              onclick="adjustStock('${p.id}')"
                            >
                              ± Stock
                            </button>

                            <button
                              class="secondary-btn"
                              onclick="openProductModal('${p.id}')"
                            >
                              Editar
                            </button>

                          </td>
                        `
                        : ""
                    }

                  </tr>

                `)

                .join("")

                ||

                `
                  <tr>

                    <td
                      colspan="${esAdmin ? 7 : 6}"
                    >

                      <div class="empty">
                        No hay productos.
                      </div>

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