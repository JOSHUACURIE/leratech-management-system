import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    host: true, // allows external hosts
    strictPort: true, // optional, prevents Vite from switching ports
    allowedHosts: [
      'ungiven-nonrespectably-elmo.ngrok-free.dev', // add your ngrok URL here
    ],
  },
})
