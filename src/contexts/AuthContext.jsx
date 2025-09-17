import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullUserProfile = async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        // PASSO 1: Buscar o perfil básico do utilizador.
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!profileData) {
          setProfile(null);
          return;
        }

        // PASSO 2: Buscar os VÍNCULOS de permissão na tabela user_roles.
        const { data: userRolesLinks, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);
        
        if (userRolesError) throw userRolesError;

        let roleNames = [];

        // PASSO 3: Se encontrarmos vínculos, buscamos os nomes dos cargos em uma CONSULTA SEPARADA E SIMPLES.
        if (userRolesLinks && userRolesLinks.length > 0) {
          const roleIds = userRolesLinks.map(link => link.role_id);
          
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('name') // <-- Consulta simples, sem aninhamento.
            .in('id', roleIds);

          if (rolesError) throw rolesError;

          if (rolesData) {
            roleNames = rolesData.map(role => role.name);
          }
        }
        
        // PASSO 4: Montar o objeto final do perfil com todos os dados.
        const finalProfile = {
          ...profileData,
          roles: roleNames, // Ex: ['Atendente']
          // Como não estamos buscando permissões detalhadas, deixamos este array vazio.
          // O useAccess.jsx vai usar apenas a lista de 'roles'.
          permissions: [] 
        };
        
        console.log('--- Perfil Final Carregado (Lógica Explícita) ---', finalProfile);
        setProfile(finalProfile);
        
      } catch (error) {
        console.error("--- Erro final ao buscar dados completos do perfil ---", error.message);
        setProfile(null);
      }
    };

    const initializeSession = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchFullUserProfile(currentSession.user);
      }
      setLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        fetchFullUserProfile(session?.user);
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