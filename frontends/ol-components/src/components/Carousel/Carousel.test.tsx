/* eslint-disable testing-library/no-node-access */
import React from "react"
import { render, screen } from "@testing-library/react"
import user from "@testing-library/user-event"
import { Carousel } from "./Carousel"
import type { CarouselProps } from "./Carousel"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

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

// Pulled from Stack Overflow

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

jest.mock("nuka-carousel", () => {
  const actual = jest.requireActual("nuka-carousel")
  return {
    ...actual,
    default: jest.fn(() => <div />),
    __esModule: true,
  }
})

const setupCarousel = (props?: Partial<CarouselProps>) =>
  render(
    <Carousel pageSize={2} {...props}>
      <div>Child 1</div>
      <div>Child 2</div>
      <div>Child 3</div>
      <div>Child 4</div>
      <div>Child 5</div>
    </Carousel>,
    { wrapper: ThemeProvider },
  )

const getNextPageButton = () => screen.getByRole("button", { name: "Next" })
const getPrevPageButton = () => screen.getByRole("button", { name: "Previous" })

describe("Carousel", () => {
  it("Flips pages with Next and Prev buttons", async () => {
    setupCarousel()

    const prev = getPrevPageButton()
    const next = getNextPageButton()

    // first page: items 0, 1 of 0, 1, 2, 3, 4
    expect(prev).toBeDisabled()
    expect(next).not.toBeDisabled()

    // second page: items 2, 3 of 0, 1, 2, 3, 4
    await user.click(next)
    expect(prev).not.toBeDisabled()
    expect(next).not.toBeDisabled()

    // second page: items 4 of 0, 1, 2, 3, 4
    await user.click(next)

    expect(prev).not.toBeDisabled()
    expect(next).toBeDisabled()

    // second page: items 2, 3 of 0, 1, 2, 3, 4
    await user.click(prev)

    expect(prev).not.toBeDisabled()
    expect(next).not.toBeDisabled()

    // second page: items 2, 3 of 0, 1, 2, 3, 4
    await user.click(prev)

    expect(prev).toBeDisabled()
    expect(next).not.toBeDisabled()
  })

  it.each([
    {
      componnent: undefined,
      tagName: "DIV",
    },
    {
      componnent: "div" as const,
      tagName: "DIV",
    },
    {
      componnent: "section" as const,
      tagName: "SECTION",
    },
  ])(
    "renders a container determined by `props.as`",
    ({ componnent, tagName }) => {
      const { container } = setupCarousel({ as: componnent })
      const root = container.firstChild as HTMLElement
      expect(root.tagName).toBe(tagName)
    },
  )

  it("Renders the container with the given className", () => {
    const { container } = setupCarousel({ className: "best-class ever" })

    expect(container.firstChild).toHaveClass("best-class")
    expect(container.firstChild).toHaveClass("ever")
  })
})
