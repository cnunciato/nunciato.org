import typography from "@tailwindcss/typography";
import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                mono: ["Source Code Pro", ...defaultTheme.fontFamily.mono],
                sans: ["Source Sans Pro", ...defaultTheme.fontFamily.sans],
                serif: ["Source Serif Pro", ...defaultTheme.fontFamily.serif],
            },
            colors: {
                basecolor: colors.stone,
                accentcolor: colors.orange,
            },
        },
    },
    plugins: [typography()],
};
