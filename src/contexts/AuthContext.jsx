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
        // 1. Obter a sessão
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          // 2. Obter o perfil básico (sabemos que isto funciona!)
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

          // 3. Obter os cargos (a nova forma, mais robusta)
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('roles (name)') // Pedimos o nome do cargo através da tabela 'roles'
            .eq('user_id', currentSession.user.id);

          if (rolesError) throw rolesError;
          
          // 4. Combinar tudo
          const finalProfile = {
            ...profileData,
            roles: rolesData ? rolesData.map(item => item.roles.name) : []
          };
          
          setProfile(finalProfile);

        } else {
            setProfile(null);
        }
      } catch (error) {
        console.error("AuthContext Error:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Reativamos o listener para que o login/logout funcione em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        // Apenas recarregamos tudo para garantir consistência
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
