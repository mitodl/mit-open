import {
  generateSchemaTypes,
  generateReactQueryComponents
} from "@openapi-codegen/typescript"
import { defineConfig } from "@openapi-codegen/cli"
export default defineConfig({
  open: {
    from: {
      relativePath: "./schema.yaml",
      source:       "file"
    },
    outputDir: "src/openapi-codegen",
    to:        async context => {
      const filenamePrefix = "open"
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix
      })
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles
      })
    }
  }
})
