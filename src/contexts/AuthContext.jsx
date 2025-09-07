// src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          
          // --- LINHA DE DEPURAÇÃO ADICIONADA AQUI ---
          console.log('Perfil Final Carregado no Contexto:', finalProfile);
          // ------------------------------------------

          setProfile(finalProfile);
        }
      } catch (error) {
        console.error("Erro ao buscar o perfil do usuário:", error.message);
        setProfile(null);
      }
    };

    const initializeSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        await fetchProfileAndRoles(currentSession?.user);
      } catch (error) {
        console.error("Erro ao inicializar a autenticação:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        fetchProfileAndRoles(session?.user);
      }
    );

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