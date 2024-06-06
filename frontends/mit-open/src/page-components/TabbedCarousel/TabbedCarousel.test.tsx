import React from "react"
import TabbedCarousel from "./TabbedCarousel"
import type { TabbedCarouselProps } from "./TabbedCarousel"
import { renderWithProviders, screen, user, waitFor } from "@/test-utils"
import { factories, setMockResponse, makeRequest, urls } from "api/test-utils"
import { act } from "@testing-library/react"

describe("TabbedCarousel", () => {
  const setupApis = () => {
    const resources = {
      search: factories.learningResources.resources({ count: 10 }),
      list: factories.learningResources.resources({ count: 10 }),
    }
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
        data: {
          type: "resources",
          params: { resource_type: ["video", "podcast"] },
        },
      },
      {
        label: "Search",
        data: {
          type: "lr_search",
          params: { professional: true },
        },
      },
    ]

    setMockResponse.get(urls.userMe.get(), {})
    const { list, search } = setupApis()
    renderWithProviders(<TabbedCarousel title="My Carousel" config={config} />)
    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveTextContent("Resources")
    expect(tabs[1]).toHaveTextContent("Search")

    await screen.findByText(list.results[0].title)
    await user.click(tabs[0])
    await user.click(tabs[1])
    await act(() => {
      return new Promise((resolve) => setTimeout(resolve, 1000))
    })
    await screen.findByText(search.results[0].title)
  }, 10000)

  it("calls API with expected parameters", async () => {
    const config: TabbedCarouselProps["config"] = [
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
    renderWithProviders(<TabbedCarousel title="My Carousel" config={config} />)
    await waitFor(() => {
      expect(makeRequest.mock.calls.length > 0).toBe(true)
    })
    const [_method, url] = makeRequest.mock.calls[0]
    const urlParams = new URLSearchParams(url.split("?")[1])
    expect(urlParams.getAll("resource_type")).toEqual(["course", "program"])
    expect(urlParams.get("professional")).toEqual("true")
  })
})
