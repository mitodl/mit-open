import React from "react"
import { Carousel, getSlideInfo } from "./Carousel"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import user from "@testing-library/user-event"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { faker } from "@faker-js/faker/locale/en"
import invariant from "tiny-invariant"

const mockWidths = ({
  slide,
  gap,
  list,
}: {
  slide: number
  gap: number
  list: number
}) => {
  const left = faker.number.int({ min: 0, max: 1000 })
  jest
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: Element) {
      if (this.classList.contains("slick-list")) {
        return {
          x: left,
          width: list,
        } as DOMRect
      } else if (this.classList.contains("slick-slide")) {
        const index = Number((this as HTMLElement).dataset.index)
        return {
          x: left + slide * index + gap * (index - 1),
          width: slide,
        } as DOMRect
      }
      throw new Error("Unexpected call to getBoundingClientRect")
    })
}

const getAllSlides = () => {
  return document.querySelectorAll(".slick-slide")
}
const getVisibleSlides = () => {
  return document.querySelectorAll('.slick-slide:not([aria-hidden="true"])')
}
const getHiddenSlides = () => {
  return document.querySelectorAll('.slick-slide[aria-hidden="true"]')
}
const getCurrentSlide = () => {
  return document.querySelector(".slick-slide.slick-current")
}
const getNextButton = () => {
  return screen.getByRole<HTMLButtonElement>("button", {
    name: "Show next slides",
  })
}
const getPrevButton = () => {
  return screen.getByRole<HTMLButtonElement>("button", {
    name: "Show previous slides",
  })
}

const assertAccessible = ({
  visible,
  hidden,
}: {
  visible: number
  hidden: number
}) => {
  const all = getAllSlides()
  const visibleSlides = getVisibleSlides()
  const hiddenSlides = getHiddenSlides()
  // sanity
  expect(all.length).toBe(visibleSlides.length + hiddenSlides.length)
  expect(visibleSlides.length).toBe(visible)
  expect(hiddenSlides.length).toBe(hidden)

  // All slides should have role group and aria-label
  all.forEach((slide, index) => {
    expect(slide.getAttribute("role")).toBe("group")
    expect(slide.getAttribute("aria-label")).toBe(
      `${index + 1} of ${all.length}`,
    )
  })
  // interactive elements in visible slides should be reachable
  visibleSlides.forEach((slide) => {
    const interactive = slide.querySelectorAll("a, button")
    expect(interactive.length).toBe(2)
    interactive.forEach((el) => {
      expect(el.getAttribute("tabindex")).toBeNull()
    })
  })
  // interactive elements in hidden slides should not be reachable
  hiddenSlides.forEach((slide) => {
    const interactive = slide.querySelectorAll("a, button")
    expect(interactive.length).toBe(2)
    interactive.forEach((el) => {
      expect(el.getAttribute("tabindex")).toBe("-1")
    })
  })
}

describe("Carousel", () => {
  test("Shows correct number of slides at different widths", async () => {
    const slide = 150
    const gap = 20
    const fits3 = 3 * slide + 2 * gap

    mockWidths({ slide, gap, list: fits3 })
    render(
      <Carousel>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            Slide {i}
            <a href="fake-site">Fake site</a>
            <button onClick={jest.fn()}>Some Button</button>
          </div>
        ))}
      </Carousel>,
      { wrapper: ThemeProvider },
    )

    expect(getVisibleSlides()).toHaveLength(3)

    mockWidths({ slide, gap, list: fits3 - 10 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(2))
    assertAccessible({ visible: 2, hidden: 8 })

    mockWidths({ slide, gap, list: fits3 + 50 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(3))
    assertAccessible({ visible: 3, hidden: 7 })

    mockWidths({ slide, gap, list: fits3 + 170 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(4))
    assertAccessible({ visible: 4, hidden: 6 })

    mockWidths({ slide, gap, list: fits3 + 3 * 170 - 10 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(5))
    assertAccessible({ visible: 5, hidden: 5 })
  })

  test.each([
    { initialIndex: 2, finalIndex: 5, nextDisabled: false },
    { initialIndex: 4, finalIndex: 7, nextDisabled: true },
  ])(
    "Pages up correctly",
    async ({ initialIndex, finalIndex, nextDisabled }) => {
      const slide = 150
      const gap = 20
      const fits3 = 3 * slide + 2 * gap

      mockWidths({ slide, gap, list: fits3 })
      render(
        <Carousel initialSlide={initialIndex}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>Slide {i}</div>
          ))}
        </Carousel>,
        { wrapper: ThemeProvider },
      )

      const next = getNextButton()
      await user.click(next)
      expect(getCurrentSlide()).toHaveTextContent(`Slide ${finalIndex}`)
      expect(!!next.disabled).toBe(nextDisabled)
    },
  )

  test.each([
    { initialIndex: 2, finalIndex: 0, prevDisabled: true },
    { initialIndex: 4, finalIndex: 1, prevDisabled: false },
  ])(
    "Pages up correctly",
    async ({ initialIndex, finalIndex, prevDisabled }) => {
      const slide = 150
      const gap = 20
      const fits3 = 3 * slide + 2 * gap

      mockWidths({ slide, gap, list: fits3 })
      render(
        <Carousel initialSlide={initialIndex}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>Slide {i}</div>
          ))}
        </Carousel>,
        { wrapper: ThemeProvider },
      )

      const prev = getPrevButton()
      await user.click(prev)
      expect(getCurrentSlide()).toHaveTextContent(`Slide ${finalIndex}`)
      expect(!!prev.disabled).toBe(prevDisabled)
    },
  )

  test("Rendering arrows in a separate container", () => {
    const WithArrowsContainer = () => {
      const [ref, setRef] = React.useState<HTMLElement | null>(null)
      return (
        <div>
          <Carousel arrowsContainer={ref}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>Slide {i}</div>
            ))}
          </Carousel>
          <div data-testid="arrows-container" ref={setRef} />
        </div>
      )
    }
    render(<WithArrowsContainer />, {
      wrapper: ThemeProvider,
    })
    const container = screen.getByTestId("arrows-container")
    const next = getNextButton()
    const prev = getPrevButton()
    expect(container.contains(next)).toBe(true)
    expect(container.contains(prev)).toBe(true)
  })

  test.each([
    {
      sizes: { slide: 20, gap: 10, list: 200 },
      childCount: 10,
      expectedPerPage: 7,
    },
    {
      sizes: { slide: 20, gap: 10, list: 2000000 },
      childCount: 10,
      expectedPerPage: 10,
    },
    {
      sizes: { slide: 20, gap: 10, list: 2000000 },
      childCount: 20,
      expectedPerPage: 20,
    },
  ])(
    "getSlideInfo never returns more slidesPerPage than children",
    ({ sizes, childCount, expectedPerPage }) => {
      mockWidths(sizes)
      render(
        <Carousel>
          {Array.from({ length: childCount }).map((_, i) => (
            <div key={i}>Slide {i}</div>
          ))}
        </Carousel>,
        { wrapper: ThemeProvider },
      )
      const slickList = document.querySelector(".slick-list")
      invariant(slickList instanceof HTMLElement, "slick-list not found")
      const slideInfo = getSlideInfo(slickList)
      expect(slideInfo.slidesPerPage).toBe(expectedPerPage)
    },
  )
})
