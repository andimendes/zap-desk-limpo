// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRole = async (user) => {
      try {
        // 1. Busca os dados básicos do perfil do utilizador
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // 2. Busca a função (role) do utilizador através da tabela de ligação 'user_roles'
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('roles (name)') // Busca o nome da função na tabela 'roles'
          .eq('user_id', user.id)
          .single(); // Assumimos que cada utilizador tem apenas uma função

        if (roleError) {
            // Se não encontrar uma role, não é um erro fatal. O utilizador pode não ter uma.
            console.warn("Utilizador não tem uma função (role) definida:", roleError.message);
            setProfile({ ...profileData, role: null }); // Define a role como nula
        } else {
            // 3. Combina os dados do perfil com a função encontrada
            const finalProfile = {
              ...profileData,
              role: roleData ? roleData.roles.name : null, // Extrai o nome da função
            };
            setProfile(finalProfile);
        }

      } catch (error) {
        console.error("Erro ao montar o perfil completo do utilizador:", error);
        setProfile(null);
      }
    };

    // Busca a sessão na primeira vez que a aplicação carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserAndRole(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    
    // Ouve por futuras mudanças de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          setLoading(true);
          await fetchUserAndRole(newSession.user);
          setLoading(false);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    profile,
    loading,
    user: session?.user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};