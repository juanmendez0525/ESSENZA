// =====================================================
// HISTORIAL DE VENTAS
// ESSENZA Ventas & Inventario
// =====================================================

async function cargarHistorialVentas() {

  // Seguridad adicional en el frontend
  if (window.perfilActual?.rol !== "administrador") {
    toast("No tienes permiso para ver el historial de ventas.");
    return;
  }

  try {

    const { data, error } = await supabaseClient
      .from("ventas")
      .select(`
        id,
        fecha,
        empleado_id,
        identificacion_cliente,
        telefono_cliente,
        direccion_cliente,
        descuento,
        descripcion_descuento,
        metodo,
        total,
        created_at
      `)
      .order("fecha", { ascending: false });

    if (error) {
      console.error(
        "Error cargando historial de ventas:",
        error
      );

      toast("No se pudo cargar el historial de ventas.");
      return;
    }

    console.log(
      "Ventas cargadas:",
      data
    );

    return data || [];

  } catch (error) {

    console.error(
      "Error inesperado cargando historial:",
      error
    );

    toast("Ocurrió un error al cargar el historial.");
  }
}