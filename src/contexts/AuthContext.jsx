import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // 1. Obter a sessão atual do utilizador
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setSession(currentSession);

        // Se não houver sessão, não há perfil para buscar
        if (!currentSession?.user) {
          setProfile(null);
          return;
        }

        // 2. Buscar o perfil e a função (role) numa única consulta
        // Esta é a correção principal. Pedimos todos os dados de 'profiles'
        // e especificamente a coluna 'role'.
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*') // Seleciona todas as colunas da tabela profiles
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          // Se o perfil não for encontrado, não é um erro crítico, apenas define como nulo
          console.warn('Perfil não encontrado para o utilizador:', profileError.message);
          setProfile(null);
        } else {
          setProfile(profileData);
        }

      } catch (error) {
        console.error("Erro no AuthContext:", error.message);
        setProfile(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Executa a função quando o componente é montado
    fetchUserAndProfile();

    // Fica a "ouvir" por mudanças no estado de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Quando há uma mudança, busca novamente os dados do perfil
      setSession(session);
      fetchUserAndProfile();
    });

    // Limpa a subscrição quando o componente é desmontado
    return () => subscription.unsubscribe();
  }, []);

  const value = { session, profile, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
