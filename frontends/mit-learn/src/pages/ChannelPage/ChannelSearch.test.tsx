import { screen, within, waitFor, renderTestApp, user } from "@/test-utils"
import { setMockResponse, urls, factories, makeRequest } from "api/test-utils"
import type { LearningResourcesSearchResponse } from "api"
import invariant from "tiny-invariant"
import { makeWidgetListResponse } from "ol-widgets/src/factories"
import type { Channel } from "api/v0"
import { ChannelTypeEnum } from "api/v0"

const setMockApiResponses = ({
  search,
  channelPatch,
}: {
  search?: Partial<LearningResourcesSearchResponse>
  channelPatch?: Partial<Channel>
}) => {
  const channel = factories.channels.channel(channelPatch)
  const urlParams = new URLSearchParams(channelPatch?.search_filter)
  const subscribeParams: Record<string, string[] | string> = {}
  for (const [key, value] of urlParams.entries()) {
    subscribeParams[key] = value.split(",")
  }
  subscribeParams["source_type"] = "channel_subscription_type"
  if (channelPatch?.search_filter) {
    setMockResponse.get(
      `${urls.userSubscription.check(subscribeParams)}`,
      factories.percolateQueries,
    )
  }
  setMockResponse.get(
    urls.learningResources.featured({ limit: 12, offered_by: ["ocw"] }),
    factories.learningResources.resources({ count: 0 }),
  )
  setMockResponse.get(
    urls.learningResources.featured({ limit: 12 }),
    factories.learningResources.resources({ count: 0 }),
  )

  setMockResponse.get(
    urls.userSubscription.check({ source_type: "channel_subscription_type" }),
    factories.percolateQueries,
  )
  setMockResponse.get(
    urls.channels.details(channel.channel_type, channel.name),
    channel,
  )

  const widgetsList = makeWidgetListResponse()
  setMockResponse.get(
    urls.widgetLists.details(channel.widget_list || -1),
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

  setMockResponse.get(expect.stringContaining(urls.testimonials.list({})), {
    results: [],
  })

  if (
    channel.channel_type === ChannelTypeEnum.Topic &&
    channel.topic_detail.topic
  ) {
    setMockResponse.get(
      urls.topics.list({ parent_topic_id: [channel.topic_detail.topic] }),
      factories.learningResources.topics({ count: 5 }),
    )
    setMockResponse.get(
      urls.topics.list({ is_toplevel: true }),
      factories.learningResources.topics({ count: 5 }),
    )
  }

  return {
    channel,
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

describe("ChannelSearch", () => {
  test("Renders search results", async () => {
    const resources = factories.learningResources.resources({
      count: 10,
    }).results
    const { channel } = setMockApiResponses({
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
    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
    await screen.findAllByText(channel.title)
    const tabpanel = await screen.findByRole("tabpanel")
    for (const resource of resources) {
      await within(tabpanel).findByText(resource.title)
    }
  }, 10000)

  test.each([
    {
      searchFilter: "offered_by=ocw",
      url: "?topic=physics",
      expected: { offered_by: "ocw", topic: "physics" },
    },
    {
      searchFilter: "offered_by=ocw",
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
      const { channel } = setMockApiResponses({
        channelPatch: { search_filter: searchFilter },
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

      renderTestApp({
        url: `/c/${channel.channel_type}/${channel.name}/${url}`,
      })

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
      channelType: ChannelTypeEnum.Topic,
      displayedFacets: [
        "Professional",
        "Certificate",
        "Offered By",
        "Department",
        "Format",
      ],
    },
    {
      channelType: ChannelTypeEnum.Department,
      displayedFacets: ["Certificate", "Offered By", "Topic", "Format"],
    },
    {
      channelType: ChannelTypeEnum.Unit,
      displayedFacets: ["Certificate", "Department", "Topic", "Format"],
    },
    {
      channelType: ChannelTypeEnum.Pathway,
      displayedFacets: [],
    },
  ])(
    "Displays the correct facets for the channelType",
    async ({ channelType, displayedFacets }) => {
      const { channel } = setMockApiResponses({
        channelPatch: { channel_type: channelType },
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
              delivery: [{ key: "online", doc_count: 100 }],
              certification_type: [{ key: "micromasters", doc_count: 100 }],
            },
            suggestions: [],
          },
        },
      })

      setMockResponse.get(urls.userMe.get(), {})

      renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}/` })

      await waitFor(() => {
        expect(makeRequest.mock.calls.length > 0).toBe(true)
      })

      const facetsContainer = screen.getByTestId("facets-container")

      for (const facetName of [
        "Professional",
        "Certificate",
        "Department",
        "Offered By",
        "Topic",
        "Format",
      ]) {
        if ((displayedFacets as string[]).includes(facetName as string)) {
          await within(facetsContainer).findByText(facetName)
        } else {
          expect(within(facetsContainer).queryByText(facetName)).toBeNull()
        }
      }
    },
  )

  test("Submitting search text updates URL correctly", async () => {
    const resources = factories.learningResources.resources({
      count: 10,
    }).results
    const { channel } = setMockApiResponses({
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

    const initialSearch = "?q=meow&page=2"
    const finalSearch = "?q=woof"

    const { location } = renderTestApp({
      url: `/c/${channel.channel_type}/${channel.name}${initialSearch}`,
    })

    const queryInput = await screen.findByRole<HTMLInputElement>("textbox", {
      name: "Search for",
    })
    expect(queryInput.value).toBe("meow")
    await user.clear(queryInput)
    await user.paste("woof")
    expect(location.current.search).toBe(initialSearch)
    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(location.current.search).toBe(finalSearch)
  })
})
