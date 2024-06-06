import React from "react"
import { renderWithProviders, screen, user } from "@/test-utils"
import { Carousel } from "./Carousel"
import { useCarousel } from "nuka-carousel"
import { faker } from "@faker-js/faker/locale/en"

jest.mock("nuka-carousel", () => {
  const actual = jest.requireActual("nuka-carousel")
  return {
    ...actual,
    useCarousel: jest.fn(actual.useCarousel),
  }
})
const spyUseCarousel = jest.mocked(useCarousel)
const originalUseCarousel = spyUseCarousel.getMockImplementation()!

/**
 * The carousel uses a hook from nuka-carousel to manage its state. The hook
 * relies on browser dimensions, which JSDom doesn't support.
 *
 * We should test this in a browser, e.g., with playwright.
 * For now, we'll mock the context.
 */
const setCarouselContext = (
  overrides: Partial<ReturnType<typeof originalUseCarousel>> = {},
) => {
  spyUseCarousel.mockImplementation(() => {
    const result = originalUseCarousel()
    return { ...result, ...overrides }
  })
}

const CarouselWithButtons = () => {
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null)
  return (
    <>
      <div data-testid="button-container" ref={setRef} />
      <Carousel arrowsContainer={ref}>
        <div>One</div>
        <div>Two</div>
        <div>Three</div>
        <div>Four</div>
        <div>Five</div>
        <div>Six</div>
      </Carousel>
    </>
  )
}

const controls = {
  previous: () => screen.findByRole("button", { name: "Previous" }),
  next: () => screen.findByRole("button", { name: "Next" }),
}

describe("Carousel", () => {
  it("Disables previous button when currentPage is zero", async () => {
    setCarouselContext({ currentPage: 0 })
    renderWithProviders(<CarouselWithButtons />)
    expect(await controls.previous()).toBeDisabled()
  })

  it("Disables previous button when currentPage is max", async () => {
    const totalPages = faker.number.int({ min: 3, max: 5 })
    setCarouselContext({ totalPages, currentPage: totalPages - 1 })
    renderWithProviders(<CarouselWithButtons />)
    expect(await controls.next()).toBeDisabled()
  })

  it("Calls goForward and goBack appropriately", async () => {
    const goForward = jest.fn()
    const goBack = jest.fn()
    setCarouselContext({ currentPage: 2, totalPages: 5, goBack, goForward })
    renderWithProviders(<CarouselWithButtons />)

    await user.click(await controls.next())
    expect(goForward).toHaveBeenCalled()
    await user.click(await controls.previous())
    expect(goBack).toHaveBeenCalled()
  })

  it("Mounts arrow buttons into specified container", async () => {
    renderWithProviders(<CarouselWithButtons />)
    const container = await screen.findByTestId("button-container")

    expect(container).toContainElement(await controls.previous())
    expect(container).toContainElement(await controls.next())
  })
})
