const SUPABASE_URL = 'https://xowheygqtyfqkellzheg.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bUbxk8oYtU-5mwa0-REyRw_RSvN9hfw';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);