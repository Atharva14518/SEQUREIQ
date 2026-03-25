/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#181818',
        'bg-card': '#1E1E1E',
        'bg-card-2': '#232323',
        'text-1': '#EBDCC4',
        'text-2': '#B6A596',
        'text-3': '#66473B',
        accent: '#DC9F85',
        border: '#66473B',
        divider: '#35211A',
      },
      fontFamily: {
        clash: ['Clash Grotesk', 'sans-serif'],
        general: ['General Sans', 'sans-serif'],
      },
      lineHeight: { '085': '0.85', '088': '0.88' },
      letterSpacing: { tightest: '-0.03em' },
      borderRadius: {
        editorial: '4px',
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'slide-right': 'slideRight 0.6s ease forwards',
        'pulse-border': 'pulseBorder 2s infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseBorder: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(248,81,73,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(248,81,73,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
