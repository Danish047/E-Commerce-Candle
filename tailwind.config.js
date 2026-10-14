/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF7F1',
        wax: '#F3E9DC',
        sand: '#E6D5C0',
        ember: { DEFAULT: '#C8763B', dark: '#A65E2B', light: '#F6E3D2' },
        cocoa: { DEFAULT: '#3B2A20', soft: '#6B5646' },
        sage: '#8A9A7B',
        // Admin panel
        adm: {
          bg: '#EEF0EB',
          panel: '#FFFFFF',
          line: '#E1E3DB',
          soft: '#F6F7F3',
          ink: '#231B16',
          muted: '#6F665E',
          side: '#211A15',
          side2: '#2E251F',
        },
        ok: { DEFAULT: '#5B7A52', soft: '#E6EEE2' },
        warn: { DEFAULT: '#B7801C', soft: '#F8EDD5' },
        bad: { DEFAULT: '#B2453C', soft: '#F7E2DF' },
        info: { DEFAULT: '#4D6B88', soft: '#E1E9F1' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        ui: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        flicker: {
          '0%,100%': { transform: 'scale(1) rotate(-1deg)', opacity: '1' },
          '50%': { transform: 'scale(1.08, 0.94) rotate(1deg)', opacity: '.85' },
        },
        rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        glow: { '0%,100%': { opacity: '.55' }, '50%': { opacity: '.9' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-100%)' } },
        reveal: { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        flicker: 'flicker 1.6s ease-in-out infinite',
        rise: 'rise .22s ease-out both',
        glow: 'glow 3.2s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        reveal: 'reveal .8s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
}
