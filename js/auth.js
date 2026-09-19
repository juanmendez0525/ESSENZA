// ==========================================
// AUTENTICACIÓN Y PROTECCIÓN DE LA APP
// MAKEUP APP
// ==========================================

async function protegerAplicacion() {

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Error verificando sesión:",
                error
            );

            window.location.replace("login.html");
            return false;
        }

        // No existe sesión
        if (!data.session) {

            window.location.replace("login.html");
            return false;
        }

        // Usuario autenticado
        const usuario = data.session.user;

        // Buscar perfil
        const {
            data: perfil,
            error: errorPerfil
        } = await supabaseClient
            .from("perfiles")
            .select("id, nombre, rol, activo")
            .eq("id", usuario.id)
            .single();

        // No existe perfil
        if (errorPerfil || !perfil) {

            console.error(
                "Error del perfil:",
                errorPerfil
            );

            await supabaseClient.auth.signOut();

            window.location.replace("login.html");
            return false;
        }

        // Usuario desactivado
        if (!perfil.activo) {

            alert(
                "Tu usuario está desactivado. Contacta al administrador."
            );

            await supabaseClient.auth.signOut();

            window.location.replace("login.html");
            return false;
        }

        // Validar rol
        if (
            perfil.rol !== "administrador" &&
            perfil.rol !== "empleado"
        ) {

            console.error(
                "Rol de usuario no válido:",
                perfil.rol
            );

            await supabaseClient.auth.signOut();

            window.location.replace("login.html");
            return false;
        }

        // Guardar usuario y perfil globalmente
        window.usuarioActual = usuario;
        window.perfilActual = perfil;

        console.log(
            "Usuario autenticado:",
            perfil.nombre,
            "| Rol:",
            perfil.rol
        );

        return true;

    } catch (error) {

        console.error(
            "Error de autenticación:",
            error
        );

        window.location.replace("login.html");

        return false;
    }
}


// ==========================================
// PROTEGER INDEX.HTML
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const autorizado =
            await protegerAplicacion();

        if (!autorizado) {
            return;
        }

        // Avisamos a la aplicación que
        // la autenticación terminó correctamente.
        document.dispatchEvent(
            new CustomEvent("usuarioAutenticado")
        );
    }
);