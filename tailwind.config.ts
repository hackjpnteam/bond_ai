import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    container: { 
      center: true, 
      padding: "1rem", 
      screens: { "2xl": "1200px" } 
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui"],
        serif: ["var(--font-serif)", "Georgia"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        bond: {
          pink: '#FF5E9E',
          cream: '#FFF3F8',
          pinkDark: '#E8478B'
        },
        ash: {
          bg: "#F5ECE2",       // クリーミーな背景
          surface: "#F8F1E9",   // カード面
          surface2: "#EEE2D7",  // サブ面
          text: "#1F1C1A",      // 柔らかい黒
          muted: "#6F6A67",     // 補助テキスト
          line: "#E7D8CA",      // 枠線
          // アクセント（虹ぼかし用）
          pink: "#E8A6C9",
          peach: "#F7C7AF",
          yellow: "#F3E6A3",
          mint: "#BEE6D6",
          teal: "#9CD2CF",
          lilac: "#C8B6E2",
        },
      },
      boxShadow: {
        soft: "0 1px 0 rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      backgroundImage: {
        // ヒーローの虹色ぼかし
        "hero-gradient":
          "radial-gradient(1200px 600px at 0% 0%, rgba(232,166,201,0.55), transparent 55%), " +
          "radial-gradient(1000px 500px at 100% 10%, rgba(156,210,207,0.45), transparent 55%), " +
          "radial-gradient(900px 500px at 50% 100%, rgba(247,199,175,0.5), transparent 50%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/line-clamp")],
} satisfies Config;