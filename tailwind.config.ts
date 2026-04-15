import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Prox design system
        'prox-bg':        '#0e1218',   // primary surface — dark navy-teal
        'prox-elevated':  '#141c24',   // raised cards, message bubbles
        'prox-card':      '#1a2332',   // active states, badges
        'prox-border':    '#1e2b3a',   // subtle borders
        'prox-border-2':  '#243040',   // slightly stronger border
        'prox-text':      '#f0f4f8',   // primary text
        'prox-muted':     '#8892a4',   // secondary text
        'prox-dim':       '#4a5568',   // placeholder / very muted
        'prox-accent':    '#5eead4',   // teal accent (active indicators)
        'prox-accent-dim':'#1a3a38',   // accent background tint
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
    },
  },
  plugins: [],
}

export default config
