import React from "react"
import ResourceCarousel from "./ResourceCarousel"
import type { ResourceCarouselProps } from "./ResourceCarousel"
import {
  expectLastProps,
  renderWithProviders,
  screen,
  user,
  waitFor,
} from "@/test-utils"
import { factories, setMockResponse, makeRequest, urls } from "api/test-utils"
import { LearningResourceCard } from "ol-components"
import { ControlledPromise } from "ol-test-utilities"

jest.mock("ol-components", () => {
  const actual = jest.requireActual("ol-components")
  return {
    ...actual,
    LearningResourceCard: jest.fn(actual.LearningResourceCard),
  }
})

const spyLearningResourceCard = jest.mocked(LearningResourceCard)

describe("ResourceCarousel", () => {
  const setupApis = ({
    count = 3,
    autoResolve = true,
  }: { count?: number; autoResolve?: boolean } = {}) => {
    const resources = {
      search: factories.learningResources.resources({ count }),
      list: factories.learningResources.resources({ count }),
    }
    setMockResponse.get(urls.userMe.get(), {})

    const searchResponse = new ControlledPromise()
    const listResponse = new ControlledPromise()
    setMockResponse.get(
      expect.stringContaining(urls.search.resources()),
      searchResponse,
    )
    setMockResponse.get(
      expect.stringContaining(urls.learningResources.list()),
      listResponse,
    )
    const resolve = () => {
      searchResponse.resolve(resources.search)
      listResponse.resolve(resources.list)
    }
    if (autoResolve) {
      resolve()
    }
    return { resources, resolve }
  }

  it.each([
    { cardProps: undefined },
    { cardProps: { size: "small" } },
    { cardProps: { size: "medium" } },
    { cardProps: undefined },
    { cardProps: { size: "small" } },
    { cardProps: { size: "medium" } },
  ] as const)(
    "Shows loading state then renders results from the correct endpoint with expected props",
    async ({ cardProps }) => {
      const config: ResourceCarouselProps["config"] = [
        {
          label: "Resources",
          data: {
            type: "resources",
            params: { resource_type: ["video", "podcast"] },
          },
          cardProps,
        },
        {
          label: "Search",
          data: {
            type: "lr_search",
            params: { professional: true },
          },
          cardProps,
        },
      ]

      const { resources, resolve } = setupApis({ autoResolve: false })

      renderWithProviders(
        <ResourceCarousel title="My Carousel" config={config} />,
      )

      expectLastProps(spyLearningResourceCard, {
        isLoading: true,
        ...cardProps,
      })
      resolve()

      const tabs = screen.getAllByRole("tab")

      expect(tabs).toHaveLength(2)
      expect(tabs[0]).toHaveTextContent("Resources")
      expect(tabs[1]).toHaveTextContent("Search")

      await screen.findByText(resources.list.results[0].title)
      await screen.findByText(resources.list.results[1].title)
      await screen.findByText(resources.list.results[2].title)
      expectLastProps(spyLearningResourceCard, { ...cardProps })

      await user.click(tabs[1])
      await screen.findByText(resources.search.results[0].title)
      await screen.findByText(resources.search.results[1].title)
      await screen.findByText(resources.search.results[2].title)
      expectLastProps(spyLearningResourceCard, { ...cardProps })
    },
  )

  it.each([
    { labels: ["First Tab", "Second Tab"], expectTabs: true },
    { labels: ["Irrelevant title"], expectTabs: false },
  ])(
    "Only renders tabs if multiple config items",
    async ({ labels, expectTabs }) => {
      const config: ResourceCarouselProps["config"] = labels.map((label) => {
        return {
          label,
          data: { type: "resources", params: {} },
        }
      })

      const { resources } = setupApis()
      renderWithProviders(
        <ResourceCarousel title="My Carousel" config={config} />,
      )

      if (expectTabs) {
        const tabs = await screen.findAllByRole("tab")
        expect(tabs.map((tab) => tab.textContent)).toEqual(labels)
      } else {
        const tabs = screen.queryAllByRole("tab")
        expect(tabs).toHaveLength(0)
      }

      await screen.findByText(resources.list.results[1].title)
      await screen.findByText(resources.list.results[0].title)
      await screen.findByText(resources.list.results[2].title)
    },
  )

  it("calls API with expected parameters", async () => {
    const config: ResourceCarouselProps["config"] = [
      {
        label: "Resources",
        data: {
          type: "resources",
          params: { resource_type: ["course", "program"], professional: true },
        },
      },
    ]
    setMockResponse.get(urls.userMe.get(), {})
    setupApis()
    renderWithProviders(
      <ResourceCarousel title="My Carousel" config={config} />,
    )
    await waitFor(() => {
      expect(makeRequest.mock.calls.length > 0).toBe(true)
    })
    const [_method, url] = makeRequest.mock.calls[0]
    const urlParams = new URLSearchParams(url.split("?")[1])
    expect(urlParams.getAll("resource_type")).toEqual(["course", "program"])
    expect(urlParams.get("professional")).toEqual("true")
  })

  it("Shows the correct title", () => {
    const config: ResourceCarouselProps["config"] = [
      {
        label: "Resources",
        data: {
          type: "resources",
          params: { resource_type: ["course", "program"], professional: true },
        },
      },
    ]
    setMockResponse.get(urls.userMe.get(), {})
    setupApis()
    renderWithProviders(
      <ResourceCarousel title="My Favorite Carousel" config={config} />,
    )
    expect(
      screen.getByRole("heading", { name: "My Favorite Carousel" }),
    ).toBeInTheDocument()
  })
})
