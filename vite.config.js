// target: 'http://192.168.110.84:81',
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // json-server
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')  // 去掉 /api
      }
    }
  }
})
