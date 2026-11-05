import type { Config } from 'tailwindcss';

// Design tokens: every brand colour comes from the supplied palette image.
// Each family has: 950 (darkest swatch), 900 (dark swatch), 800 (field colour),
// 600 (mid swatch), 500 (brightest swatch). `cream` is the one neutral, used for text.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson: { 950: '#240006', 900: '#5C0008', 800: '#94000F', 600: '#B5001A', 500: '#DB0016' },
        saffron: { 950: '#241400', 900: '#5C2400', 800: '#8F3F00', 600: '#B84A00', 500: '#E06000' },
        plum: { 950: '#1A0014', 900: '#4D0040', 800: '#700050', 600: '#8A0068', 500: '#A8007A' },
        cream: { DEFAULT: '#F6EBDD', muted: '#D9C3B0' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '2px', md: '4px', lg: '6px' },
      spacing: { section: '5rem' },
    },
  },
  plugins: [],
};
export default config;
