import React from "react"
import {
  renderWithProviders,
  screen,
  within,
  user,
  waitFor,
} from "@/test-utils"
import SearchPage from "./SearchPage"
import { setMockResponse, urls, factories, makeRequest } from "api/test-utils"
import type {
  LearningResourceSearchResponse,
  PaginatedLearningResourceOfferorList,
} from "api"
import invariant from "tiny-invariant"

const setMockApiResponses = ({
  search,
  offerors,
}: {
  search?: Partial<LearningResourceSearchResponse>
  offerors?: PaginatedLearningResourceOfferorList
}) => {
  setMockResponse.get(expect.stringContaining(urls.search.resources()), {
    count: 0,
    next: null,
    previous: null,
    results: [],
    metadata: {
      aggregations: {},
      suggestions: [],
    },
    ...search,
  })
  setMockResponse.get(
    urls.offerors.list(),
    offerors ?? factories.learningResources.offerors({ count: 5 }),
  )
}

const getLastApiSearchParams = () => {
  const call = makeRequest.mock.calls.find(([method, url]) => {
    if (method !== "get") return false
    return url.startsWith(urls.search.resources())
  })
  invariant(call)
  const [_method, url] = call
  const fullUrl = new URL(url, "http://mit.edu")
  return fullUrl.searchParams
}

describe("SearchPage", () => {
  test("Renders search results", async () => {
    const resources = factories.learningResources.resources({
      count: 10,
    }).results
    setMockApiResponses({
      search: {
        count: 1000,
        metadata: {
          aggregations: {
            resource_type: [
              { key: "course", doc_count: 100 },
              { key: "podcast", doc_count: 200 },
              { key: "program", doc_count: 300 },
              { key: "irrelevant", doc_count: 400 },
            ],
          },
          suggestions: [],
        },
        results: resources,
      },
    })
    renderWithProviders(<SearchPage />)
    const tabpanel = await screen.findByRole("tabpanel")
    const headings = await within(tabpanel).findAllByRole("heading")
    expect(headings.length).toBe(10)
    expect(headings.map((h) => h.textContent)).toEqual(
      resources.map((r) => r.title),
    )
  })

  test.each([
    { url: "?resource_type=course", expectedActive: /Courses/ },
    { url: "?resource_type=podcast", expectedActive: /Podcasts/ },
    { url: "", expectedActive: /All/ },
  ])("Active tab determined by URL $url", async ({ url, expectedActive }) => {
    setMockApiResponses({
      search: {
        count: 1000,
        metadata: {
          aggregations: {
            resource_type: [
              { key: "course", doc_count: 100 },
              { key: "podcast", doc_count: 200 },
              { key: "program", doc_count: 300 },
              { key: "irrelevant", doc_count: 400 },
            ],
          },
          suggestions: [],
        },
      },
    })
    renderWithProviders(<SearchPage />, { url })
    const tab = screen.getByRole("tab", { selected: true })
    expect(tab).toHaveAccessibleName(expectedActive)
  })

  test("Clicking tabs updates URL", async () => {
    setMockApiResponses({
      search: {
        count: 1000,
        metadata: {
          aggregations: {
            resource_type: [
              { key: "course", doc_count: 100 },
              { key: "podcast", doc_count: 200 },
              { key: "program", doc_count: 300 },
              { key: "irrelevant", doc_count: 400 },
            ],
          },
          suggestions: [],
        },
      },
    })
    const { location } = renderWithProviders(<SearchPage />)
    const tabAll = screen.getByRole("tab", { name: /All/ })
    const tabCourses = screen.getByRole("tab", { name: /Courses/ })
    expect(tabAll).toHaveAttribute("aria-selected")
    await user.click(tabCourses)
    expect(tabCourses).toHaveAttribute("aria-selected")
    expect(
      new URLSearchParams(location.current.search).get("resource_type"),
    ).toBe("course")
    await user.click(tabAll)
    expect(tabAll).toHaveAttribute("aria-selected")
    expect(
      new URLSearchParams(location.current.search).get("resource_type"),
    ).toBe(null)
  })

  test("Tab titles show corret result counts", async () => {
    setMockApiResponses({
      search: {
        count: 700,
        metadata: {
          aggregations: {
            resource_type: [
              { key: "course", doc_count: 100 },
              { key: "podcast", doc_count: 200 },
              { key: "irrelevant", doc_count: 400 },
            ],
          },
          suggestions: [],
        },
      },
    })
    renderWithProviders(<SearchPage />)
    const tabs = screen.getAllByRole("tab")
    // initially (before API response) not result counts
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "All",
      "Courses",
      "Programs",
      "Podcasts",
    ])
    // eventually (after API response) result counts show
    await waitFor(() => {
      expect(tabs.map((tab) => tab.textContent)).toEqual([
        "All (300)",
        "Courses (100)",
        "Programs (0)",
        "Podcasts (200)",
      ])
    })
  })

  test.each([
    { url: "?topic=physics", expected: { topic: "physics" } },
    {
      url: "?resource_type=course",
      expected: { resource_type: "course" },
    },
    { url: "?q=woof", expected: { q: "woof" } },
  ])(
    "Makes API call with correct facets and aggregations",
    async ({ url, expected }) => {
      setMockApiResponses({
        search: {
          count: 700,
          metadata: {
            aggregations: {
              topic: [
                { key: "physics", doc_count: 100 },
                { key: "chemistry", doc_count: 200 },
              ],
            },
            suggestions: [],
          },
        },
      })
      renderWithProviders(<SearchPage />, { url })
      await waitFor(() => {
        expect(makeRequest.mock.calls.length > 0).toBe(true)
      })
      const apiSearchParams = getLastApiSearchParams()
      expect(apiSearchParams.getAll("aggregations").sort()).toEqual([
        "offered_by",
        "resource_type",
        "topic",
      ])
      expect(Object.fromEntries(apiSearchParams.entries())).toEqual(
        expect.objectContaining(expected),
      )
    },
  )

  test("Toggling facets", async () => {
    setMockApiResponses({
      search: {
        count: 700,
        metadata: {
          aggregations: {
            topic: [
              { key: "Physics", doc_count: 100 }, // Physics
              { key: "Chemistry", doc_count: 200 }, // Chemistry
            ],
          },
          suggestions: [],
        },
      },
    })
    const { location } = renderWithProviders(<SearchPage />, {
      url: "?topic=Physics&topic=Chemistry",
    })
    const clearAll = await screen.findByRole("button", { name: /clear all/i })
    const physics = await screen.findByRole("checkbox", { name: "Physics" })
    const chemistry = await screen.findByRole("checkbox", { name: "Chemistry" })
    // initial
    expect(physics).toBeChecked()
    expect(chemistry).toBeChecked()
    // clear all
    await user.click(clearAll)
    expect(location.current.search).toBe("")
    expect(physics).not.toBeChecked()
    expect(chemistry).not.toBeChecked()
    // toggle physics
    await user.click(physics)
    expect(physics).toBeChecked()
    expect(location.current.search).toBe("?topic=Physics")
  })

  test("Submitting text updates URL", async () => {
    setMockApiResponses({})
    const { location } = renderWithProviders(<SearchPage />, { url: "?q=meow" })
    const queryInput = await screen.findByRole<HTMLInputElement>("textbox", {
      name: "Search for",
    })
    expect(queryInput.value).toBe("meow")
    await user.clear(queryInput)
    await user.paste("woof")
    expect(location.current.search).toBe("?q=meow")
    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(location.current.search).toBe("?q=woof")
  })
})

