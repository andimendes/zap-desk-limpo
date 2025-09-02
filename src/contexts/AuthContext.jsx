// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Iniciando o useEffect...");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("AuthContext: onAuthStateChange disparou. Evento:", _event);
        setSession(session);
        
        let userProfile = null;
        if (session?.user) {
          console.log("AuthContext: Sessão encontrada. A buscar perfil para o user ID:", session.user.id);
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select(`*, user_roles(roles(name))`)
              .eq('id', session.user.id)
              .single();

            if (error) throw error;

            if (data) {
              const role = data.user_roles?.[0]?.roles?.name || null;
              userProfile = { ...data, role };
              console.log("AuthContext: Perfil e role encontrados:", userProfile);
            }
          } catch (error) {
            console.error("AuthContext: Erro ao buscar perfil e role.", error);
          }
        } else {
          console.log("AuthContext: Nenhuma sessão encontrada.");
        }
        
        setProfile(userProfile);
        setLoading(false);
        console.log("AuthContext: Carregamento finalizado.");
      }
    );

    return () => {
      console.log("AuthContext: Limpando a subscrição.");
      subscription.unsubscribe();
    };
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