import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#07111f",
          900: "#0b1b31",
          800: "#102743",
        },
        gold: {
          500: "#c59b35",
          600: "#a98227",
        },
      },
    },
  },
  plugins: [],
};

export default config;
