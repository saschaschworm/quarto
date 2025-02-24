/** @type {import("prettier").Config} */
const config = {
  printWidth: 120,
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      options: {
        plugins: ["prettier-plugin-tailwindcss"],
        tailwindFunctions: ["tv"],
      },
    },
  ],
};

export default config;
