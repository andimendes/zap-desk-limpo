// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange é executado na carga inicial e em cada mudança de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        
        let userProfile = null;
        if (session?.user) {
          try {
            // Passo 1: Busca o perfil básico. Esta query é simples e deve funcionar.
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;

            if (profileData) {
              userProfile = { ...profileData, role: null }; // Começa com role nula

              // Passo 2: Busca a função (role) numa query separada e mais segura
              const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('roles(name)')
                .eq('user_id', session.user.id)
                .single();

              // Se encontrar uma role, adiciona ao perfil. Se não, não há problema.
              if (roleData?.roles?.name) {
                userProfile.role = roleData.roles.name;
              }
            }
          } catch (error) {
            console.error("AuthContext: Erro ao buscar perfil completo.", error);
          }
        }
        
        setProfile(userProfile);
        setLoading(false); // O carregamento termina aqui, aconteça o que acontecer.
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = { session, profile, loading, user: session?.user };

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