import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#f8faf9",
          elevated: "#ffffff",
        },
        foreground: "#1c1917",
        muted: "#78716c",
        "rose-med": {
          DEFAULT: "#f9a8d4",
          dark: "#ec4899",
        },
        water: {
          DEFAULT: "#38bdf8",
          dark: "#0ea5e9",
        },
        "emerald-nut": {
          DEFAULT: "#34d399",
          dark: "#10b981",
        },
        "violet-ai": {
          DEFAULT: "#a78bfa",
          dark: "#8b5cf6",
        },
        border: "#e7e5e4",
      },
      fontFamily: {
        sans: [
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
