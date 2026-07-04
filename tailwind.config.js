/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Inter', 'system-ui', 'sans-serif']
      },
      // Colors resolve through CSS variables defined in index.css, so light/dark
      // (system preference + manual toggle) is handled entirely by the tokens.
      colors: {
        ground: 'var(--ground)',
        window: 'var(--window)',
        sidebar: 'var(--sidebar)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        'accent-soft': 'var(--accent-soft)',
        done: 'var(--done)'
      },
      boxShadow: {
        window: 'var(--shadow)'
      }
    }
  },
  plugins: []
}
