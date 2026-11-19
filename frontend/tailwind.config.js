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
        // Neumorphic shadows (keeping for fallback)
        neu: "8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.5)",
        "neu-inset": "inset 8px 8px 16px rgba(163, 177, 198, 0.6), inset -8px -8px 16px rgba(255, 255, 255, 0.5)",
        "neu-sm": "4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.5)",
        "neu-lg": "12px 12px 24px rgba(163, 177, 198, 0.6), -12px -12px 24px rgba(255, 255, 255, 0.5)",
        "neu-hover": "6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.5)",
        
        // Glassmorphism shadows (iOS/Telegram style)
        glass: "0 4px 24px rgba(0, 0, 0, 0.08), 0 8px 40px rgba(0, 0, 0, 0.06)",
        "glass-lg": "0 8px 32px rgba(0, 0, 0, 0.1), 0 16px 64px rgba(0, 0, 0, 0.08)",
        "glass-xl": "0 12px 48px rgba(0, 0, 0, 0.12), 0 24px 96px rgba(0, 0, 0, 0.1)",
        "glass-inset": "inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
        "glass-button": "0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)",
        "glass-button-hover": "0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.06)",
        "glass-button-active": "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
        
        // Glow shadows for accents
        "glow-moonstone": "0 0 20px rgba(107, 115, 125, 0.3)",
        "glow-moonstone-lg": "0 0 40px rgba(107, 115, 125, 0.2), 0 0 80px rgba(107, 115, 125, 0.1)",
      },
      colors: {
        // Moonstone color palette - Updated for better contrast/visibility
        moonstone: {
          50: "#F0F1F2",
          100: "#E0E4E8",
          200: "#D0D8E0",  // Main light moonstone
          300: "#B8C4D0",
          400: "#99A8BB",      // Darker for better text visibility
          500: "#7A8CA8",      // Darker for better text visibility
          600: "#5D6E8A",      // Main moonstone - darker for contrast
          700: "#4A576E",
          800: "#3A4454",
          900: "#2D3440",
          950: "#1F2530",
        },
        // Semantic aliases for easy theming
        surface: {
          light: "#FFFFFF",
          "light-hover": "#F0F1F2",
          "glass-light": "rgba(255, 255, 255, 0.75)",
          "glass-border": "rgba(208, 216, 224, 0.6)",
        },
        "surface-dark": {
          DEFAULT: "#1F2530",
          hover: "#2D3440",
          "glass-dark": "rgba(31, 37, 48, 0.75)",
          "glass-border": "rgba(93, 110, 138, 0.4)",
        },
        // Text colors - Updated for better visibility on glass
        text: {
          primary: "#1F2530",
          secondary: "#3A4454",
          tertiary: "#4A576E",  // Darker tertiary for better readability
          inverse: "#FFFFFF",
          "on-glass": "#1F2530",
          "on-glass-dark": "#F0F1F2",
          // Additional text colors for glass backgrounds
          "glass-primary": "#1F2530",
          "glass-secondary": "#3A4454",
          "glass-muted": "#4A576E",
          "glass-placeholder": "#7A8CA8",
        },
        // Accent colors
        accent: {
          blue: "#3B82F6",
          "blue-hover": "#2563EB",
          green: "#10B981",
          "green-hover": "#059669",
          orange: "#F59E0B",
          "orange-hover": "#D97706",
          red: "#EF4444",
          "red-hover": "#DC2626",
          purple: "#8B5CF6",
          "purple-hover": "#7C3AED",
        },
        // Border colors
        border: {
          light: "#D0D8E0",
          DEFAULT: "#B8C4D0",
          dark: "#99A8BB",
          focus: "#3B82F6",
        },
        // Keeping night palette for dark mode
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
        // Legacy neu palette (for gradual migration)
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
        // Moonstone gradients
        'moonstone-gradient': 'linear-gradient(145deg, #D9E0E7 0%, #F5F6F7 100%)',
        'moonstone-gradient-hover': 'linear-gradient(145deg, #C5CFDA 0%, #E8ECEF 100%)',
        'moonstone-gradient-dark': 'linear-gradient(145deg, #2E3236 0%, #1B1E21 100%)',
        'moonstone-gradient-dark-hover': 'linear-gradient(145deg, #42474D 0%, #2E3236 100%)',
        
        // Glass gradients
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
        'glass-button-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 100%)',
        'glass-button-gradient-dark': 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
        
        // Legacy
        'neu-gradient': 'linear-gradient(145deg, #e6e9ef, #ffffff)',
        'neu-gradient-hover': 'linear-gradient(145deg, #ffffff, #e6e9ef)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-lg': '40px',
        'glass-xl': '60px',
      },
      borderRadius: {
        'glass': '16px',
        'glass-lg': '20px',
        'glass-xl': '24px',
        'glass-full': '9999px',
      },
      transitionDuration: {
        'glass': '200ms',
        'glass-slow': '300ms',
      },
      transitionTimingFunction: {
        'glass': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'glass-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}