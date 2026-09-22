const demoData = {
  productos: [
    {id:1,nombre:"Labial SuperStay",marca:"Maybelline",categoria:"Labiales",referencia:"MAY-SS-01",precioCompra:22000,precioVenta:35000,stock:8,stockMinimo:3,img:"https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=500&q=80"},
    {id:2,nombre:"Base True Match",marca:"L'Oréal",categoria:"Bases",referencia:"LOR-TM-02",precioCompra:31000,precioVenta:48000,stock:4,stockMinimo:3,img:"https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=500&q=80"},
    {id:3,nombre:"Blush Baked",marca:"Milani",categoria:"Rubores",referencia:"MIL-BL-03",precioCompra:34000,precioVenta:52000,stock:2,stockMinimo:3,img:"https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=500&q=80"},
    {id:4,nombre:"Ruby Woo",marca:"MAC",categoria:"Labiales",referencia:"MAC-RW-04",precioCompra:65000,precioVenta:92000,stock:6,stockMinimo:2,img:"https://images.unsplash.com/photo-1591360236480-1f0e2c1e1f4f?auto=format&fit=crop&w=500&q=80"},
    {id:5,nombre:"Delineador Tattoo",marca:"KVD",categoria:"Ojos",referencia:"KVD-TT-05",precioCompra:48000,precioVenta:69000,stock:7,stockMinimo:2,img:"https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=500&q=80"},
    {id:6,nombre:"Corrector Fit Me",marca:"Maybelline",categoria:"Correctores",referencia:"MAY-FM-06",precioCompra:21000,precioVenta:33000,stock:10,stockMinimo:3,img:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80"},
    {id:7,nombre:"Iluminador Soft",marca:"Rare Beauty",categoria:"Iluminadores",referencia:"RB-SF-07",precioCompra:70000,precioVenta:98000,stock:3,stockMinimo:2,img:"https://images.unsplash.com/photo-1512207846876-bb54ef505d86?auto=format&fit=crop&w=500&q=80"},
    {id:8,nombre:"Paleta Nude",marca:"Revolution",categoria:"Sombras",referencia:"REV-ND-08",precioCompra:45000,precioVenta:65000,stock:5,stockMinimo:2,img:"https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=500&q=80"}
  ],
  clientes: [
  {
    id: 1,
    nombre: "Laura Gómez",
    identificacion: "1090123456",
    telefono: "3001234567",
    direccion: "Calle 10 # 20-30",
    email: "laura@email.com"
  },
  {
    id: 2,
    nombre: "María Pérez",
    identificacion: "1090765432",
    telefono: "3017654321",
    direccion: "Carrera 15 # 8-25",
    email: ""
  },
  {
    id: 3,
    nombre: "Ana Martínez",
    identificacion: "1090555121",
    telefono: "3155551212",
    direccion: "Calle 25 # 12-40",
    email: "ana@email.com"
  }
],
  ventas: [
    {id:101,fecha:"2026-09-15",cliente:"Consumidor final",items:[{productoId:1,cantidad:2,precio:35000},{productoId:6,cantidad:1,precio:33000}],descuento:0,metodo:"Nequi",total:103000},
    {id:102,fecha:"2026-09-15",cliente:"Laura Gómez",items:[{productoId:4,cantidad:1,precio:92000}],descuento:2000,metodo:"Efectivo",total:90000},
    {id:103,fecha:"2026-09-14",cliente:"María Pérez",items:[{productoId:2,cantidad:1,precio:48000}],descuento:0,metodo:"Transferencia",total:48000}
  ],
  apartados: [
    {id:201,clienteId:1,fecha:"2026-09-15",fechaLimite:"2026-09-20",items:[{productoId:2,cantidad:1,precio:48000},{productoId:3,cantidad:1,precio:52000}],total:100000,abonado:30000,estado:"Pendiente"},
    {id:202,clienteId:2,fecha:"2026-09-12",fechaLimite:"2026-09-18",items:[{productoId:4,cantidad:1,precio:92000}],total:92000,abonado:92000,estado:"Pagado"}
  ],
  configuracion: {negocio:"Mi Tienda de Maquillaje",telefono:"",direccion:"",nit:""}
};

function loadData(){
  const saved=localStorage.getItem("makeupAppData");
  if(saved) return JSON.parse(saved);
  localStorage.setItem("makeupAppData",JSON.stringify(demoData));
  return JSON.parse(JSON.stringify(demoData));
}
function saveData(){localStorage.setItem("makeupAppData",JSON.stringify(DB));}
let DB=loadData();