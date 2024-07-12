import { setupMockEditors } from "ol-ckeditor/test_utils"
import { mockAxiosInstance } from "./mockAxios"

setupMockEditors()

jest.mock("axios", () => {
  const AxiosError = jest.requireActual("axios").AxiosError
  return {
    __esModule: true,
    default: {
      create: () => mockAxiosInstance,
      AxiosError,
    },
    AxiosError,
  }
})

jest.mock("@/page-components/LearningResourceCard/LearningResourceCard", () => {
  const actual = jest.requireActual(
    "@/page-components/LearningResourceCard/LearningResourceCard",
  )
  return {
    __esModule: true,
    ...actual,
    default: jest.fn(actual.default),
  }
})

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

window.scrollTo = jest.fn()
