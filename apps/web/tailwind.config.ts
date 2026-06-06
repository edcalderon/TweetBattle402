import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11100e",
        paper: "#f2efe5",
        acid: "#d9ff52",
        ember: "#ff5b35",
        mon: "#8f7cff",
      },
      boxShadow: {
        hard: "5px 5px 0 #11100e",
        "hard-acid": "5px 5px 0 #d9ff52",
      },
      animation: {
        "ticker-left": "ticker-left 28s linear infinite",
        "pulse-ring": "pulse-ring 2.2s ease-out infinite",
        rise: "rise .65s cubic-bezier(.2,.7,.2,1) both",
      },
      keyframes: {
        "ticker-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(217,255,82,.35)" },
          "100%": { boxShadow: "0 0 0 14px rgba(217,255,82,0)" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
