import type { Config } from 'tailwindcss'

const plugin = require('tailwindcss/plugin')

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        fontFamily: {
            'roboto': ['Roboto', 'sans-serif'],
        },
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            boxShadow: {
                "custom": '0px 0px 20px 0px rgba(143,143,143,0.1)'
            },
            animation: {
                'spin-clockwise': 'spin-clockwise 1.5s linear infinite',
                'spin-counter-clockwise': 'spin-counter-clockwise 1.5s linear infinite'
            },
            keyframes: {
                'spin-clockwise': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'spin-counter-clockwise': {
                    from: { transform: 'rotate(360deg)' },
                    to: { transform: 'rotate(0deg)' },
                }
            }
        },
    },
    plugins: [
        //@ts-ignore
        plugin(function({ addUtilities }) {
            addUtilities({
                '.no-scrollbar::-webkit-scrollbar': {
                    'display': 'none'
                },
                '.no-scrollbar': {
                    '-ms-overflow-style': 'none',
                    'scrollbar-width': 'none'
                }
            })
        })
    ],
}
export default config
