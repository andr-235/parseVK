import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          sidebar: 'var(--bg-sidebar)',
          'sidebar-hover': 'var(--bg-sidebar-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          light: 'var(--text-light)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          info: 'var(--accent-info)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          danger: 'var(--accent-danger)',
        },
        shadow: 'var(--shadow)',
      },
      borderRadius: {
        card: 'var(--card-border-radius)',
      },
      boxShadow: {
        'soft-sm': '0 2px 4px var(--shadow)',
        'soft-md': '0 12px 30px -20px var(--shadow)',
        'soft-lg': '0 18px 34px -18px var(--shadow)',
      },
    },
  },
  plugins: [],
}

export default config
