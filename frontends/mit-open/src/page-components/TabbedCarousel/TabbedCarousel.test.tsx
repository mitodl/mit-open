import React from "react"
import TabbedCarousel from "./TabbedCarousel"
import type { TabbedCarouselProps } from "./TabbedCarousel"
import { renderWithProviders, screen, user, waitFor } from "@/test-utils"
import { factories, setMockResponse, makeRequest, urls } from "api/test-utils"
import { act } from "react-dom/test-utils"

describe("TabbedCarousel", () => {
  const setupApis = () => {
    const resources = {
      search: factories.learningResources.resources({ count: 10 }),
      list: factories.learningResources.resources({ count: 10 }),
      upcoming: factories.learningResources.resources({ count: 10 }),
    }
    setMockResponse.get(
      expect.stringContaining(urls.learningResources.upcoming()),
      resources.upcoming,
    )
    setMockResponse.get(
      expect.stringContaining(urls.search.resources()),
      resources.search,
    )
    setMockResponse.get(
      expect.stringContaining(urls.learningResources.list()),
      resources.list,
    )
    return resources
  }

  test("it returns results from the correct endpoint", async () => {
    const config: TabbedCarouselProps["config"] = [
      {
        label: "Resources",
        pageSize: 4,
        data: {
          type: "resources",
          params: { resource_type: ["video", "podcast"] },
        },
      },
      {
        label: "Upcoming",
        pageSize: 4,
        data: {
          type: "resources_upcoming",
          params: { resource_type: ["video"] },
        },
      },
      {
        label: "Search",
        pageSize: 4,
        data: {
          type: "lr_search",
          params: { professional: true },
        },
      },
    ]
    const { list, search, upcoming } = setupApis()
    renderWithProviders(<TabbedCarousel config={config} />)
    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveTextContent("Resources")
    expect(tabs[1]).toHaveTextContent("Upcoming")
    expect(tabs[2]).toHaveTextContent("Search")

    await screen.findByText(list.results[0].title)
    await user.click(tabs[1])
    await screen.findByText(upcoming.results[0].title)
    await user.click(tabs[2])
    await act(() => {
      return new Promise((resolve) => setTimeout(resolve, 1000))
    })
    await screen.findByText(search.results[0].title)
  })

  it("calls API with expected parameters", async () => {
    const config: TabbedCarouselProps["config"] = [
      {
        label: "Resources",
        pageSize: 4,
        data: {
          type: "resources",
          params: { resource_type: ["course", "program"], professional: true },
        },
      },
    ]
    setupApis()
    renderWithProviders(<TabbedCarousel config={config} />)
    await waitFor(() => {
      expect(makeRequest.mock.calls.length > 0).toBe(true)
    })
    const [_method, url] = makeRequest.mock.calls[0]
    const urlParams = new URLSearchParams(url.split("?")[1])
    expect(urlParams.getAll("resource_type")).toEqual(["course", "program"])
    expect(urlParams.get("professional")).toEqual("true")
  })
})
