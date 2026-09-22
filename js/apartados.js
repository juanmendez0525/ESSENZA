function getClient(id){return DB.clientes.find(c=>c.id===Number(id))}
function openApartadoModal(){
  let items=[];
  openModal("Nuevo apartado",`<form id="apartadoForm">
    <div class="form-grid">
      <div class="field"><label>Cliente</label><select class="select" name="clienteId" required>${DB.clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join("")}</select></div>
      <div class="field"><label>Fecha límite</label><input class="input" type="date" name="fechaLimite" value="${new Date(Date.now()+7*86400000).toISOString().slice(0,10)}"></div>
    </div>
    <div class="field mt"><label>Producto</label><select id="apProduct" class="select">${DB.productos.filter(p=>p.stock>0).map(p=>`<option value="${p.id}">${p.nombre} · ${money(p.precioVenta)} · stock ${p.stock}</option>`).join("")}</select></div>
    <div class="row mt"><input id="apQty" class="input" type="number" min="1" value="1"><button type="button" class="primary-btn" onclick="addApartadoItem()">Agregar producto</button></div>
    <div id="apItems" class="list mt"></div>
    <div class="card mt" style="box-shadow:none;background:var(--soft)"><div class="row space"><span>Total</span><b id="apTotal">${money(0)}</b></div><div class="row space mt"><span>Abono inicial</span><input id="apAbono" class="input" style="max-width:150px" type="number" min="0" value="0"></div></div>
    <div class="modal-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancelar</button><button class="primary-btn">Guardar apartado</button></div>
  </form>`);
  window._apItems=items;
  window.addApartadoItem=()=>{
    const id=Number(document.getElementById("apProduct").value),qty=Number(document.getElementById("apQty").value);
    const p=getProduct(id); if(!p||qty<1||qty>p.stock){toast("Cantidad no disponible");return}
    const old=items.find(i=>i.productoId===id); if(old)old.cantidad=Math.min(p.stock,old.cantidad+qty);else items.push({productoId:id,cantidad:qty,precio:p.precioVenta});
    renderApItems();
  };
  function renderApItems(){
    document.getElementById("apItems").innerHTML=items.map(i=>`<div class="list-item"><span>${getProduct(i.productoId).nombre} × ${i.cantidad}</span><b>${money(i.precio*i.cantidad)}</b></div>`).join("")||'<div class="empty">No has agregado productos.</div>';
    document.getElementById("apTotal").textContent=money(items.reduce((s,i)=>s+i.precio*i.cantidad,0));
  }
  document.getElementById("apartadoForm").onsubmit=e=>{
    e.preventDefault();if(!items.length){toast("Agrega al menos un producto");return}
    const fd=new FormData(e.target),total=items.reduce((s,i)=>s+i.precio*i.cantidad,0),abono=Math.min(total,Number(document.getElementById("apAbono").value)||0);
    items.forEach(i=>getProduct(i.productoId).stock-=i.cantidad);
    DB.apartados.unshift({id:Date.now(),clienteId:Number(fd.get("clienteId")),fecha:new Date().toISOString().slice(0,10),fechaLimite:fd.get("fechaLimite"),items:[...items],total,abonado:abono,estado:abono>=total?"Pagado":"Pendiente"});
    saveData();closeModal();renderView("apartados");toast("Apartado creado");
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