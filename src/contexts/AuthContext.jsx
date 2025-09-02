// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão inicial para saber se o utilizador já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // O setLoading(false) será chamado dentro do onAuthStateChange
    });

    // Ouve as mudanças de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          // Se houver uma sessão, busca o perfil correspondente
          const { data, error } = await supabase
            .from('profiles')
            .select('*') // Certifique-se de que a coluna 'role' está aqui
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Erro ao buscar perfil:", error);
            setProfile(null);
          } else {
            setProfile(data);
          }
        } else {
          // Se não houver sessão (logout), limpa o perfil
          setProfile(null);
        }
        
        // Marca o carregamento como concluído
        setLoading(false);
      }
    );

    // Limpa o "ouvinte" quando o componente é desmontado
    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    profile,
    loading,
    user: session?.user // Adicionamos um atalho para 'user' para facilitar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider> // <-- A CORREÇÃO ESTÁ AQUI
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};