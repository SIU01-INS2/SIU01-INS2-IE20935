import type { Config } from "tailwindcss";
import containerQueries from "@tailwindcss/container-queries";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ["var(--font-roboto)", "sans-serif"],
      },
      colors: {
        "color-interfaz": "var(--rojo-principal)",
        "rojo-oscuro": "var(--rojo-oscuro)",
        "verde-principal": "var(--verde-principal)",
        "azul-principal": "var(--azul-principal)",
        "violeta-principal": "var(--violeta-principal)",
        "naranja-principal": "var(--naranja-principal)  ",
        "amarillo-ediciones": "var(--amarillo-ediciones)",
        "verde-brilloso": "var(--verde-brilloso)",
        "gris-oscuro": "var(--gris-oscuro)",
        "gris-intermedio": "var(--gris-intermedio)",
        "gris-claro": "var(--gris-claro)",
        blanco: "var(--blanco)",
        negro: "var(--negro)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      screens: {
        sxs: "0px",
        xs: "300px",
        sm: "500px",
        md: "768px",
        lg: "976px",
        xl: "1440px",
        "max-xs": {
          max: "300px",
        },
        "max-sm": {
          max: "500px",
        },
        "max-md": {
          max: "768px",
        },
        "max-lg": {
          max: "976px",
        },
        "max-xl": {
          max: "1440px",
        },
        "sxs-only": {
          min: "0px",
          max: "300px",
        },
        "xs-only": {
          min: "300px",
          max: "499px",
        },
        "sm-only": {
          min: "500px",
          max: "767px",
        },
        "md-only": {
          min: "768px",
          max: "975px",
        },
        "lg-only": {
          min: "976px",
          max: "1600px",
        },
        "xl-only": {
          min: "1600px",
        },
        "short-height": {
          raw: "(max-height: 50vw)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [containerQueries, require("tailwindcss-animate")],
};
export default config;
