import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render, screen, within } from "@testing-library/react"
import user from "@testing-library/user-event"
import { LearningResourceExpanded } from "./LearningResourceExpanded"
import type { LearningResourceExpandedProps } from "./LearningResourceExpanded"
import { ResourceTypeEnum, PodcastEpisodeResource, AvailabilityEnum } from "api"
import { factories } from "api/test-utils"
import { formatDate } from "ol-utilities"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import invariant from "tiny-invariant"
import type { LearningResource } from "api"
import { faker } from "@faker-js/faker/locale/en"
import { PLATFORMS } from "../Logo/Logo"

const IMG_CONFIG: LearningResourceExpandedProps["imgConfig"] = {
  key: "fake-key",
  width: 385,
  height: 200,
}

const setup = (resource: LearningResource) => {
  return render(
    <BrowserRouter>
      <LearningResourceExpanded resource={resource} imgConfig={IMG_CONFIG} />
    </BrowserRouter>,
    { wrapper: ThemeProvider },
  )
}

describe("Learning Resource Expanded", () => {
  const RESOURCE_TYPES = Object.values(ResourceTypeEnum)
  const isVideo = (resourceType: ResourceTypeEnum) =>
    resourceType === ResourceTypeEnum.Video ||
    resourceType === ResourceTypeEnum.VideoPlaylist

  test.each(RESOURCE_TYPES.filter((type) => !isVideo(type)))(
    'Renders image and title for resource type "%s"',
    (resourceType) => {
      const resource = factories.learningResources.resource({
        resource_type: resourceType,
      })

      setup(resource)

      const images = screen.getAllByRole("img")
      const image = images.find((img) =>
        img
          .getAttribute("src")
          ?.includes(encodeURIComponent(resource.image?.url ?? "")),
      )
      expect(image).toBeInTheDocument()
      invariant(image)
      expect(image).toHaveAttribute("alt", resource.image?.alt ?? "")

      screen.getByRole("heading", { name: resource.title })

      const linkName =
        resource.resource_type === ResourceTypeEnum.Podcast ||
        resource.resource_type === ResourceTypeEnum.PodcastEpisode
          ? "Listen to Podcast"
          : "Learn More"

      const url =
        resource.resource_type === ResourceTypeEnum.PodcastEpisode
          ? (resource as PodcastEpisodeResource).podcast_episode?.episode_link
          : resource.url
      if (linkName) {
        const link = screen.getByRole("link", {
          name: linkName,
        }) as HTMLAnchorElement
        expect(link.target).toBe("_blank")
        expect(link.href).toMatch(new RegExp(`^${url}/?$`))
      }
    },
  )

  test(`Renders card and title for resource type "${ResourceTypeEnum.Video}"`, () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Video,
    })

    setup(resource)

    const embedlyCard = document.querySelector(".embedly-card")
    invariant(embedlyCard)
    expect(embedlyCard).toHaveAttribute("href", resource.url)

    screen.getByRole("heading", { name: resource.title })
  })

  test.each([ResourceTypeEnum.Program, ResourceTypeEnum.LearningPath])(
    'Renders CTA button for resource type "%s"',
    (resourceType) => {
      const resource = factories.learningResources.resource({
        resource_type: resourceType,
      })

      setup(resource)

      const linkName = "Learn More"
      if (linkName) {
        const link = screen.getByRole("link", {
          name: linkName,
        }) as HTMLAnchorElement

        expect(link.href).toMatch(new RegExp(`^${resource.url}/?$`))
      }
    },
  )

  test.each([ResourceTypeEnum.PodcastEpisode])(
    'Renders CTA button for resource type "%s"',
    (resourceType) => {
      const resource = factories.learningResources.resource({
        resource_type: resourceType,
        podcast_episode: {
          episode_link: "https://example.com",
        },
      })

      setup(resource)

      const link = screen.getByRole("link", {
        name: "Listen to Podcast",
      }) as HTMLAnchorElement

      expect(link.href).toMatch(
        new RegExp(
          `^${(resource as PodcastEpisodeResource).podcast_episode?.episode_link}/?$`,
        ),
      )
    },
  )

  test.each([ResourceTypeEnum.PodcastEpisode])(
    "Renders xpro logo conditionally on offered_by=xpro and not platform.code",
    (resourceType) => {
      const resource = factories.learningResources.resource({
        resource_type: resourceType,
        platform: { code: "test" },
        offered_by: { code: "xpro" },
        podcast_episode: {
          episode_link: "https://example.com",
        },
      })

      setup(resource)
      const xproImage = screen
        .getAllByRole("img")
        .find((img) => img.getAttribute("alt")?.includes("xPRO"))

      expect(xproImage).toBeInTheDocument()
      expect(xproImage).toHaveAttribute("alt", PLATFORMS["xpro"].name)
    },
  )

  test(`Renders info section for resource type "${ResourceTypeEnum.Video}"`, () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Video,
    })

    setup(resource)

    const run = resource.runs![0]

    if (run) {
      const section = screen
        .getByRole("heading", { name: "Info" })!
        .closest("section")!

      const price = run.prices?.[0]

      const displayPrice =
        parseFloat(price!) === 0 ? "Free" : price ? `$${price}` : null
      if (displayPrice) {
        within(section).getByText(displayPrice)
      }

      const level = run.level?.[0]
      if (level) {
        within(section).getByText(level.name)
      }

      const instructors = run.instructors
        ?.filter((instructor) => instructor.full_name)
        .map(({ full_name: name }) => name)
      if (instructors?.length) {
        within(section!).getByText(instructors.join(", "))
      }
    }
  })

  test.each([
    {
      run: factories.learningResources.run({ semester: "Fall", year: 2001 }),
      expectedDate: "Fall 2001",
    },
    {
      run: factories.learningResources.run({
        semester: "Fall",
        year: null,
        start_date: "2002-09-01",
      }),
      expectedDate: "Fall 2002",
    },
    {
      run: factories.learningResources.run({
        semester: "fall",
        year: null,
        start_date: "2002-09-01",
      }),
      expectedDate: "Fall 2002", // capitalized
    },
    {
      run: factories.learningResources.run({
        semester: null,
        year: null,
        start_date: "2003-09-01",
      }),
      expectedDate: "September, 2003",
    },
  ])(
    "Renders 'As taught in' and Month+Year for availability: anytime",
    ({ run, expectedDate }) => {
      const resource = factories.learningResources.resource({
        resource_type: faker.helpers.arrayElement([
          ResourceTypeEnum.Course,
          ResourceTypeEnum.Program,
        ]),
        runs: [run],
        availability: "anytime",
      })

      setup(resource)

      const dateSection = screen.getByText("As taught in:")!.closest("div")!

      within(dateSection).getByText(expectedDate)
    },
  )

  test.each([
    {
      expectedLabel: "Start Date:",
      resource: factories.learningResources.resource({
        resource_type: ResourceTypeEnum.Course,
        availability: AvailabilityEnum.Dated,
        runs: [
          factories.learningResources.run({ start_date: "2024-02-03" }),
          factories.learningResources.run({ start_date: "2024-04-05" }),
        ],
      }),
      expectedDates: ["February 03, 2024", "April 05, 2024"],
    },
    {
      expectedLabel: "As taught in:",
      resource: factories.learningResources.resource({
        resource_type: ResourceTypeEnum.Course,
        availability: AvailabilityEnum.Anytime,
        runs: [
          factories.learningResources.run({ semester: "Fall", year: 2020 }),
          factories.learningResources.run({
            semester: "Spring",
            year: null,
            start_date: "2021-02-03",
          }),
          factories.learningResources.run({
            semester: null,
            year: null,
            start_date: "2022-05-06",
          }),
        ],
      }),
      expectedDates: ["Spring 2021", "May, 2022", "Fall 2020"],
    },
  ])(
    "Renders a dropdown for run picker",
    async ({ resource, expectedDates, expectedLabel }) => {
      setup(resource)

      screen.getByText(expectedLabel)
      const select = screen.getByRole("combobox")
      await user.click(select)

      const options = screen.getAllByRole("option")

      expectedDates.forEach((date, index) => {
        expect(options[index]).toHaveTextContent(date)
      })
    },
  )

  test("Dates are ordered in dropdown and closest is selected", async () => {
    const nextFutureDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1,
    ).toISOString()
    const farFutureDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 8,
      1,
    ).toISOString()
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      runs: [
        factories.learningResources.run({
          semester: "Spring",
          year: null,
          start_date: "2021-02-03",
        }),
        factories.learningResources.run({
          semester: null,
          year: null,
          start_date: "2022-05-06",
        }),
        factories.learningResources.run({
          semester: "Spring",
          year: null,
          start_date: formatDate(nextFutureDate, "YYYY-MM-DD"),
        }),
        factories.learningResources.run({
          semester: "Spring",
          year: null,
          start_date: formatDate(farFutureDate, "YYYY-MM-DD"),
        }),
      ],
    })
    setup(resource)
    const select = screen.getByRole("combobox")
    await user.click(select)

    const options = screen.getAllByRole("option")
    expect(options[0]).toHaveTextContent(
      formatDate("2021-02-03", "MMMM DD, YYYY"),
    )
    expect(options[3]).toHaveTextContent(
      formatDate(farFutureDate, "MMMM DD, YYYY"),
    )

    const selected = screen.getByRole("option", { selected: true })
    expect(selected).toHaveTextContent(
      formatDate(nextFutureDate, "MMMM DD, YYYY"),
    )
  })

  test("Renders info section topics correctly", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      topics: [
        factories.learningResources.topic({ name: "Topic 1" }),
        factories.learningResources.topic({ name: "Topic 2" }),
        factories.learningResources.topic({ name: "Topic 3" }),
      ],
    })

    setup(resource)

    const section = screen
      .getByRole("heading", { name: "Info" })!
      .closest("section")!

    within(section).getByText("Topic 1, Topic 2, Topic 3")
  })

  test("Renders info section languages correctly", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Course,
      runs: [
        factories.learningResources.run({
          languages: ["en-us", "es-es", "fr-fr"],
        }),
      ],
    })

    setup(resource)

    const section = screen
      .getByRole("heading", { name: "Info" })!
      .closest("section")!

    within(section).getByText("English, Spanish, French")
  })

  test("Renders info section video duration correctly", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Video,
      video: { duration: "PT1H13M44S" },
    })

    setup(resource)

    const section = screen
      .getByRole("heading", { name: "Info" })!
      .closest("section")!

    within(section).getByText("1:13:44")
  })

  test("Renders info section podcast episode duration correctly", () => {
    const resource = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.PodcastEpisode,
      podcast_episode: { duration: "PT13M44S" },
    })

    setup(resource)

    const section = screen
      .getByRole("heading", { name: "Info" })!
      .closest("section")!

    within(section).getByText("13:44")
  })
})
