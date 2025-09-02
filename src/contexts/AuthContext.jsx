// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Começa como true

  useEffect(() => {
    // A função onAuthStateChange é a forma mais robusta de gerir a sessão.
    // Ela é executada uma vez logo no início com a sessão atual (se existir)
    // e depois sempre que houver uma alteração (login, logout, etc.).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        
        let userProfile = null;
        if (session?.user) {
          try {
            // Se há uma sessão, busca o perfil e a role (função)
            const { data, error } = await supabase
              .from('profiles')
              .select(`
                *,
                user_roles (
                  roles ( name )
                )
              `)
              .eq('id', session.user.id)
              .single();

            if (error) throw error;

            if (data) {
              // Extrai a role do objeto aninhado e adiciona ao perfil
              const role = data.user_roles?.[0]?.roles?.name || null;
              userProfile = { ...data, role };
            }
          } catch (error) {
            console.error("AuthContext: Erro ao buscar perfil e role.", error);
          }
        }
        
        setProfile(userProfile);
        // Independentemente do resultado da busca de perfil, o carregamento principal termina aqui.
        setLoading(false);
      }
    );

    // Limpa a subscrição quando o componente é desmontado para evitar fugas de memória
    return () => subscription.unsubscribe();
  }, []); // O array de dependências vazio garante que isto só é configurado uma vez

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