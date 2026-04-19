/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Old Money Luxury Green Palette
        primary: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efb2',
          400: '#50c878', // Emerald - main accent
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Deep Forest Greens
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#b8f5cc',
          300: '#7ce8a5',
          400: '#40d07a',
          500: '#1ab358',
          600: '#0f9347',
          700: '#0B3D2E', // Dark forest
          800: '#004B3B', // Deep forest - primary dark
          900: '#022c22',
        },
        // Homico Design System — vermillion brand
        terracotta: {
          50:  '#FEEDE6',
          100: '#FBD3C5',
          200: '#F7B49B',
          300: '#F28764',
          400: '#F06B43',
          500: '#EF4E24',  // primary
          600: '#D13C14',
          700: '#A92B08',
          800: '#7D1E04',
          900: '#501301',
        },
        // Homico Design System — warm paper & ink neutrals
        neutral: {
          50:  '#FAFAF7',  // paper
          100: '#F2F0EB',
          200: '#E3DFD6',
          300: '#C9C3B5',
          400: '#A69F8E',
          500: '#8A8472',
          600: '#5E594C',
          700: '#3D3930',
          800: '#262218',
          900: '#14120E',  // ink
          950: '#0D0B08',
        },
        // Cream — maps to paper neutrals
        cream: {
          50:  '#FAFAF7',
          100: '#F2F0EB',
          200: '#E3DFD6',
          300: '#C9C3B5',
          400: '#A69F8E',
          500: '#8A8472',
        },
        // Dark mode — ink-based warm
        dark: {
          50:  '#4A4336',
          100: '#3D3930',
          200: '#302B22',
          300: '#26231B',
          400: '#1D1B15',
          500: '#14120E',
          600: '#0D0B08',
          700: '#0D0B08',
          800: '#0D0B08',
          900: '#0D0B08',
          // Semantic colors - Softer, lighter dark mode
          bg: '#28282c',        // Main page background - lighter charcoal
          card: '#323236',      // Card backgrounds - soft slate
          elevated: '#3c3c40',  // Elevated elements - visible lift
          surface: '#46464a',   // Surface elements - lighter
          border: '#52525a',    // Borders - clearly visible
          'border-subtle': '#3e3e44', // Subtle borders - still visible
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Georgian', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Fraunces', 'Noto Serif Georgian', 'Georgia', 'serif'],
        display: ['Fraunces', 'Noto Serif Georgian', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        'none': '0',
        'sm': '0',
        'DEFAULT': '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
        '2xl': '0',
        '3xl': '0',
        '4xl': '0',
        // Only these stay rounded (per design system)
        'full': '9999px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 10px 20px -2px rgba(0, 0, 0, 0.02)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'luxury': '0 25px 50px -12px rgba(0, 75, 59, 0.15)',
        'glow': '0 0 40px rgba(80, 200, 120, 0.15)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(0, 75, 59, 0.06)',
        'dark-card': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'dark-elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-glow': '0 0 40px rgba(80, 200, 120, 0.25)',
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #004B3B 0%, #0B3D2E 50%, #022c22 100%)',
        'gradient-cream': 'linear-gradient(180deg, #fefef9 0%, #faf8ed 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #50c878 0%, #22c55e 100%)',
        'gradient-terracotta': 'linear-gradient(135deg, #F06B43 0%, #D13C14 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-up-full': 'slideUpFull 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-subtle': 'floatSubtle 4s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'ken-burns': 'kenBurns 20s ease-out forwards',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'confetti-fall': 'confettiFall 3s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUpFull: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-6px) rotate(3deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
