import React from "react"
import { Carousel } from "./Carousel"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import user from "@testing-library/user-event"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { faker } from "@faker-js/faker/locale/en"

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

const getVisibleSlides = () => {
  return document.querySelectorAll('.slick-slide:not([aria-hidden="true"])')
}
const getCurrentSlide = () => {
  return document.querySelector(".slick-slide.slick-current")
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
          <div key={i}>Slide {i}</div>
        ))}
      </Carousel>,
      { wrapper: ThemeProvider },
    )

    expect(getVisibleSlides()).toHaveLength(3)

    mockWidths({ slide, gap, list: fits3 - 10 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(2))

    mockWidths({ slide, gap, list: fits3 + 50 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(3))

    mockWidths({ slide, gap, list: fits3 + 170 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(4))

    mockWidths({ slide, gap, list: fits3 + 3 * 170 - 10 })
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(getVisibleSlides()).toHaveLength(5))
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

      const next = screen.getByRole<HTMLButtonElement>("button", {
        name: "Next",
      })
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

      const prev = screen.getByRole<HTMLButtonElement>("button", {
        name: "Previous",
      })
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
    const next = screen.getByRole("button", { name: "Next" })
    const prev = screen.getByRole("button", { name: "Previous" })
    expect(container.contains(next)).toBe(true)
    expect(container.contains(prev)).toBe(true)
  })
})
