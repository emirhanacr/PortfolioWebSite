// Tailwind CDN'in yorumlayacağı tema ayarları. cdn.tailwindcss.com script'inden
// SONRA yüklenmesi gerekir, çünkü global "tailwind" objesini genişletiyor.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        base: "#0D0E10",
        panel: "#17181B",
        ink: "#EDEEF0",
        muted: "#8A8D93",
        accent: "#E8792C",
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
};
