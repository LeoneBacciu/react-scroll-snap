import typescript from "rollup-plugin-typescript2";
import filesize from "rollup-plugin-filesize";
import css from "rollup-plugin-import-css";
import pkg from "./package.json";

export default {
  input: "./src/index.tsx",
  output: [
    {
      file: pkg.module,
      format: "esm",
      sourcemap: true,
    },
  ],
  external: ["react", "animated-scroll-to"],
  plugins: [css({ minify: true }), filesize(), typescript()],
};
