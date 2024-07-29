import React from "react"
import { BrowserRouter } from "react-router-dom"
import { screen, render, act } from "@testing-library/react"
import { LearningResourceCard } from "./LearningResourceCard"
import type { LearningResourceCardProps } from "./LearningResourceCard"
import { DEFAULT_RESOURCE_IMG, embedlyCroppedImage } from "ol-utilities"
import { ResourceTypeEnum, PlatformEnum, AvailabilityEnum } from "api"
import { factories } from "api/test-utils"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

const setup = (props: LearningResourceCardProps) => {
  return render(
    <BrowserRouter>
      <LearningResourceCard
        resource={props.resource}
        href={`?resource=${props.resource?.id}`}
      />
    </BrowserRouter>,
    { wrapper: ThemeProvider },
  )
}

describe("Learning Resource Card", () => {
  test("Renders resource type, title and start date", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      next_start_date: "2026-01-01",
    })

    setup({ resource })

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
        resource_type: ResourceTypeEnum.Course,
        availability: AvailabilityEnum.Anytime,
      }),
      size: "small",
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
    ({ resource, size, showsAnytime }) => {
      setup({ resource, size })

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

    setup({ resource })

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
        <LearningResourceCard
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

    setup({ resource })

    const imageEls = screen.getAllByRole<HTMLImageElement>(expected.role)

    const matching = imageEls.filter((im) =>
      expected.src === DEFAULT_RESOURCE_IMG
        ? im.src === DEFAULT_RESOURCE_IMG
        : im.src ===
          embedlyCroppedImage(expected.src, {
            width: 298,
            height: 170,
            key: "fake-embedly-key",
          }),
    )
    expect(matching.length).toBe(1)
    expect(matching[0]).toHaveAttribute("alt", expected.alt)
  })
})
