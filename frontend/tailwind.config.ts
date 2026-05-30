import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        forest: "#10251d",
        moss: "#536b3f",
        pine: "#204c3a",
        ember: "#d66b2d",
        cloud: "#f7f5ef",
        ink: "#17211c"
      },
      boxShadow: {
        soft: "0 22px 70px rgba(16, 37, 29, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
