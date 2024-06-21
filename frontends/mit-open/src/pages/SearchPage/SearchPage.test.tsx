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
  PaginatedLearningResourceOfferorDetailList,
} from "api"
import invariant from "tiny-invariant"
import { Permissions } from "@/common/permissions"

const setMockApiResponses = ({
  search,
  offerors,
}: {
  search?: Partial<LearningResourceSearchResponse>
  offerors?: PaginatedLearningResourceOfferorDetailList
}) => {
  setMockResponse.get(urls.userMe.get(), {
    [Permissions.Authenticated]: false,
  })

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
    for (const resource of resources) {
      await within(tabpanel).findByText(resource.title)
    }
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
        "certification_type",
        "department",
        "free",
        "learning_format",
        "offered_by",
        "professional",
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
    expect(clearAll).not.toBeVisible()
    expect(location.current.search).toBe("")
    expect(physics).not.toBeChecked()
    expect(chemistry).not.toBeChecked()
    // toggle physics
    await user.click(physics)
    await screen.findByRole("button", { name: /clear all/i }) // Clear All shows again
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

describe("Search Page Tabs", () => {
  test.each([
    { url: "", expectedActive: /All/ },
    { url: "?all", expectedActive: /All/ },
    { url: "?tab=courses", expectedActive: /Courses/ },
    { url: "?tab=programs", expectedActive: /Programs/ },
    { url: "?tab=learning-materials", expectedActive: /Learning Materials/ },
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
    const { location } = renderWithProviders(<SearchPage />, {
      url: "?department=8",
    })
    const tabAll = screen.getByRole("tab", { name: /All/ })
    const tabCourses = screen.getByRole("tab", { name: /Courses/ })
    expect(tabAll).toHaveAttribute("aria-selected")

    // Click "Courses"
    await user.click(tabCourses)
    expect(tabCourses).toHaveAttribute("aria-selected")
    const params1 = new URLSearchParams(location.current.search)
    expect(params1.get("tab")).toBe("courses")
    expect(params1.get("department")).toBe("8") // should preserve other params

    // Click "All"
    await user.click(tabAll)
    expect(tabAll).toHaveAttribute("aria-selected")
    const params2 = new URLSearchParams(location.current.search)
    expect(params2.get("tab")).toBe(null)
    expect(params2.get("department")).toBe("8") // should preserve other params
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
              { key: "video", doc_count: 300 },
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
      "Learning Materials",
    ])
    // eventually (after API response) result counts show
    await waitFor(() => {
      expect(
        tabs.map((tab) => (tab.textContent || "").replace(/\s/g, "")),
      ).toEqual([
        "All(600)",
        "Courses(100)",
        "Programs(0)",
        "LearningMaterials(500)",
      ])
    })
  })

  test("Changing tab resets page number", async () => {
    setMockApiResponses({
      search: {
        count: 1000,
        metadata: {
          aggregations: {},
          suggestions: [],
        },
      },
    })

    const { location } = renderWithProviders(<SearchPage />, {
      url: "?page=3&tab=courses",
    })
    const tabPrograms = screen.getByRole("tab", { name: /Programs/ })
    await user.click(tabPrograms)
    expect(location.current.search).toBe("?tab=programs")
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
  const showFacetButton = await screen.findByRole("button", {
    name: /Offered By/i,
  })

  await user.click(showFacetButton)

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

test("Set sort", async () => {
  setMockApiResponses({ search: { count: 137 } })

  const { location } = renderWithProviders(<SearchPage />)

  let sortDropdowns = await screen.findAllByText("Sort by: Best Match")
  let sortDropdown = sortDropdowns[0]

  await user.click(sortDropdown)

  const noneSelect = await screen.findByRole("option", {
    name: "Best Match",
  })

  expect(noneSelect).toHaveAttribute("aria-selected", "true")

  let popularitySelect = await screen.findByRole("option", {
    name: /Popular/i,
  })

  expect(popularitySelect).toHaveAttribute("aria-selected", "false")

  await user.click(popularitySelect)

  expect(location.current.search).toBe("?sortby=-views")

  sortDropdowns = await screen.findAllByText("Sort by: Popular")
  sortDropdown = sortDropdowns[0]

  await user.click(sortDropdown)

  popularitySelect = await screen.findByRole("option", {
    name: /Popular/i,
  })

  expect(popularitySelect).toHaveAttribute("aria-selected", "true")
})

test("The professional toggle updates the professional setting", async () => {
  setMockApiResponses({ search: { count: 137 } })
  const { location } = renderWithProviders(<SearchPage />)
  const professionalToggle = await screen.getAllByText("Professional")[0]
  await user.click(professionalToggle)
  await waitFor(() => {
    const params = new URLSearchParams(location.current.search)
    expect(params.get("professional")).toBe("true")
  })
  const academicToggle = await screen.getAllByText("Academic")[0]
  await user.click(academicToggle)
  await waitFor(() => {
    const params = new URLSearchParams(location.current.search)
    expect(params.get("professional")).toBe("false")
  })
  const viewAllToggle = await screen.getAllByText("All")[0]
  await user.click(viewAllToggle)
  await waitFor(() => {
    const params = new URLSearchParams(location.current.search)
    expect(params.get("professional")).toBe(null)
  })
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
