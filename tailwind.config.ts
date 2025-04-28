import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          light: "#93C5FD",
          dark: "#1D4ED8",
        },
        secondary: {
          DEFAULT: "#10B981",
          light: "#6EE7B7",
          dark: "#047857",
        },
      },
    },
  },
  plugins: [],
};
export default config;
