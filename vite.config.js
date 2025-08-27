import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Importar o módulo 'path' do Node.js

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Adicionar a configuração 'resolve' para criar o alias
  resolve: {
    alias: {
      // O símbolo '@' agora vai apontar para o diretório 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
})
