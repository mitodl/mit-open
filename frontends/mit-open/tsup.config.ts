import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/foo.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ["api"],
})