test("Facet 'Offered By' uses API response for names", async () => {
  const offerors = factories.learningResources.offerors({ count: 3 })
  setMockApiResponses({
    offerors,
    search: {
      metadata: {
        aggregations: {
          offered_by: offerors.results.map((o) => ({
            key: o.code,
            doc_count: 10,
          })),
        },
        suggestions: [],
      },
    },
  })
  renderWithProviders(<SearchPage />)
  const offeror0 = await screen.findByRole("checkbox", {
    name: offerors.results[0].name,
  })
  const offeror1 = await screen.findByRole("checkbox", {
    name: offerors.results[1].name,
  })
  const offeror2 = await screen.findByRole("checkbox", {
    name: offerors.results[2].name,
  })
  expect(offeror0).toBeVisible()
  expect(offeror1).toBeVisible()
  expect(offeror2).toBeVisible()
})

test("Clearing text updates URL", async () => {
  setMockApiResponses({})
  const { location } = renderWithProviders(<SearchPage />, { url: "?q=meow" })
  await user.click(screen.getByRole("button", { name: "Clear search text" }))
  expect(location.current.search).toBe("")
})

/**
 * Simple tests to check that data / handlers with pagination controls are
 * working as expected.
 */
describe("Search Page pagination controls", () => {
  const getPagination = () =>
    screen.getByRole("navigation", { name: "pagination navigation" })

  test("?page URLSearchParam controls activate page", async () => {
    setMockApiResponses({ search: { count: 137 } })
    renderWithProviders(<SearchPage />, { url: "?page=3" })
    const pagination = getPagination()
    // p3 is current page
    await within(pagination).findByRole("button", {
      name: "page 3",
      current: true,
    })
    // as opposed to p4
    await within(pagination).findByRole("button", { name: "Go to page 4" })
  })

  test("Clicking on a page updates URL", async () => {
    setMockApiResponses({ search: { count: 137 } })
    const { location } = renderWithProviders(<SearchPage />, {
      url: "?page=3",
    })
    const pagination = getPagination()
    const p4 = await within(pagination).findByRole("button", {
      name: "Go to page 4",
    })
    await user.click(p4)
    await waitFor(() => {
      const params = new URLSearchParams(location.current.search)
      expect(params.get("page")).toBe("4")
    })
  })

  test("Max page is determined by count", async () => {
    setMockApiResponses({ search: { count: 137 } })
    renderWithProviders(<SearchPage />, { url: "?page=3" })
    const pagination = getPagination()
    // p14 exists
    await within(pagination).findByRole("button", { name: "Go to page 14" })
    // items
    const items = await within(pagination).findAllByRole("listitem")
    expect(items.at(-2)?.textContent).toBe("14") // "Last page"
    expect(items.at(-1)?.textContent).toBe("") // "Next" button
  })
})
