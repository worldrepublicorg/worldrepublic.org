import { uiKitTailwindPlugin } from "@worldcoin/mini-apps-ui-kit-react";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/mini-apps-ui-kit/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [uiKitTailwindPlugin],
} satisfies Config;
