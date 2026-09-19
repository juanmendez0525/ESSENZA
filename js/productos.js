function money(v){return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v||0)}
function getProduct(id){return DB.productos.find(p=>p.id===Number(id))}
function productStatus(p){
  if(p.stock<=0) return '<span class="badge danger">Agotado</span>';
  if(p.stock<=p.stockMinimo) return '<span class="badge warning">Stock bajo</span>';
  return '<span class="badge success">Disponible</span>';
}
function openProductModal(id=null){
  if (window.perfilActual?.rol !== "administrador") {
  toast("No tienes permiso para administrar productos.");
  return;
  }
  const p=id?getProduct(id):{nombre:"",marca:"",categoria:"",referencia:"",precioCompra:0,precioVenta:0,stock:0,stockMinimo:2,img:""};
  openModal(id?"Editar producto":"Nuevo producto",`
    <form id="productForm">
      <div class="form-grid">
        <div class="field"><label>Nombre</label><input class="input" name="nombre" value="${p.nombre}" required></div>
        <div class="field"><label>Marca</label><input class="input" name="marca" value="${p.marca}" required></div>
        <div class="field"><label>Categoría</label><select class="select" name="categoria">
          ${["Labiales","Bases","Correctores","Rubores","Sombras","Ojos","Iluminadores","Skincare","Otros"].map(x=>`<option ${x===p.categoria?"selected":""}>${x}</option>`).join("")}
        </select></div>
        <div class="field"><label>Referencia</label><input class="input" name="referencia" value="${p.referencia}"></div>
        <div class="field"><label>Precio de compra</label><input class="input" type="number" name="precioCompra" value="${p.precioCompra}" min="0"></div>
        <div class="field"><label>Precio de venta</label><input class="input" type="number" name="precioVenta" value="${p.precioVenta}" min="0" required></div>
        <div class="field"><label>Stock inicial / actual</label><input class="input" type="number" name="stock" value="${p.stock}" min="0"></div>
        <div class="field"><label>Stock mínimo</label><input class="input" type="number" name="stockMinimo" value="${p.stockMinimo}" min="0"></div>
        <div class="field full"><label>URL de imagen (opcional)</label><input class="input" name="img" value="${p.img||""}" placeholder="https://..."></div>
      </div>
      <div class="modal-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancelar</button><button class="primary-btn">Guardar</button></div>
    </form>`);
  document.getElementById("productForm").onsubmit=e=>{
    e.preventDefault(); const fd=new FormData(e.target); const obj=Object.fromEntries(fd);
    ["precioCompra","precioVenta","stock","stockMinimo"].forEach(k=>obj[k]=Number(obj[k]||0));
    if(id) Object.assign(getProduct(id),obj); else DB.productos.push({id:Date.now(),...obj});
    saveData(); closeModal(); renderView("inventario"); toast("Producto guardado");
  };
}

function adjustStock(id){

  if (window.perfilActual?.rol !== "administrador") {
  toast("No tienes permiso para modificar el inventario.");
  return;
  }
  const p=getProduct(id);
  openModal("Movimiento de inventario",`
    <div class="card" style="box-shadow:none;background:var(--soft);margin-bottom:15px">
      <b>${p.nombre}</b><div class="small">Stock actual: ${p.stock}</div>
    </div>
    <form id="stockForm">
      <div class="form-grid">
        <div class="field"><label>Tipo</label><select class="select" name="tipo"><option value="entrada">Entrada</option><option value="salida">Salida</option></select></div>
        <div class="field"><label>Cantidad</label><input class="input" type="number" name="cantidad" min="1" required></div>
      </div>
      <div class="modal-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancelar</button><button class="primary-btn">Registrar</button></div>
    </form>`);
  document.getElementById("stockForm").onsubmit=e=>{
    e.preventDefault(); const fd=new FormData(e.target), n=Number(fd.get("cantidad"));
    p.stock=fd.get("tipo")==="entrada"?p.stock+n:Math.max(0,p.stock-n); saveData(); closeModal(); renderView("inventario"); toast("Inventario actualizado");
  };
}
function renderInventario(){

  const rol = window.perfilActual?.rol;
  const esAdmin = rol === "administrador";

  const q =
    (document.getElementById("inventorySearch")?.value || "")
      .toLowerCase();

  const cat =
    document.getElementById("inventoryCat")?.value || "";

  const list =
    DB.productos.filter(p =>
      (!q ||
        `${p.nombre} ${p.marca} ${p.referencia}`
          .toLowerCase()
          .includes(q)
      ) &&
      (!cat || p.categoria === cat)
    );


  // ==========================================
  // BOTÓN NUEVO PRODUCTO
  // SOLO ADMINISTRADOR
  // ==========================================

  const botonNuevoProducto = esAdmin
    ? `
      <button
        class="primary-btn"
        onclick="openProductModal()"
      >
        + Nuevo producto
      </button>
    `
    : "";


  // ==========================================
  // ACCIONES POR PRODUCTO
  // SOLO ADMINISTRADOR
  // ==========================================

  const acciones = esAdmin
    ? `
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
              c === cat ? "selected" : ""
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
                          onerror="this.style.visibility='hidden'"
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

                    <td colspan="${esAdmin ? 7 : 6}">

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