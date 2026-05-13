import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "rgba(255,255,255,0.03)",
        border: "rgba(255,255,255,0.06)",
        "text-primary": "#ffffff",
        "text-secondary": "rgba(255,255,255,0.6)",
        "text-muted": "rgba(255,255,255,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
