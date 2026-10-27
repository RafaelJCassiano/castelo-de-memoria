// Castelo da Memória · configuração
// A chave "anon" é pública por desenho: quem protege seus dados são as regras (RLS) do 01_tabelas.sql.
// NUNCA coloque aqui a chave "service_role" nem a chave privada do VAPID.
window.CASTELO_CONFIG = {
  SUPABASE_URL: 'https://zyxyspjmnpiplilqipge.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eHlzcGptbnBpcGxpbHFpcGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjU2MjksImV4cCI6MjA5MzU0MTYyOX0.Ncl1SAzUczKwUUtKSxGtzkQvqUaPRsdpy28i4IALpjo',
  VAPID_PUBLIC_KEY: 'BDXl-Xch90Z5Wo5R7maK4Hwt15zsGRlpSw_idFXuhz_Vqpr9N9rkACcQBFvcxtbgLWpxyeiDGTwplmAQpfaE2Lw'     // preencha com a chave pública de: npx web-push generate-vapid-keys
};
