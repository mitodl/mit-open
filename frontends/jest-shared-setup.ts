import failOnConsole from "jest-fail-on-console"
import "@testing-library/jest-dom"
import "cross-fetch/polyfill"
import { configure } from "@testing-library/react"
import { resetAllWhenMocks } from "jest-when"
import * as matchers from "jest-extended"
import { mockRouter } from "ol-test-utilities/mocks/nextNavigation"

expect.extend(matchers)

// env vars
process.env.NEXT_PUBLIC_MITOL_API_BASE_URL =
  "http://api.test.learn.odl.local:8063"
process.env.NEXT_PUBLIC_ORIGIN = "http://test.learn.odl.local:8062"
process.env.NEXT_PUBLIC_EMBEDLY_KEY = "fake-embedly-key"

// Pulled from the docs - see https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

Element.prototype.scrollIntoView = jest.fn()

/*
 * This used to live in ol-ckeditor but we also need it now for NukaCarousel,
 * so it's now here so it's available across the board.
 */
class FakeResizeObserver {
  observe() {
    /** pass */
  }
  unobserve() {
    /** pass */
  }
  disconnect() {
    /** pass */
  }
}
const polyfillResizeObserver = () => {
  if (window.ResizeObserver !== undefined) {
    /**
     * If this throws... I guess our test env supports it natively now.
     * Welcome to the future!
     */
    throw new Error("ResizeObserver is already defined.")
  }
  window.ResizeObserver = FakeResizeObserver
}
polyfillResizeObserver()

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

jest.mock("next/navigation", () => {
  return {
    ...jest.requireActual("ol-test-utilities/mocks/nextNavigation")
      .nextNavigationMocks,
  }
})

afterEach(() => {
  /**
   * Clear all mock call counts between tests.
   * This does NOT clear mock implementations.
   * Mock implementations are always cleared between test files.
   */
  jest.clearAllMocks()
  resetAllWhenMocks()
  mockRouter.setCurrentUrl("/")
  window.history.replaceState({}, "", "/")
})
