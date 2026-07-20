import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // served from https://titaniumbones.github.io/so-shreds/;
  // the Capacitor iOS shell serves from its own root, so its build uses relative paths
  base: process.env.CAP_BUILD ? './' : '/so-shreds/',
})
