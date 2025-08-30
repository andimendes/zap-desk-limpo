import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (profileError) throw profileError;
          if (!profileData) {
              setProfile(null);
              return;
          }

          // --- ESTA É A CORREÇÃO PRINCIPAL ---
          // A lógica para buscar os 'roles' já existia, mas não estava
          // a ser usada para o perfil principal. Agora está.
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('roles (name)')
            .eq('user_id', currentSession.user.id);

          if (rolesError) throw rolesError;
          
          // Combinamos o perfil com os 'roles' corretamente
          const finalProfile = {
            ...profileData,
            // A propriedade 'roles' será uma lista como ['admin']
            roles: rolesData ? rolesData.map(item => item.roles.name) : []
          };
          
          setProfile(finalProfile);

        } else {
            setProfile(null);
        }
      } catch (error) {
        console.error("Erro no AuthContext:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        // Recarregamos tudo para garantir consistência
        initializeAuth();
    });

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
