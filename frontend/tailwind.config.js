/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#464775',
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
        }
      },
    },
    plugins: [],
}