import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndData = async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        // Consulta Otimizada com nomes mais claros
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*, user_roles!inner(roles!inner(name, permissions))') // Alteração de nome aqui para clareza
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profileData) {
          const rolesList = profileData.user_roles.map(item => item.roles.name);
          const permissionsSet = new Set();
          profileData.user_roles.forEach(item => {
            if (item.roles.permissions && Array.isArray(item.roles.permissions)) {
              item.roles.permissions.forEach(p => permissionsSet.add(p));
            }
          });
          const permissionsList = Array.from(permissionsSet);
          
          const finalProfile = {
            ...profileData,
            roles: rolesList,
            permissions: permissionsList
          };
          
          console.log('--- Perfil Final Carregado (Lógica Definitiva) ---', finalProfile);
          setProfile(finalProfile);
        }
      } catch (error) {
        console.error("--- Erro ao buscar dados da sessão do utilizador ---", error.message);
        setProfile(null);
      }
    };

    const initializeSession = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchProfileAndData(currentSession.user);
      }
      setLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        fetchProfileAndData(session?.user);
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