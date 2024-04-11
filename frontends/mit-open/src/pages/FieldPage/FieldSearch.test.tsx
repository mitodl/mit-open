import { screen, within, user, waitFor, renderTestApp } from "@/test-utils"
import { setMockResponse, urls, factories, makeRequest } from "api/test-utils"
import type { LearningResourceSearchResponse } from "api"
import invariant from "tiny-invariant"
import { makeWidgetListResponse } from "ol-widgets/src/factories"
import type { FieldChannel } from "api/v0"

const setMockApiResponses = ({
  search,
  fieldPatch,
}: {
  search?: Partial<LearningResourceSearchResponse>
  fieldPatch?: Partial<FieldChannel>
}) => {
  const field = factories.fields.field(fieldPatch)

  setMockResponse.get(
    urls.fields.details(field.channel_type, field.name),
    field,
  )

  const widgetsList = makeWidgetListResponse()
  setMockResponse.get(
    urls.widgetLists.details(field.widget_list || -1),
    widgetsList,
  )

  setMockResponse.get(
    urls.platforms.list(),
    factories.learningResources.platforms({ count: 5 }),
  )

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

  return {
    field,
  }
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

describe("FieldSearch", () => {
  test("Renders search results", async () => {
    const resources = factories.learningResources.resources({
      count: 10,
    }).results
    const { field } = setMockApiResponses({
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
    setMockResponse.get(urls.userMe.get(), {})
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)
    const tabpanel = await screen.findByRole("tabpanel")
    const headings = await within(tabpanel).findAllByRole("heading")
    expect(headings.map((h) => h.textContent)).toEqual(
      resources.map((r) => r.title),
    )
  })

  test.each([
    {
      searchFilter: "offered_by=ocw",
      url: "?topic=physics",
      expected: { offered_by: "ocw", topic: "physics" },
    },
    {
      searchFilter: "resource_type=program,course",
      url: "?resource_type=course",
      expected: { resource_type: "course" },
    },
    {
      searchFilter: "resource_type=program",
      url: "?resource_type=course",
      expected: { resource_type: "course" },
    },
  ])(
    "Makes API call with correct facets and aggregations",
    async ({ searchFilter, url, expected }) => {
      const { field } = setMockApiResponses({
        fieldPatch: { search_filter: searchFilter },
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
      setMockResponse.get(urls.userMe.get(), {})

      renderTestApp({ url: `/c/${field.channel_type}/${field.name}/${url}` })

      await waitFor(() => {
        expect(makeRequest.mock.calls.length > 0).toBe(true)
      })
      const apiSearchParams = getLastApiSearchParams()
      expect(apiSearchParams.getAll("aggregations").sort()).toEqual([
        "platform",
        "resource_type",
        "topic",
      ])
      expect(Object.fromEntries(apiSearchParams.entries())).toEqual(
        expect.objectContaining(expected),
      )
    },
  )

  test("Displaying and toggling facets", async () => {
    const { field } = setMockApiResponses({
      fieldPatch: { search_filter: "topic=physics,chemistry" },
      search: {
        count: 700,
        metadata: {
          aggregations: {
            topic: [
              { key: "physics", doc_count: 100 },
              { key: "chemistry", doc_count: 200 },
              { key: "literature", doc_count: 200 },
            ],
            resource_type: [
              { key: "course", doc_count: 100 },
              { key: "program", doc_count: 100 },
            ],
          },
          suggestions: [],
        },
      },
    })
    setMockResponse.get(urls.userMe.get(), {})

    const { location } = renderTestApp({
      url: `/c/${field.channel_type}/${field.name}/`,
    })
    expect(location.current.search).toBe("")

    const resourceTypeDropdown = await screen.findByText("resource type")

    expect(screen.queryByText("topic")).toBeNull()

    await user.click(resourceTypeDropdown)

    let courseSelect = await screen.findByRole("option", {
      name: /Course/i,
    })

    expect(courseSelect).toHaveAttribute("aria-selected", "false")

    await user.click(courseSelect)

    expect(location.current.search).toBe("?resource_type=course")

    courseSelect = await screen.findByRole("option", {
      name: /Course/i,
    })

    expect(courseSelect).toHaveAttribute("aria-selected", "true")

    await user.click(courseSelect)

    expect(location.current.search).toBe("")

    courseSelect = await screen.findByRole("option", {
      name: /Course/i,
    })

    expect(courseSelect).toHaveAttribute("aria-selected", "false")
  })
})
