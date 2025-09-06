import { useState, useEffect } from 'react';

// Este hook atrasa a atualização de um valor. É útil para evitar
// buscas excessivas no banco de dados enquanto o utilizador digita.
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    // Limpa o temporizador se o valor mudar antes do delay terminar
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}