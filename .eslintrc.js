module.exports = {
  extends: [
    "eslint-config-mitodl",
    "eslint-config-mitodl/jest",
    "plugin:testing-library/react",
    "prettier",
  ],
  plugins: ["testing-library"],
  ignorePatterns: ["**/build/**"],
  rules: {
    ...restrictedImports({
      patterns: [
        {
          group: ["@mui/material*", "@mui/lab/*"],
          message:
            "Please use 'ol-design' isInterfaceDeclaration; Direct use of @mui/material is limited to ol-design.",
        },
      ],
    }),
  },
  overrides: [
    {
      files: [
        "./frontends/ol-design/**/*.ts",
        "./frontends/ol-design/**/*.tsx",
      ],
      rules: {
        ...restrictedImports(),
      },
    },
  ],
}

function restrictedImports({ paths = [], patterns = [] } = {}) {
  /**
   * With the `no-restricted-imports` rule (and its typescript counterpart),
   * it's difficult to restrict imports but allow a few exceptions.
   *
   * For example:
   *  - forbid importing `@mui/material/*`, EXCEPT within `ol-design`.
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
