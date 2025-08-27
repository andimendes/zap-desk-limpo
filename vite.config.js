import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Esta é a configuração padrão e mais simples para um projeto com React.
// Ela apenas ativa o plugin do React, que é o necessário para o projeto funcionar.
export default defineConfig({
  plugins: [react()],
})
