import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta é a função final e definitiva, com uma lógica de busca explícita
    const fetchFullUserProfile = async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        // PASSO 1: Buscar o perfil básico do utilizador. Já sabemos que isto funciona.
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

        // PASSO 2: Buscar os VÍNCULOS de permissão (as ligações na tabela user_roles)
        const { data: userRolesLinks, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);
        
        if (userRolesError) throw userRolesError;

        let roleNames = [];
        let permissionsSet = new Set();

        // PASSO 3: Se encontrarmos vínculos, buscamos os detalhes dos cargos
        if (userRolesLinks && userRolesLinks.length > 0) {
          const roleIds = userRolesLinks.map(link => link.role_id);
          
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('name, permissions')
            .in('id', roleIds);

          if (rolesError) throw rolesError;

          if (rolesData) {
            // Guardamos os nomes dos cargos
            roleNames = rolesData.map(role => role.name);
            // Consolidamos todas as permissões de todos os cargos numa única lista
            rolesData.forEach(role => {
              if (role.permissions && Array.isArray(role.permissions)) {
                role.permissions.forEach(p => permissionsSet.add(p));
              }
            });
          }
        }
        
        // PASSO 4: Montar o objeto final do perfil com todos os dados
        const finalProfile = {
          ...profileData,
          roles: roleNames,
          permissions: Array.from(permissionsSet)
        };
        
        console.log('--- Perfil Final Carregado (Lógica Definitiva e Explícita) ---', finalProfile);
        setProfile(finalProfile);
        
      } catch (error) {
        console.error("--- Erro final ao buscar dados da sessão do utilizador ---", error.message);
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