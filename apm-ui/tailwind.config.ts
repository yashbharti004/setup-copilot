import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        background: "#050507",
        surface: {
          50: "#1a1d28",
          100: "#131620",
          200: "#0e1018",
          300: "#0c0d14",
          DEFAULT: "#0c0d14",
        },
        accent: {
          DEFAULT: "#38bdf8",
          hover: "#0284c7",
          subtle: "rgba(56, 189, 248, 0.12)",
        },
        status: {
          success: "#34d399",
          warning: "#fbbf24",
          danger: "#fb7185",
          gated: "#c084fc",
          unknown: "#94a3b8",
        },
        obsidian: {
          950: "#050507",
          900: "#090a0f",
          850: "#0c0d14",
          800: "#12141e",
          700: "#1e2230",
          600: "#2d3348",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        glow: "0 0 25px -5px rgba(56, 189, 248, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
