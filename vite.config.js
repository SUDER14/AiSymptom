import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base is '/AiSymptom/' only for GitHub Pages production builds.
// During local dev (npm run dev) it stays '/' so React Router works normally.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/AiSymptom/' : '/',
}))
