function renderReportes(){
  const ventas=DB.ventas, total=ventas.reduce((s,v)=>s+v.total,0), costos=ventas.reduce((s,v)=>s+v.items.reduce((a,i)=>a+(getProduct(i.productoId)?.precioCompra||0)*i.cantidad,0),0);
  const methods={};ventas.forEach(v=>methods[v.metodo]=(methods[v.metodo]||0)+v.total);
  const top={};ventas.forEach(v=>v.items.forEach(i=>top[i.productoId]=(top[i.productoId]||0)+i.cantidad));
  const topList=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return `<div class="stats-grid grid">
    <div class="card stat-card"><div class="stat-label">Ventas registradas</div><div class="stat-value">${money(total)}</div><div class="stat-extra">${ventas.length} ventas</div></div>
    <div class="card stat-card"><div class="stat-label">Costo estimado</div><div class="stat-value">${money(costos)}</div></div>
    <div class="card stat-card"><div class="stat-label">Ganancia estimada</div><div class="stat-value text-success">${money(total-costos)}</div></div>
    <div class="card stat-card"><div class="stat-label">Inventario valorizado</div><div class="stat-value">${money(DB.productos.reduce((s,p)=>s+p.stock*p.precioCompra,0))}</div></div>
  </div>
  <div class="two-col grid mt"><div class="card"><div class="section-head"><h2>Productos más vendidos</h2></div>${topList.map(([id,n],idx)=>{const p=getProduct(id);const max=topList[0]?.[1]||1;return `<div class="list-item"><span>${idx+1}. ${p?.nombre||"Producto"}</span><div style="min-width:130px"><b>${n} uds.</b><div class="bar mt"><i style="width:${n/max*100}%"></i></div></div></div>`}).join("")||'<div class="empty">Aún no hay ventas.</div>'}</div>
  <div class="card"><div class="section-head"><h2>Ventas por método</h2></div>${Object.entries(methods).map(([m,v])=>`<div class="list-item"><span>${m}</span><b>${money(v)}</b></div>`).join("")||'<div class="empty">Sin datos.</div>'}</div></div>`;
}