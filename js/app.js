const viewMeta={
  inicio:["Inicio","Resumen de tu negocio"],ventas:["Nueva venta","Busca productos y cobra"],inventario:["Inventario","Productos y existencias"],apartados:["Apartados","Pedidos, abonos y entregas"],clientes:["Clientes","Tus clientes y su historial"],reportes:["Reportes","Resumen de ventas y rentabilidad"],configuracion:["Configuración","Datos básicos de tu negocio"],mas:["Más","Opciones adicionales"]
};
function openModal(title,content){
  document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="close-btn" onclick="closeModal()">×</button></div>${content}</div></div>`;
}
function closeModal(){document.getElementById("modalRoot").innerHTML=""}
function toast(msg){const r=document.getElementById("toastRoot");r.innerHTML=`<div class="toast">${msg}</div>`;setTimeout(()=>r.innerHTML="",2500)}
function setActive(view){
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
}
function renderView(view="inicio"){
  if(view==="mas")view="configuracion";
  const [title,sub]=viewMeta[view]||viewMeta.inicio;
  document.getElementById("pageTitle").textContent=title;document.getElementById("pageSubtitle").textContent=sub;setActive(view);
  const root=document.getElementById("appView");
  const renderers={inicio:renderInicio,ventas:renderVentas,inventario:renderInventario,apartados:renderApartados,clientes:renderClientes,reportes:renderReportes,configuracion:renderConfiguracion};
  root.innerHTML=renderers[view]?renderers[view]():renderInicio();
}
function renderInicio(){
  const today=new Date().toISOString().slice(0,10), todaySales=DB.ventas.filter(v=>v.fecha===today), sales=todaySales.reduce((s,v)=>s+v.total,0);
  const low=DB.productos.filter(p=>p.stock<=p.stockMinimo);
  const pending=DB.apartados.filter(a=>a.estado==="Pendiente");
  return `<div class="hero"><h2>¡Bienvenido! 👋</h2><p>Administra tus ventas, maquillaje e inventario desde un solo lugar.</p></div>
  <div class="stats-grid grid">
    <div class="card stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ventas de hoy</div><div class="stat-value">${money(sales)}</div><div class="stat-extra">${todaySales.length} ventas</div></div>
    <div class="card stat-card"><div class="stat-icon">📦</div><div class="stat-label">Productos</div><div class="stat-value">${DB.productos.reduce((s,p)=>s+p.stock,0)}</div><div class="stat-extra">${DB.productos.length} referencias</div></div>
    <div class="card stat-card"><div class="stat-icon">🟡</div><div class="stat-label">Apartados</div><div class="stat-value">${pending.length}</div><div class="stat-extra">${money(pending.reduce((s,a)=>s+a.total-a.abonado,0))} pendiente</div></div>
    <div class="card stat-card"><div class="stat-icon">⚠️</div><div class="stat-label">Stock bajo</div><div class="stat-value">${low.length}</div><div class="stat-extra">Revisa inventario</div></div>
  </div>
  <div class="section-head mt"><h2>Acciones rápidas</h2></div>
  <div class="quick-grid grid">
    <button class="quick-btn" onclick="renderView('ventas')">🛒<b>Nueva venta</b><span>Registrar una compra</span></button>
    <button class="quick-btn" onclick="openProductModal()">📦<b>Agregar producto</b><span>Crear una referencia</span></button>
    <button class="quick-btn" onclick="openApartadoModal()">🟡<b>Nuevo apartado</b><span>Separar productos</span></button>
    <button class="quick-btn" onclick="renderView('clientes')">👥<b>Clientes</b><span>Ver tus clientes</span></button>
  </div>
  <div class="two-col grid mt">
    <div class="card"><div class="section-head"><h2>Últimas ventas</h2><button class="secondary-btn" onclick="renderView('reportes')">Ver reportes</button></div><div class="list">${DB.ventas.slice(0,5).map(v=>`<div class="list-item"><div><b>#${v.id} · ${v.cliente}</b><div class="small">${v.fecha} · ${v.metodo}</div></div><b>${money(v.total)}</b></div>`).join("")}</div></div>
    <div class="card"><div class="section-head"><h2>⚠️ Stock bajo</h2><button class="secondary-btn" onclick="renderView('inventario')">Inventario</button></div><div class="list">${low.slice(0,6).map(p=>`<div class="list-item"><span>${p.nombre}</span><span class="badge warning">${p.stock} uds.</span></div>`).join("")||'<div class="empty">Todo está bien por ahora.</div>'}</div></div>
  </div>`;
}
function renderConfiguracion(){
  const c=DB.configuracion;
  return `<div class="card"><h2>Información del negocio</h2><p class="small">Estos datos aparecerán en los comprobantes.</p><form id="settingsForm" class="mt"><div class="form-grid">
  <div class="field"><label>Nombre del negocio</label><input class="input" name="negocio" value="${c.negocio}"></div>
  <div class="field"><label>NIT</label><input class="input" name="nit" value="${c.nit||""}"></div>
  <div class="field"><label>Teléfono</label><input class="input" name="telefono" value="${c.telefono||""}"></div>
  <div class="field"><label>Dirección</label><input class="input" name="direccion" value="${c.direccion||""}"></div>
  </div><button class="primary-btn mt">Guardar cambios</button></form></div>
  <div class="card mt"><h2>Datos del prototipo</h2><p class="small">Esta versión guarda la información en el navegador mediante localStorage. No es todavía una base de datos Android ni facturación electrónica DIAN.</p><button class="danger-btn mt" onclick="resetDemo()">Restablecer datos de demostración</button></div>`;
}
function resetDemo(){if(confirm("¿Restablecer todos los datos de demostración?")){localStorage.removeItem("makeupAppData");DB=loadData();cart=[];renderView("inicio");toast("Datos restaurados")}}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-view]");if(b){renderView(b.dataset.view);document.querySelector(".sidebar")?.classList.remove("open")}
});
document.getElementById("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
document.getElementById("backupBtn").onclick=()=>{const blob=new Blob([JSON.stringify(DB,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="respaldo-maquillaje.json";a.click();URL.revokeObjectURL(a.href);toast("Copia creada")};
document.addEventListener("submit",e=>{if(e.target.id==="settingsForm"){e.preventDefault();DB.configuracion=Object.fromEntries(new FormData(e.target));saveData();toast("Configuración guardada")}})
renderView("inicio");