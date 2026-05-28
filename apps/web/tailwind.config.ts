import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E85D2B', // brand orange
          dark: '#C44A1F',
          light: '#FFF0EB',
        },
        surface: {
          DEFAULT: '#F5F5F5',
        },
        sidebar: {
          DEFAULT: '#FFFFFF',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
          disabled: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          focus: '#E85D2B',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        badge: {
          easy: {
            bg: '#DCFCE7',
            text: '#15803D',
          },
          moderate: {
            bg: '#FEF9C3',
            text: '#A16207',
          },
          hard: {
            bg: '#FEE2E2',
            text: '#B91C1C',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        print: ['Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        md: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '30px'],
        '2xl': ['24px', '32px'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 20px 40px rgba(0,0,0,0.15)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  plugins: [],
};

export default config;
