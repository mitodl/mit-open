import { defineConfig } from "orval"

export default defineConfig({
  mitOpen: {
    output: {
      mode:   "tags-split",
      target: "src/orval/orval.ts",
      client: "react-query",
      mock:   true
    },
    input: {
      target: "../../schema.yaml"
    },
    hooks: {
      afterAllFilesWrite: "yarn global:fmt-fix"
    }
  }
})
