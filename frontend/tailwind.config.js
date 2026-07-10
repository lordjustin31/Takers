/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Spline Sans", "sans-serif"],
      },
      boxShadow: {
        // Neumorphic shadows
        neu: "8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.5)",
        "neu-inset": "inset 8px 8px 16px rgba(163, 177, 198, 0.6), inset -8px -8px 16px rgba(255, 255, 255, 0.5)",
        "neu-sm": "4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.5)",
        "neu-lg": "12px 12px 24px rgba(163, 177, 198, 0.6), -12px -12px 24px rgba(255, 255, 255, 0.5)",
        "neu-hover": "6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.5)",
        glow: "0 0 20px rgba(59, 130, 246, 0.4)",
        "glow-blue": "0 4px 24px rgba(59, 130, 246, 0.3)",
        glass: "0 10px 40px rgba(4, 8, 16, 0.35)",
      },
      colors: {
        night: {
          900: "#0a0e14",
          800: "#0f141d",
          700: "#141b27",
          600: "#1a2230",
        },
        mint: {
          400: "#78ffd6",
          500: "#39f3bd",
        },
        ember: {
          400: "#ff8b5d",
          500: "#ff6a3d",
        },
        // Neumorphic palette
        neu: {
          50: "#f0f4f8",
          100: "#e1e8ed",
          200: "#d1dce5",
          300: "#c1d0dd",
          400: "#b1c4d5",
          500: "#a3b1c6",
          600: "#8899aa",
          700: "#6d7d8e",
          800: "#525f6d",
          900: "#37404c",
        },
      },
      backgroundImage: {
        'neu-gradient': 'linear-gradient(145deg, #e6e9ef, #ffffff)',
        'neu-gradient-hover': 'linear-gradient(145deg, #ffffff, #e6e9ef)',
      },
    },
  },
  plugins: [],
}

