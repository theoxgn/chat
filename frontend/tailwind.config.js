/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#2F855A',
            light: '#5c5c94',
            dark: '#363758',
          },
          secondary: '#f0f0f0',
        },
        boxShadow: {
          'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        animation: {
          'bounce-slow': 'bounce 3s linear infinite',
          'spin-slow': 'spin 3s linear infinite',
        },
        zIndex: {
          '60': '60',
          '70': '70',
        },
        spacing: {
          '18': '4.5rem',
          '22': '5.5rem',
          '32': '8rem',
        },
        keyframes: {
          spin: {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          }
        },
      },
    },
    plugins: [],
    variants: {
      extend: {
        opacity: ['group-hover'],
        display: ['group-hover'],
      },
    },
}