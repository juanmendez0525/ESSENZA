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
                'Error verificando sesión:',
                error
            );

            window.location.replace('login.html');

            return false;
        }


        // No existe sesión
        if (!data.session) {

            window.location.replace('login.html');

            return false;
        }


        // Existe sesión: verificar perfil
        const usuario = data.session.user;

        const { data: perfil, error: errorPerfil } =
            await supabaseClient
                .from('perfiles')
                .select('id, nombre, rol, activo')
                .eq('id', usuario.id)
                .single();


        // No tiene perfil
        if (errorPerfil || !perfil) {

            await supabaseClient.auth.signOut();

            window.location.replace('login.html');

            return false;
        }


        // Usuario desactivado
        if (!perfil.activo) {

            await supabaseClient.auth.signOut();

            window.location.replace('login.html');

            return false;
        }


        // Guardar información para utilizarla
        // posteriormente dentro de la aplicación.
        window.usuarioActual = usuario;
        window.perfilActual = perfil;


        console.log(
            'Usuario autenticado:',
            perfil.nombre,
            '| Rol:',
            perfil.rol
        );


        return true;

    } catch (error) {

        console.error(
            'Error de autenticación:',
            error
        );

        window.location.replace('login.html');

        return false;
    }
}


// ==========================================
// PROTEGER INDEX.HTML
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        await protegerAplicacion();

    }
);