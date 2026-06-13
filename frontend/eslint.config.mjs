import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // We use effects for data fetching (set loading/data on mount and on
      // dependency change), which is a supported pattern for our small app.
      "react-hooks/set-state-in-effect": "off",
      // We intentionally read the current time during render (e.g. to split
      // upcoming vs. past). Not using the React Compiler, so this is safe.
      "react-hooks/purity": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
