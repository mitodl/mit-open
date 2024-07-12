import { setupMockEditors } from "ol-ckeditor/test_utils"

setupMockEditors()

beforeEach(() => {
  const originalError = console.error
  jest.spyOn(console, "error").mockImplementation((...args) => {
    /* Issue is in react-markdown v6.0.3. The package is now several versions ahead. We can remove this once we update
     * https://github.com/remarkjs/react-markdown/blob/ce6c1a71c17280e753e54e919511cd8bafadf86e/src/react-markdown.js#L138
     */
    if (
      args[0]?.includes(
        "Support for defaultProps will be removed from function components in a future major release",
      )
    ) {
      return
    }
    return originalError.call(console, args)
  })
})

afterEach(() => {
  /**
   * Clear all mock call counts between tests.
   * This does NOT clear mock implementations.
   * Mock implementations are always cleared between test files.
   */
  jest.clearAllMocks()
})
