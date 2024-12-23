/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

const COLOR_KEYS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {
            colors({ colors }) {
                const background = { DEFAULT: colors.neutral[950], ...colors.neutral };
                // TODO: To fix
                const backgroundInverted = Object.fromEntries(
                    COLOR_KEYS.map((key, index) => [
                        COLOR_KEYS[COLOR_KEYS.length - 1 - index],
                        background[key],
                    ]),
                );
                const foreground = { DEFAULT: background[50], ...backgroundInverted };

                return {
                    background,
                    foreground,
                    primary: {
                        DEFAULT: colors.rose[500],
                        ...colors.rose,
                    },
                    secondary: {
                        DEFAULT: colors.lime[500],
                        ...colors.lime,
                    },
                    danger: {
                        DEFAULT: colors.red[500],
                        ...colors.red,
                    },
                    warning: {
                        DEFAULT: colors.orange[500],
                        ...colors.orange,
                    },
                    info: {
                        DEFAULT: colors.blue[500],
                        ...colors.blue,
                    },
                    success: {
                        DEFAULT: colors.emerald[500],
                        ...colors.emerald,
                    },
                    ...colors,
                };
            },
            fontFamily: {
                sans: ["Comfortaa Variable", ...defaultTheme.fontFamily.sans],
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
};
