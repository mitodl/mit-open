import React from "react"
import { BrowserRouter } from "react-router-dom"
import { screen, render } from "@testing-library/react"
import { LearningResourceListCard } from "./LearningResourceListCard"
import type { LearningResourceListCardProps } from "./LearningResourceListCard"
import { DEFAULT_RESOURCE_IMG, getReadableResourceType } from "ol-utilities"
import { ResourceTypeEnum, PlatformEnum, AvailabilityEnum } from "api"
import { factories } from "api/test-utils"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { getByImageSrc } from "ol-test-utilities"

const setup = (props: LearningResourceListCardProps) => {
  return render(
    <BrowserRouter>
      <LearningResourceListCard {...props} />
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

    setup({ resource })

    screen.getByText("Course")
    screen.getByText(resource.title)
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

    setup({ resource })

    screen.getByText("Starts:")
    screen.getByText("January 01, 2026")
  })

  test.each([
    {
      resource: factories.learningResources.resource({
        resource_type: ResourceTypeEnum.Course,
        availability: AvailabilityEnum.Anytime,
      }),
      showsAnytime: true,
    },
    {
      resource: factories.learningResources.resource({
        resource_type: ResourceTypeEnum.Program,
        availability: AvailabilityEnum.Anytime,
      }),
      showsAnytime: true,
    },
    {
      resource: factories.learningResources.resource({
        resource_type: ResourceTypeEnum.Video,
        availability: AvailabilityEnum.Anytime,
      }),
      showsAnytime: false,
    },
  ] as const)(
    "Displays 'Anytime' for availability 'Anytime' courses and programs",
    ({ resource, showsAnytime }) => {
      setup({ resource })

      const anytime = screen.queryByText("Anytime")
      const starts = screen.queryByText("Starts:")
      expect(!!anytime).toEqual(showsAnytime)
      expect(!!starts).toBe(showsAnytime)
    },
  )

  test("Click to navigate", async () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      platform: { code: PlatformEnum.Ocw },
    })

    setup({ resource, href: "/path/to/thing" })

    const card = screen.getByRole("link", {
      name: new RegExp(resource.title),
    })

    expect(card).toHaveAttribute("href", "/path/to/thing")
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

    const addToUserListButton = screen.getByLabelText(
      `Bookmark ${getReadableResourceType(resource.resource_type)}`,
    )
    await addToUserListButton.click()

    expect(onAddToLearningPathClick).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.any(HTMLElement),
      }),
      resource.id,
    )
    expect(onAddToUserListClick).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.any(HTMLElement),
      }),
      resource.id,
    )
  })

  test("Displays certificate badge", () => {
    const resource = factories.learningResources.resource({
      certification: true,
    })

    setup({ resource })

    screen.getByText("Certificate")
  })

  test("Does not display certificate badge", () => {
    const resource = factories.learningResources.resource({
      certification: false,
    })

    setup({ resource })

    const badge = screen.queryByText("Certificate")

    expect(badge).not.toBeInTheDocument()
  })

  test.each([
    {
      image: null,
      expected: { src: DEFAULT_RESOURCE_IMG, alt: "", role: "presentation" },
    },
    {
      image: { url: "https://example.com/image.jpg", alt: "An image" },
      expected: {
        src: "https://example.com/image.jpg",
        alt: "An image",
        role: "img",
      },
    },
    {
      image: { url: "https://example.com/image.jpg", alt: null },
      expected: {
        src: "https://example.com/image.jpg",
        alt: "",
        role: "presentation",
      },
    },
  ])("Image is displayed if present", ({ expected, image }) => {
    const resource = factories.learningResources.resource({ image })

    const view = setup({ resource })

    const imageEl = getByImageSrc(view.container, expected.src)

    expect(imageEl).toHaveAttribute("alt", expected.alt)
  })

  describe("Price display", () => {
    test('Free course without certificate option displays "Free"', () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: true,
        prices: ["0"],
      })
      setup({ resource })
      screen.getByText("Free")
    })

    test('Free course with paid certificate option displays the certificate price and "Free"', () => {
      const resource = factories.learningResources.resource({
        certification: true,
        free: true,
        prices: ["0", "49"],
      })
      setup({ resource })
      screen.getByText("Certificate")
      screen.getByText(": $49")
      screen.getByText("Free")
    })

    test('Free course with paid certificate option range displays the certificate price range and "Free". Prices are sorted correctly', () => {
      const resource = factories.learningResources.resource({
        certification: true,
        free: true,
        prices: ["0", "99", "49"],
      })
      setup({ resource })
      screen.getByText("Certificate")
      screen.getByText(": $49 – $99")
      screen.getByText("Free")
    })

    test("Paid course without certificate option displays the course price", () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: false,
        prices: ["49"],
      })
      setup({ resource })
      screen.getByText("$49")
    })

    test("Amount with currency subunits are displayed to 2 decimal places", () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: false,
        prices: ["49.50"],
      })
      setup({ resource })
      screen.getByText("$49.50")
    })

    test('Free course with empty prices array displays "Free"', () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: true,
        prices: [],
      })
      setup({ resource })
      screen.getByText("Free")
    })

    test('Paid course that has zero price (prices not ingested) displays "Paid"', () => {
      const resource = factories.learningResources.resource({
        certification: false,
        free: false,
        prices: ["0"],
      })
      setup({ resource })
      screen.getByText("Paid")
    })
  })
})
