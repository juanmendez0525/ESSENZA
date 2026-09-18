// ==========================================
// LOGIN - MAKEUP APP
// ==========================================

const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');


// Mostrar mensaje
function mostrarMensaje(mensaje) {
    loginMessage.textContent = mensaje;
}


// Limpiar mensaje
function limpiarMensaje() {
    loginMessage.textContent = '';
}


// Verificar si ya existe una sesión
async function verificarSesion() {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error('Error verificando sesión:', error);
        return;
    }

    if (data.session) {

        // Ya hay una sesión iniciada.
        // Enviamos directamente a la aplicación.
        window.location.replace('index.html');

    }
}


// Iniciar sesión
loginForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    limpiarMensaje();

    const correo = document
        .getElementById('email')
        .value
        .trim();

    const password = document
        .getElementById('password')
        .value;


    if (!correo || !password) {

        mostrarMensaje(
            'Ingresa tu correo y contraseña.'
        );

        return;
    }


    loginButton.disabled = true;
    loginButton.textContent = 'Ingresando...';


    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: correo,
                password: password
            });


        if (error) {

            console.error('Error de login:', error);

            mostrarMensaje(
                '❌ Credenciales inválidas. Verifica tu correo y contraseña.'
            );

            // Limpiar solamente la contraseña.
            document.getElementById('password').value = '';

            document.getElementById('password').focus();

            return;
        }


        if (!data.session) {

            mostrarMensaje(
                'No se pudo iniciar la sesión. Intenta nuevamente.'
            );

            return;
        }


        // Verificar que el usuario tenga perfil
        const { data: perfil, error: errorPerfil } =
            await supabaseClient
                .from('perfiles')
                .select('id, nombre, rol, activo')
                .eq('id', data.user.id)
                .single();


        if (errorPerfil || !perfil) {

            console.error(
                'ERROR REAL DEL PERFIL:',
                errorPerfil
            );
        
            await supabaseClient.auth.signOut();
        
            mostrarMensaje(
                'Error del perfil: ' +
                (errorPerfil?.message || 'No se encontró el perfil.')
            );
        
            return;
        }


        if (!perfil.activo) {

            await supabaseClient.auth.signOut();

            mostrarMensaje(
                'Este usuario está desactivado.'
            );

            return;
        }


        // Login correcto
        loginButton.textContent = 'Acceso correcto';

        window.location.replace('index.html');


    } catch (error) {

        console.error(error);

        mostrarMensaje(
            'Ocurrió un error. Intenta nuevamente.'
        );

    } finally {

        loginButton.disabled = false;

        if (loginButton.textContent === 'Ingresando...') {
            loginButton.textContent = 'Ingresar';
        }

    }

});


// Ejecutar al abrir login.html
verificarSesion();