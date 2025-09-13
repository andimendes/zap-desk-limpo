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
        // Passo 1: Buscar o perfil do utilizador
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

        // Passo 2: Buscar os VÍNCULOS de permissão diretamente da tabela 'user_roles'
        const { data: userRolesLinks, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);
        
        if (userRolesError) throw userRolesError;

        let roleNames = [];
        if (userRolesLinks && userRolesLinks.length > 0) {
          const roleIds = userRolesLinks.map(link => link.role_id);
          
          // Passo 3: Buscar os NOMES das permissões na tabela 'roles' usando os IDs
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('name')
            .in('id', roleIds);

          if (rolesError) throw rolesError;

          if (rolesData) {
            roleNames = rolesData.map(role => role.name);
          }
        }
        
        // Passo 4: Construir o perfil final
        const finalProfile = {
          ...profileData,
          roles: roleNames
        };
        
        console.log('Perfil Final Carregado no Contexto (Lógica Nova):', finalProfile);
        setProfile(finalProfile);
        
      } catch (error) {
        console.error("Erro ao buscar o perfil do usuário (Lógica Nova):", error.message);
        setProfile(null);
      }
    };

    const initializeSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession?.user) {
            await fetchProfileAndRoles(currentSession.user);
        }
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