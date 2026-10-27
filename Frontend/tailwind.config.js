/** @type {import('tailwindcss').Config} */

// Palette shades that carry theme meaning read their RGB channels from CSS
// variables declared in src/styles/index.css (one set for light, one for dark).
// Every existing utility class (bg-slate-50, text-emerald-700 ...) therefore
// follows the active theme without touching the individual pages.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`
const scale = (family, shades) =>
  Object.fromEntries(shades.map((shade) => [shade, token(`${family}-${shade}`)]))

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        emerald: scale('emerald', [50, 100, 200, 500, 600, 700, 800]),
        red: scale('red', [50, 100, 200, 500, 600, 700, 800]),
        amber: scale('amber', [50, 100, 200, 600, 700, 800]),
        sky: scale('sky', [50, 100, 200, 700, 800]),
        violet: scale('violet', [50, 100, 700]),
        rose: scale('rose', [50, 100, 700]),
      },
    },
  },
  plugins: [],
}
