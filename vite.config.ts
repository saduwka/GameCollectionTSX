import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Поднимаем лимит предупреждения, потому что firebase chunk сам по себе ~300кБ — это ожидаемо
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // Тяжёлые сторонние пакеты выносим в отдельные чанки, чтобы они кэшировались независимо от кода приложения
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          'react-query': ['@tanstack/react-query'],
          router: ['react-router-dom'],
        },
      },
    },
  },
})
