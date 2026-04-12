import tseslint from "typescript-eslint";

const config = tseslint.config(
  tseslint.configs.recommended,
  {
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  }
);

export default config;
