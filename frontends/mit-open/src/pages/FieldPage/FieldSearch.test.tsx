import { screen, within, user, waitFor, renderTestApp } from "@/test-utils"
import { setMockResponse, urls, factories, makeRequest } from "api/test-utils"
import type { LearningResourceSearchResponse } from "api"
import invariant from "tiny-invariant"
import { makeWidgetListResponse } from "ol-widgets/src/factories"
import type { FieldChannel } from "api/v0"
import { ChannelTypeEnum } from "api/v0"

const setMockApiResponses = ({
  search,
  fieldPatch,
}: {
  search?: Partial<LearningResourceSearchResponse>
  fieldPatch?: Partial<FieldChannel>
}) => {
  const field = factories.fields.field(fieldPatch)
  const urlParams = new URLSearchParams(fieldPatch?.search_filter)
  const subscribeParams: Record<string, string[]> = {}
  for (const [key, value] of urlParams.entries()) {
    subscribeParams[key] = value.split(",")
  }
  if (fieldPatch?.search_filter) {
    setMockResponse.get(
      `${urls.userSubscription.list(subscribeParams)}`,
      factories.percolateQueries,
    )
  }

  setMockResponse.get(urls.userSubscription.list(), factories.percolateQueries)
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

  setMockResponse.get(
    urls.offerors.list(),
    factories.learningResources.offerors({ count: 5 }),
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
  }, 10000)

  test.each([
    {
      searchFilter: "offered_by=ocw",
      url: "?topic=physics",
      expected: { offered_by: "ocw", topic: "physics" },
    },
    {
      searchFilter: "offered_by=ocw&offered_by=xpro",
      url: "?offered_by=xpro&topic=physics",
      expected: { offered_by: "xpro", topic: "physics" },
    },
    {
      searchFilter: "offered_by=ocw",
      url: "?offered_by=xpro&topic=physics",
      expected: { offered_by: "xpro", topic: "physics" },
    },
  ])(
    "Filters by combined parameters from the search_filter and the url",
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
              department: [{ key: "1", doc_count: 100 }],
              level: [{ key: "graduate", doc_count: 100 }],
              resource_type: [{ key: "course", doc_count: 100 }],
              platform: [{ key: "ocw", doc_count: 100 }],
              offered_by: [{ key: "ocw", doc_count: 100 }],
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
      expect(Object.fromEntries(apiSearchParams.entries())).toEqual(
        expect.objectContaining(expected),
      )
    },
  )

  test.each([
    {
      fieldType: ChannelTypeEnum.Topic,
      displayedFacets: [
        "Resource Type",
        "Offered By",
        "Department",
        "Level",
        "Certification",
      ],
    },
    {
      fieldType: ChannelTypeEnum.Department,
      displayedFacets: [
        "Resource Type",
        "Offered By",
        "Topic",
        "Level",
        "Certification",
      ],
    },
    {
      fieldType: ChannelTypeEnum.Offeror,
      displayedFacets: ["Resource Type", "Topic", "Platform", "Certification"],
    },
    {
      fieldType: ChannelTypeEnum.Pathway,
      displayedFacets: [],
    },
  ])(
    "Displays the correct facets for the fieldType",
    async ({ fieldType, displayedFacets }) => {
      const { field } = setMockApiResponses({
        fieldPatch: { channel_type: fieldType },
        search: {
          count: 700,
          metadata: {
            aggregations: {
              topic: [
                { key: "physics", doc_count: 100 },
                { key: "chemistry", doc_count: 200 },
              ],
              department: [{ key: "1", doc_count: 100 }],
              level: [{ key: "graduate", doc_count: 100 }],
              resource_type: [{ key: "course", doc_count: 100 }],
              platform: [{ key: "ocw", doc_count: 100 }],
              offered_by: [{ key: "ocw", doc_count: 100 }],
              certification: [{ key: "true", doc_count: 100 }],
            },
            suggestions: [],
          },
        },
      })

      setMockResponse.get(urls.userMe.get(), {})

      renderTestApp({ url: `/c/${field.channel_type}/${field.name}/` })

      await waitFor(() => {
        expect(makeRequest.mock.calls.length > 0).toBe(true)
      })

      for (const dropdownName of [
        "Department",
        "Level",
        "Learning Resource",
        "Level",
        "Offered By",
        "Platforn",
        "Topic",
        "Certification",
      ]) {
        if (dropdownName in displayedFacets) {
          await screen.findByText(dropdownName)
        } else {
          expect(screen.queryByText(dropdownName)).toBeNull()
        }
      }
    },
  )

  test("Multi-select facets should be displayed and toggleable", async () => {
    const { field } = setMockApiResponses({
      fieldPatch: {
        channel_type: ChannelTypeEnum.Department,
        search_filter: "offered_by=ocw",
      },
      search: {
        count: 700,
        metadata: {
          aggregations: {
            resource_type: [
              { key: "course", doc_count: 100 },
              { key: "program", doc_count: 100 },
            ],
          },
          suggestions: [],
        },
        results: [],
      },
    })
    setMockResponse.get(urls.userMe.get(), {})

    const { location } = renderTestApp({
      url: `/c/${field.channel_type}/${field.name}/`,
    })
    expect(location.current.search).toBe("")

    let resourceTypeDropdown = await screen.findByText("Resource Type")

    await user.click(resourceTypeDropdown)

    let courseSelect = await screen.findByRole("option", {
      name: /Course/i,
    })

    expect(courseSelect).toHaveAttribute("aria-selected", "false")

    await user.click(courseSelect)

    expect(location.current.search).toBe("?resource_type=course")

    resourceTypeDropdown = await screen.findByText("Resource Type")

    await user.click(resourceTypeDropdown)

    courseSelect = await screen.findByRole("option", {
      name: /Course/i,
    })

    expect(courseSelect).toHaveAttribute("aria-selected", "true")

    await user.click(courseSelect)

    expect(location.current.search).toBe("")

    courseSelect = await screen.findByText("Course")

    expect(courseSelect).toHaveAttribute("aria-selected", "false")
  })

  test("Boolean facets should be displayed and toggleable", async () => {
    const { field } = setMockApiResponses({
      fieldPatch: {
        channel_type: ChannelTypeEnum.Department,
        search_filter: "offered_by=ocw",
      },
      search: {
        count: 700,
        metadata: {
          aggregations: {
            certification: [
              { key: "true", doc_count: 100 },
              { key: "false", doc_count: 100 },
            ],
          },
          suggestions: [],
        },
        results: [],
      },
    })

    setMockResponse.get(urls.userMe.get(), {})

    const { location } = renderTestApp({
      url: `/c/${field.channel_type}/${field.name}/`,
    })
    expect(location.current.search).toBe("")
    await waitFor(() => {
      expect(makeRequest.mock.calls.length > 0).toBe(true)
    })

    let certificationDropdown = await screen.findByText("Certification")

    await user.click(certificationDropdown)

    let noneSelect = await screen.findByRole("option", {
      name: "no selection",
    })

    expect(noneSelect).toHaveAttribute("aria-selected", "true")

    let trueSelect = await screen.findByRole("option", {
      name: /true/i,
    })

    expect(trueSelect).toHaveAttribute("aria-selected", "false")

    await user.click(trueSelect)

    expect(location.current.search).toBe("?certification=true")

    certificationDropdown = await screen.findByText("Certification")

    await user.click(certificationDropdown)

    trueSelect = await screen.findByRole("option", {
      name: /true/i,
    })

    expect(trueSelect).toHaveAttribute("aria-selected", "true")

    let falseSelect = await screen.findByRole("option", {
      name: /false/i,
    })

    expect(falseSelect).toHaveAttribute("aria-selected", "false")

    await user.click(falseSelect)

    expect(location.current.search).toBe("?certification=false")

    certificationDropdown = await screen.findByText("Certification")

    await user.click(certificationDropdown)

    falseSelect = await screen.findByRole("option", {
      name: /false/i,
    })

    expect(falseSelect).toHaveAttribute("aria-selected", "true")

    trueSelect = await screen.findByRole("option", {
      name: /true/i,
    })

    expect(trueSelect).toHaveAttribute("aria-selected", "false")

    noneSelect = await screen.findByRole("option", {
      name: /no selection/i,
    })

    expect(noneSelect).toHaveAttribute("aria-selected", "false")

    await user.click(noneSelect)

    expect(location.current.search).toBe("")
  }, 10000)
})
