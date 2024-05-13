module.exports = {
  extends: [
    "eslint-config-mitodl",
    "eslint-config-mitodl/jest",
    "plugin:import/typescript",
    "plugin:mdx/recommended",
    "prettier",
  ],
  plugins: ["testing-library", "import"],
  ignorePatterns: [
    "**/build/**",
    "ol-ckeditor-2/dist",
    "github-pages",
    "storybook-static",
  ],
  settings: {
    "import/resolver": {
      typescript: {
        project: "*/tsconfig.json",
      },
    },
  },
  rules: {
    ...restrictedImports({
      patterns: [
        {
          group: ["@mui/material*", "@mui/lab/*"],
          message:
            "Please use 'ol-components' isInterfaceDeclaration; Direct use of @mui/material is limited to ol-components.",
        },
      ],
    }),
    "@typescript-eslint/triple-slash-reference": [
      "error",
      {
        path: "never",
        types: "prefer-import",
        lib: "never",
      },
    ],
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/src/setupJest.ts",
          "jest-shared-setup.ts",
          "**/test-utils/**",
          "**/test-utils/**",
          "**/webpack.config.js",
          "**/webpack.exports.js",
          "**/postcss.config.js",
          "**/*.stories.ts",
          "**/*.stories.tsx",
          "**/*.mdx",
          "e2e_testing/**/*.ts",
        ],
      },
    ],
    "import/no-duplicates": "error",
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          {
            target: "**/{components,utilities}/**",
            from: "**/{pages,page-components,services}/**",
            message:
              "Import breaks component hierarchy. See https://github.com/mitodl/mit-open/blob/main/docs/architecture/front-end-component-structure.md#module-boundary-and-importexport-rules",
          },
          {
            target: "**/page-components/**",
            from: "**/pages/**",
            message:
              "Import breaks component hierarchy. See https://github.com/mitodl/mit-open/blob/main/docs/architecture/front-end-component-structure.md#module-boundary-and-importexport-rules",
          },
        ],
      },
    ],
    quotes: ["error", "double", { avoidEscape: true }],
    "no-restricted-syntax": [
      "error",
      /**
       * See https://eslint.org/docs/latest/rules/no-restricted-syntax
       *
       * The selectors use "ES Query", a css-like syntax for AST querying. A
       * useful tool is  https://estools.github.io/esquery/
       */
      {
        selector:
          "Property[key.name=fontWeight][value.raw=/\\d+/], TemplateElement[value.raw=/font-weight: \\d+/]",
        message:
          "Do not specify `fontWeight` manually. Prefer spreading `theme.typography.subtitle1` or similar. If you MUST use a fontWeight, refer to `fontWeights` theme object.",
      },
      {
        selector:
          "Property[key.name=fontFamily][value.raw=/Neue Haas/], TemplateElement[value.raw=/Neue Haas/]",
        message:
          "Do not specify `fontFamily` manually. Prefer spreading `theme.typography.subtitle1` or similar. If using neue-haas-grotesk-text, this is ThemeProvider's default fontFamily.",
      },
    ],
  },
  overrides: [
    {
      files: ["./ol-components/**/*.ts", "./ol-components/**/*.tsx"],
      rules: {
        ...restrictedImports(),
      },
    },
    {
      files: ["./**/*.test.{ts,tsx}"],
      plugins: ["testing-library"],
      extends: ["plugin:testing-library/react"],
    },
  ],
}

function restrictedImports({ paths = [], patterns = [] } = {}) {
  /**
   * With the `no-restricted-imports` rule (and its typescript counterpart),
   * it's difficult to restrict imports but allow a few exceptions.
   *
   * For example:
   *  - forbid importing `@mui/material/*`, EXCEPT within `ol-components`.
   *
   * It is possible to do this using overrides.
   *
   * This function exists to make it easier to share config between overrides.
   *
   * See also:
   *  - https://github.com/eslint/eslint/discussions/17047 no-restricted-imports: allow some specific imports in some specific directories
   *  - https://github.com/eslint/eslint/discussions/15011 Can a rule be specified multiple times without overriding itself?
   *
   * This may be easier if we swtich to ESLint's new "flat config" system.
   */
  return {
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        paths: [
          /**
           * No direct imports from large "barrel files". They make Jest slow.
           *
           * For more, see:
           *  - https://github.com/jestjs/jest/issues/11234
           *  - https://github.com/faker-js/faker/issues/1114#issuecomment-1169532948
           */
          {
            name: "@faker-js/faker",
            message: "Please use @faker-js/faker/locale/en instead.",
            allowTypeImports: true,
          },
          {
            name: "@mui/icons-material",
            message: "Please use @mui/icons-material/<ICON_NAME> instead.",
            allowTypeImports: true,
          },
          {
            name: "@mui/material",
            message: "Please use @mui/material/<COMPONENT_NAME> instead.",
            allowTypeImports: true,
          },
          ...paths,
        ],
        patterns: [...patterns],
      },
    ],
  }
}
