import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',

    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')

        return path.resolve(
          __dirname,
          'src/assets',
          filename
        )
      }
    },
  }
}

const isMobile = process.env.BUILD_TARGET === 'mobile'

export default defineConfig({
  base: isMobile ? './' : '/splitcloud/',

  plugins: [
    figmaAssetResolver(),

    // The React and Tailwind plugins are both required for Make,
    // even if Tailwind is not being actively used
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports.
  // Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})