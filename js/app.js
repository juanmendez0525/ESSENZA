const viewMeta={
  inicio:["Inicio","Resumen de tu negocio"],
  ventas:["Nueva venta","Busca productos y cobra"],
  inventario:["Inventario","Productos y existencias"],
  apartados:["Apartados","Pedidos, abonos y entregas"],
  clientes:["Clientes","Tus clientes y su historial"],
  historial:["Historial de ventas","Consulta las ventas registradas"],
  reportes:["Reportes","Resumen de ventas y rentabilidad"],
  configuracion:["Configuración","Datos básicos de tu negocio"],
  mas:["Más","Opciones adicionales"]
};
function openModal(title,content){
  document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="close-btn" onclick="closeModal()">×</button></div>${content}</div></div>`;
}
function closeModal(){document.getElementById("modalRoot").innerHTML=""}
function toast(msg){const r=document.getElementById("toastRoot");r.innerHTML=`<div class="toast">${msg}</div>`;setTimeout(()=>r.innerHTML="",2500)}
function setActive(view){
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
}
function renderView(view="inicio") {

  // ==========================================
  // CONTROL DE ACCESO POR ROL
  // ==========================================

  const rol = window.perfilActual?.rol;

  // Si todavía no conocemos el usuario,
  // no cargamos ninguna vista.
  if (!rol) {
    console.warn("Usuario todavía no autenticado.");
    return;
  }

  // El empleado solamente puede acceder a:
  // inicio, ventas, inventario y apartados.
  const vistasEmpleado = [
    "inicio",
    "ventas",
    "apartados"
  ];

  if (
    rol === "empleado" &&
    !vistasEmpleado.includes(view)
  ) {
    view = "inicio";
  }

  // "Más" solamente tiene sentido para móvil.
  if (view === "mas") {

    if (rol === "administrador") {
      view = "configuracion";
    } else {
      view = "inicio";
    }
  }

  const [title, sub] =
    viewMeta[view] || viewMeta.inicio;

  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageSubtitle").textContent = sub;

  setActive(view);

  const root =
    document.getElementById("appView");

  const renderers = {
    inicio: renderInicio,
    ventas: renderVentas,
    inventario: renderInventario,
    apartados: renderApartados,
    clientes: renderClientes,
    reportes: renderReportes,
    historial: renderHistorial,
    configuracion: renderConfiguracion
  };



  if (view === "clientes") {

  Promise.resolve(
    cargarClientesDesdeSupabase()
  ).then(() => {

    return renderClientes();

  }).then(html => {

    root.innerHTML = html;

  }).catch(error => {

    console.error("Error cargando clientes:", error);

    root.innerHTML = `
      <div class="empty-state">
        No fue posible cargar los clientes.
      </div>
    `;

  });

  return;
}
  
  if (view === "inventario") {
    cargarProductosDesdeSupabase().then(() => { 
      root.innerHTML = renderInventario();
    });
    return;
  }

  if (view === "ventas") {
    cargarProductosDesdeSupabase().then(() => {
      root.innerHTML = renderVentas();
    });
    return;
  }

  Promise.resolve(
    renderers[view]
      ? renderers[view]()
      : renderInicio()
  ).then(html => {
    root.innerHTML = html;
  });
}

function configurarMenuPorRol() {

  const rol = window.perfilActual?.rol;

  if (!rol) {
    return;
  }

  const vistasAdministrativas = [
    "clientes",
    "historial",
    "reportes",
    "configuracion"
  ];

  document.querySelectorAll(
    "#sideNav [data-view]"
  ).forEach(button => {

    const vista = button.dataset.view;

    if (
      rol === "empleado" &&
      vistasAdministrativas.includes(vista)
    ) {
      button.style.display = "none";
    }

  });

  // ==========================================
  // BOTÓN "AGREGAR PRODUCTO"
  // ==========================================

  if (rol === "empleado") {

    document
      .querySelectorAll(
        '[onclick="openProductModal()"]'
      )
      .forEach(button => {

        button.style.display = "none";

      });
  }

}

function renderInicio() {

  const rol = window.perfilActual?.rol;
  const esAdmin = rol === "administrador";

  const today =
    new Date().toISOString().slice(0, 10);

  const todaySales =
    DB.ventas.filter(v => v.fecha === today);

  const sales =
    todaySales.reduce(
      (s, v) => s + Number(v.total || 0),
      0
    );

  const low =
    DB.productos.filter(
      p => p.stock <= p.stockMinimo
    );

  const pending =
    DB.apartados.filter(
      a => a.estado === "Pendiente"
    );


  // ==========================================
  // ACCIONES RÁPIDAS SEGÚN EL ROL
  // ==========================================

  let acciones = `
    <button
      class="quick-btn"
      onclick="renderView('ventas')"
    >
      🛒
      <b>Nueva venta</b>
      <span>Registrar una compra</span>
    </button>

    <button
      class="quick-btn"
      onclick="openApartadoModal()"
    >
      🟡
      <b>Nuevo apartado</b>
      <span>Separar productos</span>
    </button>
  `;


  // Solo administrador puede crear productos
  // y acceder a clientes
  if (esAdmin) {

    acciones += `
      <button
        class="quick-btn"
        onclick="openProductModal()"
      >
        📦
        <b>Agregar producto</b>
        <span>Crear una referencia</span>
      </button>

      <button
        class="quick-btn"
        onclick="renderView('clientes')"
      >
        👥
        <b>Clientes</b>
        <span>Ver tus clientes</span>
      </button>
    `;
  }


  // ==========================================
  // COPIA DE SEGURIDAD
  // ==========================================

  const backupWrapper =
    document.getElementById("backupWrapper");

  if (backupWrapper) {

    backupWrapper.style.display =
      esAdmin ? "" : "none";
  }


  // ==========================================
  // ÚLTIMAS VENTAS
  // ==========================================

  const ultimasVentas = esAdmin
    ? `
      <div class="card">

        <div class="section-head">

          <h2>
            Últimas ventas
          </h2>

          <button
            class="secondary-btn"
            onclick="renderView('historial')"
          >
            Ver historial
          </button>

        </div>

        <div class="list">

          ${
            DB.ventas
              .slice(0, 5)
              .map(v => `
                <div class="list-item">

                  <div>

                    <b>
                      #${v.id} · ${v.cliente}
                    </b>

                    <div class="small">
                      ${v.fecha} · ${v.metodo}
                    </div>

                  </div>

                  <b>
                    ${money(v.total)}
                  </b>

                </div>
              `)
              .join("")
          }

        </div>

      </div>
    `
    : "";


  // ==========================================
  // VISTA PRINCIPAL
  // ==========================================

  return `

    <div class="hero">

      <h2>
        ¡Bienvenido! 👋
      </h2>

      <p>
        Administra tus ventas, maquillaje
        e inventario desde un solo lugar.
      </p>

    </div>


    <div class="stats-grid grid">

      <div class="card stat-card">

        <div class="stat-icon">
          💰
        </div>

        <div class="stat-label">
          Ventas de hoy
        </div>

        <div class="stat-value">
          ${money(sales)}
        </div>

        <div class="stat-extra">
          ${todaySales.length} ventas
        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-icon">
          📦
        </div>

        <div class="stat-label">
          Productos
        </div>

        <div class="stat-value">
          ${DB.productos.reduce(
            (s, p) => s + Number(p.stock || 0),
            0
          )}
        </div>

        <div class="stat-extra">
          ${DB.productos.length} referencias
        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-icon">
          🟡
        </div>

        <div class="stat-label">
          Mis apartados pendientes
        </div>

        <div class="stat-value">
          ${pending.length}
        </div>

        <div class="stat-extra">

          ${money(
            pending.reduce(
              (s, a) =>
                s +
                Number(a.total || 0) -
                Number(a.abonado || 0),
              0
            )
          )}

          pendiente

        </div>

      </div>


      <div class="card stat-card">

        <div class="stat-icon">
          ⚠️
        </div>

        <div class="stat-label">
          Stock bajo
        </div>

        <div class="stat-value">
          ${low.length}
        </div>

        <div class="stat-extra">
          Revisa inventario
        </div>

      </div>

    </div>


    <div class="section-head mt">

      <h2>
        Acciones rápidas
      </h2>

    </div>


    <div class="quick-grid grid">
      ${acciones}
    </div>


    <div class="two-col grid mt">

      ${ultimasVentas}


      <div class="card">

        <div class="section-head">

          <h2>
            ⚠️ Stock bajo
          </h2>

          <button
            class="secondary-btn"
            onclick="renderView('inventario')"
          >
            Inventario
          </button>

        </div>

        <div class="list">

          ${
            low
              .slice(0, 6)
              .map(p => `
                <div class="list-item">

                  <span>
                    ${p.nombre}
                  </span>

                  <span class="badge warning">
                    ${p.stock} uds.
                  </span>

                </div>
              `)
              .join("")
              ||
              `
                <div class="empty">
                  Todo está bien por ahora.
                </div>
              `
          }

        </div>

      </div>

    </div>
  `;
}
function renderConfiguracion(){

  const c = DB.configuracion;

  return `

    <!-- INFORMACIÓN DEL NEGOCIO -->
    <div class="card">

      <h2>Información del negocio</h2>

      <p class="small">
        Estos datos aparecerán en los comprobantes.
      </p>

      <form id="settingsForm" class="mt">

        <div class="form-grid">

          <div class="field">
            <label>Nombre del negocio</label>
            <input
              class="input"
              name="negocio"
              value="${c.negocio}"
            >
          </div>

          <div class="field">
            <label>NIT</label>
            <input
              class="input"
              name="nit"
              value="${c.nit || ""}"
            >
          </div>

          <div class="field">
            <label>Teléfono</label>
            <input
              class="input"
              name="telefono"
              value="${c.telefono || ""}"
            >
          </div>

          <div class="field">
            <label>Dirección</label>
            <input
              class="input"
              name="direccion"
              value="${c.direccion || ""}"
            >
          </div>

        </div>

        <button class="primary-btn mt">
          Guardar cambios
        </button>

      </form>

    </div>


    <!-- EMPLEADOS -->
    <div class="card mt">

      <div class="section-head">

        <div>
          <h2>Empleados</h2>

          <p class="small">
            Administra las cuentas y datos personales de los empleados.
          </p>
        </div>

        <button
          class="primary-btn"
          onclick="openEmpleadoModal()"
        >
          + Crear empleado
        </button>

      </div>

      <div class="empty mt">

        <p>
          Aún no se han cargado los empleados.
        </p>

        <p class="small">
          Aquí aparecerán las cuentas de empleados
          creadas por el administrador.
        </p>

      </div>

    </div>


    <!-- DATOS DEL PROTOTIPO -->
    <div class="card mt">

      <h2>Datos del prototipo</h2>

      <p class="small">
        Esta versión guarda la información en el navegador
        mediante localStorage. No es todavía una base de datos
        Android ni facturación electrónica DIAN.
      </p>

      <button
        class="danger-btn mt"
        onclick="resetDemo()"
      >
        Restablecer datos de demostración
      </button>

    </div>

  `;
}
function resetDemo(){if(confirm("¿Restablecer todos los datos de demostración?")){localStorage.removeItem("makeupAppData");DB=loadData();cart=[];renderView("inicio");toast("Datos restaurados")}}
async function cerrarSesion() {

    const confirmar = confirm(
        "¿Seguro que deseas cerrar sesión?"
    );

    if (!confirmar) {
        return;
    }

    try {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {
            console.error(
                "Error cerrando sesión:",
                error
            );

            toast("No se pudo cerrar sesión.");
            return;
        }

        window.location.replace("login.html");

    } catch (error) {

        console.error(error);

        toast(
            "Ocurrió un error al cerrar sesión."
        );
    }
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-view]");if(b){renderView(b.dataset.view);document.querySelector(".sidebar")?.classList.remove("open")}
});
document.getElementById("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");

const backupBtn =
  document.getElementById("backupBtn");

if (backupBtn) {

  backupBtn.onclick = () => {

    if (
      window.perfilActual?.rol !==
      "administrador"
    ) {
      toast(
        "No tienes permiso para realizar copias."
      );
      return;
    }

    const confirmar = confirm(
      "¿Deseas crear una copia de respaldo?\n\n" +
      "Se descargará un archivo con los datos " +
      "actuales de la aplicación."
    );

    if (!confirmar) {
      return;
    }

    const blob =
      new Blob(
        [JSON.stringify(DB, null, 2)],
        {
          type: "application/json"
        }
      );

    const a =
      document.createElement("a");

    a.href =
      URL.createObjectURL(blob);

    a.download =
      "respaldo-maquillaje.json";

    a.click();

    URL.revokeObjectURL(a.href);

    toast("Copia de respaldo creada");
  };
}
document.addEventListener("submit",e=>{if(e.target.id==="settingsForm"){e.preventDefault();DB.configuracion=Object.fromEntries(new FormData(e.target));saveData();toast("Configuración guardada")}})
document.addEventListener(
  "usuarioAutenticado",
  function () {
    configurarMenuPorRol();
    configurarSidebarRetractil();
    renderView("inicio");
  }
);

const btnCerrarSesion =
  document.getElementById("btnCerrarSesionPrueba");

if (btnCerrarSesion) {
  btnCerrarSesion.onclick = cerrarSesion;
}

function openEmpleadoModal() {

  openModal(
    "Crear empleado",
    `
      <p class="small">
        Registra los datos del empleado y crea su cuenta de acceso.
      </p>

      <div class="form-grid mt">

        <div class="field">
          <label>Nombre completo</label>

          <input
            class="input"
            id="empleadoNombre"
            type="text"
            placeholder="Nombre completo"
            autocomplete="off"
          >
        </div>

        <div class="field">
          <label>Identificación</label>

          <input
            class="input"
            id="empleadoIdentificacion"
            type="text"
            placeholder="Número de identificación"
            autocomplete="off"
          >
        </div>

        <div class="field">
          <label>Teléfono</label>

          <input
            class="input"
            id="empleadoTelefono"
            type="text"
            placeholder="Número de teléfono"
            autocomplete="off"
          >
        </div>

        <div class="field">
          <label>Correo electrónico</label>

          <input
            class="input"
            id="empleadoCorreo"
            type="email"
            placeholder="correo@ejemplo.com"
            autocomplete="off"
          >
        </div>

        <div class="field">
          <label>Contraseña</label>

          <input
            class="input"
            id="empleadoPassword"
            type="password"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
          >
        </div>

        <div class="field">
          <label>Confirmar contraseña</label>

          <input
            class="input"
            id="empleadoPasswordConfirm"
            type="password"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
          >
        </div>

      </div>

      <div class="mt">

        <label class="check-row">

          <input
            id="empleadoActivo"
            type="checkbox"
            checked
          >

          <span>
            Empleado activo
          </span>

        </label>

      </div>

      <div class="modal-actions mt">

        <button
          class="secondary-btn"
          onclick="closeModal()"
          type="button"
        >
          Cancelar
        </button>

        <button
          class="primary-btn"
          onclick="guardarEmpleado()"
          type="button"
        >
          Crear empleado
        </button>

      </div>
    `
  );

}

async function guardarEmpleado() {
  const nombre = document.getElementById("empleadoNombre").value.trim();
  const identificacion = document.getElementById("empleadoIdentificacion").value.trim();
  const telefono = document.getElementById("empleadoTelefono").value.trim();
  const correo = document.getElementById("empleadoCorreo").value.trim().toLowerCase();
  const password = document.getElementById("empleadoPassword").value;
  const passwordConfirm = document.getElementById("empleadoPasswordConfirm").value;
  const activo = document.getElementById("empleadoActivo")?.checked ?? true;

  if (!nombre) {
    toast("Ingresa el nombre completo.");
    return;
  }

  if (!identificacion) {
    toast("Ingresa la identificación.");
    return;
  }

  if (!correo) {
    toast("Ingresa el correo electrónico.");
    return;
  }

  if (!password) {
    toast("Ingresa una contraseña.");
    return;
  }

  if (password.length < 6) {
    toast("La contraseña debe tener mínimo 6 caracteres.");
    return;
  }

  if (password !== passwordConfirm) {
    toast("Las contraseñas no coinciden.");
    return;
  }

  try {
    console.log("Creando empleado:", {
      nombre,
      identificacion,
      telefono,
      correo,
      activo
    });

    const { data, error } = await supabaseClient.functions.invoke(
      "crear-empleado",
      {
        body: {
          nombre,
          identificacion,
          telefono,
          correo,
          password,
          activo
        }
      }
    );

    if (error) {
      console.error("ERROR COMPLETO DE EDGE FUNCTION:", error);

      // Intentar leer el mensaje real enviado por la Edge Function
      if (error.context) {
        try {
          const detalle = await error.context.json();

          console.error(
            "RESPUESTA REAL DE LA EDGE FUNCTION:",
            detalle
          );

          toast(
            detalle?.error ||
            detalle?.message ||
            "La Edge Function rechazó la creación."
          );

          return;

        } catch (e) {
          console.error(
            "No se pudo leer la respuesta de la Edge Function:",
            e
          );
        }
      }

      toast(
        error.message ||
        "No se pudo crear el empleado."
      );

      return;
    }

    console.log(
      "RESPUESTA DE crear-empleado:",
      data
    );

    if (!data?.ok) {
      console.error(
        "La Edge Function respondió con error:",
        data
      );

      toast(
        data?.error ||
        "No se pudo crear el empleado."
      );

      return;
    }

    toast("Empleado creado correctamente.");
    closeModal();

  } catch (error) {
    console.error(
      "ERROR INESPERADO CREANDO EMPLEADO:",
      error
    );

    toast(
      error?.message ||
      "Ocurrió un error al crear el empleado."
    );
  }
}

function configurarSidebarRetractil() {
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.getElementById("sidebarToggle");

  if (!sidebar || !toggle) return;

  toggle.onclick = function () {

    sidebar.classList.toggle("collapsed");

    const estaContraido =
      sidebar.classList.contains("collapsed");

    toggle.textContent =
      estaContraido ? "▶" : "◀";

    toggle.title =
      estaContraido
        ? "Expandir menú"
        : "Contraer menú";
  };
}