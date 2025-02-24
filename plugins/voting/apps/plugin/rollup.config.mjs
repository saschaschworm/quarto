// @ts-check
import { nodeResolve as resolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import css from "rollup-plugin-import-css";

/** @type {import("rollup").RollupOptions} */
const config = {
  input: "src/voting.ts",
  output: { dir: "_extensions/voting", format: "iife", name: "RevealVoting", globals: { "pusher-js": "Pusher" } },
  plugins: [
    copy({
      targets: [
        { src: "src/assets/_extension.yaml", dest: "_extensions/voting" },
        { src: "src/vendor/pusher.min.js", dest: "_extensions/voting" },
      ],
    }),
    typescript(),
    resolve({ resolveOnly: ["@quarto-voting/realtime"] }),
    css({ minify: true, output: "voting.css" }),
    terser(),
  ],
  external: ["pusher-js"],
};

export default config;
