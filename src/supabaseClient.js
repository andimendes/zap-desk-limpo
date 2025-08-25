import { createClient } from '@supabase/supabase-js'

// Pega a URL e a Chave Anon das variáveis de ambiente que configuramos
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria e exporta o cliente do Supabase para ser usado em outros lugares do app
export const supabase = createClient(supabaseUrl, supabaseKey)
