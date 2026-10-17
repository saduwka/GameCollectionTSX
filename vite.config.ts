import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const rawgProxy = {
  '/api/rawg': {
    target: 'http://127.0.0.1:5001',
    changeOrigin: true,
    rewrite: (path: string) =>
      `/gamecollection-ff71a/europe-west1/rawgProxy${path}`,
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy: rawgProxy },
  preview: { proxy: rawgProxy },
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
