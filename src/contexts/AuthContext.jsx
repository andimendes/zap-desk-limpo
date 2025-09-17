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

        const { data: userRolesLinks, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);
        
        if (userRolesError) throw userRolesError;

        let roleNames = [];
        let permissionsSet = new Set();

        if (userRolesLinks && userRolesLinks.length > 0) {
          const roleIds = userRolesLinks.map(link => link.role_id);
          
          // Busca os cargos e as permissões associadas a eles
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('name, permissions:permissions ( name )') // Assumindo uma tabela 'permissions' e uma de junção 'role_permissions'
            .in('id', roleIds);

          if (rolesError) throw rolesError;

          if (rolesData) {
            roleNames = rolesData.map(role => role.name);
            rolesData.forEach(role => {
              if (role.permissions && Array.isArray(role.permissions)) {
                // Supondo que permissions é uma lista de objetos { name: 'permissao:acao' }
                role.permissions.forEach(p => permissionsSet.add(p.name));
              }
            });
          }
        }
        
        const finalProfile = {
          ...profileData,
          roles: roleNames,
          permissions: Array.from(permissionsSet)
        };
        
        console.log('--- Perfil Final Carregado ---', finalProfile);
        setProfile(finalProfile);
        
      } catch (error) {
        console.error("--- Erro ao buscar dados completos do perfil ---", error.message);
        setProfile(null);
      }
    };

    const initializeSession = async () => {
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