// src/contexts/AuthContext.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      // 1. Pega a sessão atual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // 2. Se houver sessão, busca o perfil
      if (currentSession?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error("Erro ao buscar perfil na carga inicial:", profileError);
          setProfile(null);
        } else {
          setProfile(profileData);
        }
      }
      
      // 3. Independentemente do resultado, o carregamento inicial termina aqui
      setLoading(false);
    };

    fetchSessionAndProfile();

    // 4. Ouve por futuras mudanças (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Quando o estado muda, simplesmente atualiza a sessão.
        // O perfil será buscado novamente se a página for recarregada ou se a lógica for acionada em outro lugar.
        // Para a nossa necessidade, apenas atualizar a sessão é suficiente e mais estável.
        setSession(newSession);
        
        // Se o utilizador fizer logout, limpa o perfil.
        if (!newSession) {
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