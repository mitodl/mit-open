import { screen } from "@testing-library/react"
/**
 * This is the library that @testing-library uses to compute accessible names.
 */
import { computeAccessibleName } from "dom-accessibility-api"

type HeadingSpec = {
  level: number
  /**
   * The accessible name of the heading.
   * Can be a matcher like `expect.stringContaining("foo")`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  name: any
}
const assertHeadings = (expected: HeadingSpec[]) => {
  const headings = screen.getAllByRole("heading")
  const actual = headings.map((heading) => {
    const level = parseInt(heading.tagName[1], 10)
    const name = computeAccessibleName(heading)
    return { level, name }
  })
  expect(actual).toEqual(expected)
}

export { assertHeadings }
