// @ts-check

import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import path from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

const compat = new FlatCompat({ baseDirectory: path.dirname(fileURLToPath(import.meta.url)) });

const config = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  compat.config({ extends: ["next/core-web-vitals", "next/typescript"] }),
  prettier,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",
      "prettier/prettier": "error",
    },
  },
  { ignores: ["node_modules", ".turbo", ".next"] },
);

export default config;
