import type { Config } from 'tailwindcss';

// Design tokens: every brand colour comes from the supplied palette image.
// Each family has: 950 (darkest swatch), 900 (dark swatch), 800 (field colour),
// 600 (mid swatch), 500 (brightest swatch). `cream` is the one neutral, used for text.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base Theme Colors:
        // Base background: #4D2A00
        // Mid tone: #CC6F00
        // Bright accent: #FF933E
        base: {
          bg: '#4D2A00',
          surface: '#5E3400',
          border: '#7A4300',
          mid: '#CC6F00',
          bright: '#FF933E',
        },
        crimson: {
          950: '#4D2A00', // Entire base bg of website: #4D2A00
          900: '#5E3400', // Card surfaces & containers
          800: '#7A4300', // Element borders & cards
          700: '#995400', // Active borders & dividers
          600: '#B86400', // Hover states
          500: '#CC6F00', // Mid primary action: #CC6F00
        },
        saffron: {
          950: '#3D2100',
          900: '#4D2A00', // Base dark: #4D2A00
          800: '#7A4300',
          700: '#995400',
          600: '#B86400',
          500: '#CC6F00', // Mid accent: #CC6F00
          400: '#FF933E', // Bright highlight: #FF933E
          300: '#FFAF6E',
        },
        plum: {
          950: '#3D2100',
          900: '#4D2A00',
          800: '#5E3400',
          700: '#7A4300',
          600: '#CC6F00',
          500: '#FF933E',
        },
        cream: {
          DEFAULT: '#FFF5EB',
          muted: '#E6D3BF',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        samarkan: ['Samarkan', '"Yatra One"', 'Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: { DEFAULT: '2px', md: '4px', lg: '6px' },
      spacing: { section: '5rem' },
    },
  },
  plugins: [],
};
export default config;
