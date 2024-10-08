const config = {
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    arrowParens: "avoid",
    plugins: ["prettier-plugin-astro"],
    overrides: [
        {
            files: "*.astro",
            options: {
                parser: "astro",
                tabWidth: 4,
            },
        },
        {
            files: "*.md",
            options: {
                tabWidth: 4,
            },
        },
    ],
};

export default config;
