import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060A12",
          900: "#0A0F1D",
          850: "#0E1528",
          800: "#131C34",
          700: "#1E2C52",
        },
        charcoal: {
          900: "#0D1117",
          800: "#161B22",
          700: "#21262D",
          600: "#30363D",
        },
        electric: {
          400: "#38BDF8",
          500: "#0070F3",
          600: "#0284C7",
        },
        accent: {
          400: "#C084FC",
          500: "#A855F7",
          600: "#8B5CF6",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "vision-mesh": "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};
export default config;
