import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render, screen, within } from "@testing-library/react"
import { LearningResourceExpanded } from "./LearningResourceExpanded"
import type { LearningResourceExpandedProps } from "./LearningResourceExpanded"
import { ResourceTypeEnum, PlatformEnum, PodcastEpisodeResource } from "api"
import { factories } from "api/test-utils"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { getReadableResourceType } from "ol-utilities"
import invariant from "tiny-invariant"
import type { LearningResource } from "api"

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
          : `Take ${getReadableResourceType(resource.resource_type)}`

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

      const linkName = `Take ${getReadableResourceType(resource.resource_type)}`

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

  test.each(RESOURCE_TYPES.filter((type) => !isVideo(type)))(
    'Renders topic section for resource type "%s"',
    (resourceType) => {
      const resource = factories.learningResources.resource({
        resource_type: resourceType,
      })

      setup(resource)

      const section = screen
        .getByRole("heading", { name: "Topics" })!
        .closest("section")!

      const links = within(section).getAllByRole("link")

      resource.topics!.forEach((topic, index) => {
        expect(links[index]).toHaveAttribute("href", topic.channel_url)
        expect(links[index]).toHaveTextContent(topic.name)
      })
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

  test("Renders taught in date and price free for OCW courses", () => {
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

    const dateSection = screen.getByText("As taught in:")!.closest("div")!

    within(dateSection).getByText("Fall 2002")

    const section = screen
      .getByRole("heading", { name: "Info" })!
      .closest("section")!

    within(section).getByText("Free")
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
