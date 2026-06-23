import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "node_modules/**",
    "build/**",
    "static/vendor/**",
    "dist/**",
  ]),
]);

export default eslintConfig;
