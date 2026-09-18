async function probarSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('marcas')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error de Supabase:', error);
            alert('❌ Error conectando con Supabase: ' + error.message);
            return;
        }

        console.log('Supabase conectado correctamente:', data);
        alert('✅ ¡Conexión con Supabase correcta!');
    } catch (error) {
        console.error(error);
        alert('❌ No se pudo conectar con Supabase.');
    }
}

probarSupabase();