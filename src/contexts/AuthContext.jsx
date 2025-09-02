// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("--- DEBUG: AuthContext useEffect INICIOU ---");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("--- DEBUG: onAuthStateChange disparou. Evento:", _event);
        setSession(session);
        
        let userProfile = null;
        if (session?.user) {
          console.log("--- DEBUG: Sessão encontrada. Tentando buscar perfil para o user ID:", session.user.id);
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select(`*, user_roles(roles(name))`)
              .eq('id', session.user.id)
              .single();

            console.log("--- DEBUG: Resposta da query de perfil:", { data, error });

            if (error) throw error;

            if (data) {
              const role = data.user_roles?.[0]?.roles?.name || null;
              userProfile = { ...data, role };
              console.log("--- DEBUG: Perfil final construído:", userProfile);
            } else {
              console.log("--- DEBUG: Nenhum dado de perfil encontrado para o utilizador.");
            }
          } catch (error) {
            console.error("--- DEBUG: ERRO no bloco try/catch ao buscar perfil.", error);
          }
        } else {
          console.log("--- DEBUG: Nenhuma sessão encontrada.");
        }
        
        setProfile(userProfile);
        setLoading(false);
        console.log("--- DEBUG: Carregamento DEFINIDO PARA FALSE. A aplicação devia aparecer agora. ---");
      }
    );

    return () => {
      console.log("--- DEBUG: Limpando a subscrição do AuthContext. ---");
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