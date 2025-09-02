// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange é a forma mais robusta de gerir a sessão.
    // Ele é executado uma vez no início com a sessão atual e depois em cada alteração.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        
        let userProfile = null;
        if (session?.user) {
          try {
            // Passo 1: Busca o perfil básico do utilizador
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;

            // Passo 2: Busca a função (role) através da tabela de ligação 'user_roles'
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('roles(name)') // Busca o nome da função na tabela 'roles'
              .eq('user_id', session.user.id)
              .single(); // Assumimos que cada utilizador tem apenas uma função

            // A 'role' pode não existir, o que não é um erro fatal.
            if (roleError) {
              console.warn("Utilizador não tem uma função (role) definida.");
            }
            
            // Passo 3: Combina os dados, adicionando a 'role' ao objeto do perfil
            const roleName = roleData?.roles?.name || null;
            userProfile = { ...profileData, role: roleName };
            
          } catch (error) {
            console.error("AuthContext: Erro ao buscar o perfil completo.", error);
          }
        }
        
        setProfile(userProfile);
        setLoading(false); // O carregamento termina aqui, independentemente do resultado
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