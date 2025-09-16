import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ LÓGICA DE BUSCA SIMPLIFICADA E CORRIGIDA
    const fetchFullUserProfile = async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        // Faz uma ÚNICA consulta para buscar o perfil e o cargo associado
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select(`
            *,
            roles ( id, name, permissions )
          `)
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Monta o objeto final do perfil com todos os dados
        if (profileData) {
          const finalProfile = {
            ...profileData,
            // Extrai as permissões do cargo para o nível principal do perfil
            permissions: profileData.roles?.permissions || []
          };
          console.log('--- Perfil Final Carregado (Lógica Simplificada) ---', finalProfile);
          setProfile(finalProfile);
        } else {
          setProfile(null);
        }
        
      } catch (error) {
        console.error("--- Erro ao buscar dados da sessão do utilizador ---", error.message);
        setProfile(null);
      }
    };

    const initializeSession = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchFullUserProfile(currentSession.user);
      }
      setLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        fetchFullUserProfile(session?.user);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = { session, profile, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
