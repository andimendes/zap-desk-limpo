import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext'; // Precisamos saber quem é o utilizador

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { userAuth } = useAuth(); // Usando o userAuth do seu AuthContext
  const [theme, setTheme] = useState('system'); // 'light', 'dark', ou 'system'

  // Efeito para carregar a preferência do tema da base de dados
  useEffect(() => {
    if (userAuth) {
      const fetchThemePreference = async () => {
        const { data } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', userAuth.id)
          .single();
        
        if (data && data.theme) {
          setTheme(data.theme);
        }
      };
      fetchThemePreference();
    }
  }, [userAuth]);

  // Efeito para aplicar o tema na aplicação
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [theme]);

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
