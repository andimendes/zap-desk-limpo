import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        // 1. Busca o perfil básico do utilizador
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!profileData) { setProfile(null); return; }

        // 2. Busca os nomes dos cargos (roles) associados ao utilizador
        const { data: userRolesLinks, error: userRolesError } = await supabase
          .from('user_roles')
          .select('roles ( name )') // Busca o nome do cargo diretamente
          .eq('user_id', user.id);
        
        if (userRolesError) throw userRolesError;

        const roleNames = userRolesLinks ? userRolesLinks.map(link => link.roles.name) : [];
        
        // 3. Monta o objeto final do perfil com os nomes dos cargos
        const finalProfile = {
          ...profileData,
          roles: roleNames, // Ex: ['Atendente']
          // Deixamos as permissões detalhadas de fora por enquanto
          permissions: []
        };
        
        console.log('--- Perfil Simplificado Carregado ---', finalProfile);
        setProfile(finalProfile);
        
      } catch (error) {
        console.error("--- Erro ao buscar dados do perfil ---", error.message);
        setProfile(null);
      }
    };

    const initializeSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user);
      }
      setLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        fetchUserProfile(session?.user);
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