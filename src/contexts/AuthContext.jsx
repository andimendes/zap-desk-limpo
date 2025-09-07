// src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta função busca o perfil e as roles de um usuário
    const fetchProfileAndRoles = async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        if (profileData) {
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('roles (name)')
            .eq('user_id', user.id);
          if (rolesError) throw rolesError;

          const finalProfile = {
            ...profileData,
            roles: rolesData ? rolesData.map(item => item.roles.name) : []
          };
          setProfile(finalProfile);
        }
      } catch (error) {
        console.error("Erro ao buscar o perfil do usuário:", error.message);
        setProfile(null);
      }
    };

    // Função principal que é executada quando a aplicação carrega
    const initializeSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        await fetchProfileAndRoles(currentSession?.user);
      } catch (error) {
        console.error("Erro ao inicializar a sessão:", error);
      } finally {
        // ESSENCIAL: Garante que o loading termine, aconteça o que acontecer
        setLoading(false);
      }
    };

    initializeSession();

    // Ouve as mudanças de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Atualiza o perfil quando o usuário entra ou sai
        fetchProfileAndRoles(session?.user);
      }
    );

    // Limpa o "ouvinte"
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = { session, profile, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);