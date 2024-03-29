import failOnConsole from "jest-fail-on-console"
import "@testing-library/jest-dom"
import "cross-fetch/polyfill"
import { configure } from "@testing-library/react"
import { resetAllWhenMocks } from "jest-when"

failOnConsole()

configure({
  /**
   * Adapted from https://github.com/testing-library/dom-testing-library/issues/773
   * to make the error messages a bit more succinct.
   *
   * By default, testing-library prints much too much of the DOM.
   *
   * This does change the stacktrace a bit: The line causing the error is still
   * there, but the line where the error is generated (below) is most visible.
   */
  getElementError(message, _container) {
    const error = new Error(message ?? "")
    error.name = "TestingLibraryElementError"
    return error
  },
})

afterEach(() => {
  /**
   * Clear all mock call counts between tests.
   * This does NOT clear mock implementations.
   * Mock implementations are always cleared between test files.
   */
  jest.clearAllMocks()
  resetAllWhenMocks()
})
