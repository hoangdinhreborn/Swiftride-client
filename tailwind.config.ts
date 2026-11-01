import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        taxi: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
          hover: "#EAB308",
        },
        pixel: {
          bg: "#F8FAFC",
          panel: "#FFFFFF",
          border: "#0F172A",
          muted: "#64748B",
          dark: "#0F172A",
          yellow: "#FBBF24",
          green: "#10B981",
          red: "#EF4444",
          orange: "#F97316",
          blue: "#3B82F6",
        },
      },
      boxShadow: {
        pixel: "3px 3px 0px 0px #0F172A",
        "pixel-sm": "2px 2px 0px 0px #0F172A",
        "pixel-lg": "5px 5px 0px 0px #0F172A",
        "pixel-hover": "4px 4px 0px 0px #0F172A",
        "pixel-active": "1px 1px 0px 0px #0F172A",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        mono: ["var(--font-heading)", "monospace"],
        pixel: ["var(--font-heading)", "monospace"],
      },
      borderWidth: {
        pixel: "2px",
        "pixel-thick": "3px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
