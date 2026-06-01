// tailwind.config.ts
// Note: This project uses Tailwind v4. Design tokens are defined in globals.css @theme.
// This file is kept for reference and tooling compatibility.
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'green-deep':  '#0F3D2E',
        'green-mid':   '#1F5E46',
        'green-soft':  '#4F6F52',
        'gold':        '#C6A55B',
        'gold-mid':    '#A8873A',
        'gold-dark':   '#8C6A2F',
        'brown-deep':  '#3B2416',
        'brown-mid':   '#4A2F1E',
        'cream':       '#F3EFE8',
        'sage':        '#6E7F6A',
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
