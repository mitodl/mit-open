import React from "react"
import { BrowserRouter } from "react-router-dom"
import { screen, render, act } from "@testing-library/react"
import { LearningResourceListCard } from "./LearningResourceListCard"
import { DEFAULT_RESOURCE_IMG, embedlyCroppedImage } from "ol-utilities"
import { LearningResource, ResourceTypeEnum, PlatformEnum } from "api"
import { factories } from "api/test-utils"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

const setup = (resource: LearningResource) => {
  return render(
    <BrowserRouter>
      <LearningResourceListCard
        resource={resource}
        href={`?resource=${resource.id}`}
      />
    </BrowserRouter>,
    { wrapper: ThemeProvider },
  )
}

describe("Learning Resource List Card", () => {
  test("Renders resource type, title and start date", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      next_start_date: "2026-01-01",
    })

    setup(resource)

    screen.getByText("Course")
    screen.getByRole("heading", { name: resource.title })
    screen.getByText("Starts:")
    screen.getByText("January 01, 2026")
  })

  test("Displays run start date", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      next_start_date: null,
      runs: [
        factories.learningResources.run({
          start_date: "2026-01-01",
        }),
      ],
    })

    setup(resource)

    screen.getByText("Starts:")
    screen.getByText("January 01, 2026")
  })

  test("Displays taught in date for OCW", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      platform: { code: PlatformEnum.Ocw },
      runs: [
        factories.learningResources.run({
          semester: "Fall",
          year: 2002,
        }),
      ],
    })

    setup(resource)

    expect(screen.getByRole("link")).toHaveTextContent("As taught in:")
    expect(screen.getByRole("link")).toHaveTextContent("Fall 2002")
  })

  test("Click to navigate", async () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      platform: { code: PlatformEnum.Ocw },
    })

    setup(resource)

    const heading = screen.getByRole("heading", { name: resource.title })
    await act(async () => {
      await heading.click()
    })

    expect(window.location.search).toBe(`?resource=${resource.id}`)
  })

  test("Click action buttons", async () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      platform: { code: PlatformEnum.Ocw },
    })

    const onAddToLearningPathClick = jest.fn()
    const onAddToUserListClick = jest.fn()

    render(
      <BrowserRouter>
        <LearningResourceListCard
          resource={resource}
          onAddToLearningPathClick={onAddToLearningPathClick}
          onAddToUserListClick={onAddToUserListClick}
        />
      </BrowserRouter>,
      { wrapper: ThemeProvider },
    )

    const addToLearningPathButton = screen.getByLabelText(
      "Add to Learning Path",
    )
    await addToLearningPathButton.click()

    const addToUserListButton = screen.getByLabelText("Add to User List")
    await addToUserListButton.click()

    expect(onAddToLearningPathClick).toHaveBeenCalledWith(resource.id)
    expect(onAddToUserListClick).toHaveBeenCalledWith(resource.id)
  })

  test("Displays certificate badge", () => {
    const resource = factories.learningResources.resource({
      certification: true,
    })

    setup(resource)

    screen.getByText("Certificate")
  })

  test("Does not display certificate badge", () => {
    const resource = factories.learningResources.resource({
      certification: false,
    })

    setup(resource)

    const badge = screen.queryByText("Certificate")

    expect(badge).not.toBeInTheDocument()
  })

  test.each([
    { image: null, expected: { src: DEFAULT_RESOURCE_IMG, alt: "" } },
    {
      image: { url: "https://example.com/image.jpg", alt: "An image" },
      expected: { src: "https://example.com/image.jpg", alt: "An image" },
    },
    {
      image: { url: "https://example.com/image.jpg", alt: null },
      expected: { src: "https://example.com/image.jpg", alt: "" },
    },
  ])("Image is displayed if present", ({ expected, image }) => {
    const resource = factories.learningResources.resource({ image })

    setup(resource)

    const imageEls = screen.getAllByRole<HTMLImageElement>("img")

    const matching = imageEls.filter((im) =>
      expected.src === DEFAULT_RESOURCE_IMG
        ? im.src === DEFAULT_RESOURCE_IMG
        : im.src ===
          embedlyCroppedImage(expected.src, {
            width: 116,
            height: 104,
            key: "fake-embedly-key",
          }),
    )
    expect(matching.length).toBe(1)
    expect(matching[0]).toHaveAttribute("alt", expected.alt)
  })

  describe("Price display", () => {
    test('Free course without certificate option displays "Free"', () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: true,
        prices: ["0"],
      })
      setup(resource)
      screen.getByText("Free")
    })

    test('Free course with paid certificate option displays the certificate price and "Free"', () => {
      const resource = factories.learningResources.resource({
        certification: true,
        free: true,
        prices: ["0", "49"],
      })
      setup(resource)
      screen.getByText("Certificate: $49")
      screen.getByText("Free")
    })

    test('Free course with paid certificate option range displays the certificate price range and "Free". Prices are sorted correctly', () => {
      const resource = factories.learningResources.resource({
        certification: true,
        free: true,
        prices: ["0", "99", "49"],
      })
      setup(resource)
      screen.getByText("Certificate: $49 - $99")
      screen.getByText("Free")
    })

    test("Paid course without certificate option displays the course price", () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: false,
        prices: ["49"],
      })
      setup(resource)
      screen.getByText("$49")
    })

    test("Amount with currency subunits are displayed to 2 decimal places", () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: false,
        prices: ["49.50"],
      })
      setup(resource)
      screen.getByText("$49.50")
    })

    test('Free course with empty prices array displays "Free"', () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: true,
        prices: [],
      })
      setup(resource)
      screen.getByText("Free")
    })

    test('Paid course that has zero price (prices not ingested) displays "Paid"', () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: false,
        prices: ["0"],
      })
      setup(resource)
      screen.getByText("Paid")
    })
  })
})
