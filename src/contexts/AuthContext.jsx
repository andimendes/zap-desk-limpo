// src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- LÓGICA CENTRALIZADA PARA BUSCAR O PERFIL ---
  // Esta função busca o perfil e as roles do usuário e atualiza o estado.
  const fetchProfileAndRoles = async (user) => {
    try {
      if (!user) {
          setProfile(null);
          return;
      }
      
      // Busca o perfil principal do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      // Se encontrou o perfil, busca as roles associadas
      if (profileData) {
        const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles') // Supondo que a tabela de junção se chame 'user_roles'
            .select('roles (name)')
            .eq('user_id', user.id);

        if (rolesError) throw rolesError;
        
        // Combina o perfil com a lista de roles
        const finalProfile = {
          ...profileData,
          roles: rolesData ? rolesData.map(item => item.roles.name) : []
        };
        setProfile(finalProfile);
      }
      
    } catch (error) {
      console.error("Erro ao buscar perfil e roles:", error.message);
      setProfile(null); // Garante que o perfil fique nulo em caso de erro
    }
  };


  useEffect(() => {
    setLoading(true);
    
    // 1. Busca a sessão inicial quando a aplicação carrega
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      // Se já houver uma sessão, busca o perfil
      await fetchProfileAndRoles(session?.user);
      setLoading(false);
    });

    // 2. Ouve as mudanças de autenticação (LOGIN, LOGOUT)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        // Busca o perfil sempre que a sessão mudar
        await fetchProfileAndRoles(session?.user);
        setLoading(false);
      }
    );

    // Limpa o "ouvinte" quando o componente é desmontado
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = { session, profile, loading };

  // Renderiza os componentes filhos apenas quando o carregamento inicial terminar
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);