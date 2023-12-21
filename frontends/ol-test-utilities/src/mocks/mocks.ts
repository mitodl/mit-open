import mediaQuery from "css-mediaquery"

/**
 * Create a mock mediaQuery functiton. Matches are determined by comparison with
 * the provided values.
 *
 * For example:
 * ```
 * const mediaQuery = createMatchMediaForJsDom({ width: "100px" })
 * // Will return false; width is "100px", which is below minimum
 * mediaQuery("(min-width: 120px)").match
 * ```
 *
 * See
 *  - https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
 *  - https://mui.com/material-ui/react-use-media-query/#testing
 */
const createMatchMediaForJsDom = (
  values: Partial<mediaQuery.MediaValues>,
): ((query: string) => MediaQueryList) => {
  return (query: string) => ({
    matches: mediaQuery.match(query, values),
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
  })
}

/**
 * We use [jest-fail-on-console](https://www.npmjs.com/package/jest-fail-on-console)
 * to fail on console errors/warnings.
 *
 * This function allows us to temporarily disable that behavior for a test,
 * e.g., to test API error handling.
 */
const allowConsoleErrors = () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  const consoleWarn = jest.spyOn(console, "warn").mockImplementation()
  return { consoleError, consoleWarn }
}

export { createMatchMediaForJsDom, allowConsoleErrors }
