import React from "react"
import { urls, factories, makeRequest } from "api/test-utils"
import { ChannelTypeEnum, type Channel } from "api/v0"
import type { LearningResourcesSearchResponse } from "api"
import {
  screen,
  setMockResponse,
  waitFor,
  renderWithProviders,
} from "@/test-utils"
import ChannelSearch from "./ChannelSearch"
import { assertHeadings, getByImageSrc } from "ol-test-utilities"
import invariant from "tiny-invariant"
import ChannelPage from "./ChannelPage"

jest.mock("./ChannelSearch", () => {
  const actual = jest.requireActual("./ChannelSearch")
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  }
})
const mockedChannelSearch = jest.mocked(ChannelSearch)

const someAncestor = (el: HTMLElement, cb: (el: HTMLElement) => boolean) => {
  let ancestor = el.parentElement
  while (ancestor) {
    if (cb(ancestor)) return true
    ancestor = ancestor.parentElement
  }
  return false
}

const setupApis = (
  channelPatch?: Partial<Channel>,
  search?: Partial<LearningResourcesSearchResponse>,
  { isSubscribed = false, isAuthenticated = false } = {},
) => {
  const channel = factories.channels.channel(channelPatch)
  setMockResponse.get(urls.userMe.get(), {
    is_authenticated: isAuthenticated,
  })
  setMockResponse.get(
    urls.channels.details(channel.channel_type, channel.name),
    channel,
  )
  setMockResponse.get(
    expect.stringContaining(urls.learningResources.featured()),
    factories.learningResources.resources({ count: 10 }),
  )

  const urlParams = new URLSearchParams(channelPatch?.search_filter)
  const subscribeParams: Record<string, string[] | string> = {}
  for (const [key, value] of urlParams.entries()) {
    if (
      subscribeParams[key] !== undefined &&
      Array.isArray(subscribeParams[key])
    ) {
      subscribeParams[key] = [...subscribeParams[key], value]
    } else {
      subscribeParams[key] = [value]
    }
  }
  subscribeParams["source_type"] = "channel_subscription_type"
  const subscribeResponse = isSubscribed
    ? factories.percolateQueries.percolateQueryList({ count: 1 }).results
    : factories.percolateQueries.percolateQueryList({ count: 0 }).results
  if (channelPatch?.search_filter) {
    setMockResponse.get(
      `${urls.userSubscription.check(subscribeParams)}`,
      subscribeResponse,
    )
  }

  setMockResponse.get(
    `${urls.userSubscription.check({
      source_type: "channel_subscription_type",
    })}`,
    subscribeResponse,
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

  return {
    channel,
  }
}

const setupTopicApis = (channel: Channel) => {
  invariant(
    channel.channel_type === ChannelTypeEnum.Topic,
    "Topic channel must have a topic",
  )
  const topic = factories.learningResources.topic()
  channel.channel_url = `/c/${channel.channel_type}/${channel.name.replace(/\s/g, "-")}`
  topic.channel_url = channel.channel_url
  topic.id = channel.topic_detail.topic ?? 0
  const subTopics = factories.learningResources.topics({ count: 5 })
  setMockResponse.get(urls.topics.get(topic.id), topic)
  setMockResponse.get(
    urls.topics.list({ parent_topic_id: [topic.id] }),
    subTopics,
  )
  const subTopicChannels = subTopics.results.map((subTopic) => {
    subTopic.parent = topic.id
    const subTopicChannel = factories.channels.channel({
      channel_type: ChannelTypeEnum.Topic,
      name: subTopic.name.replace(/\s/g, "-"),
      title: subTopic.name,
      topic_detail: { topic: subTopic.id },
    })
    const channelUrl = `/c/${subTopicChannel.channel_type}/${subTopicChannel.name.replace(/\s/g, "-")}`
    subTopic.channel_url = channelUrl
    subTopicChannel.channel_url = channelUrl
    setMockResponse.get(urls.topics.get(subTopic.id), subTopic)
    setMockResponse.get(
      urls.channels.details(
        subTopicChannel.channel_type,
        subTopicChannel.name.replace(/\s/g, "-"),
      ),
      subTopicChannel,
    )
    return subTopicChannel
  })
  return {
    topic,
    subTopics,
    subTopicChannels,
  }
}

const ALL_CHANNEL_TYPES = Object.values(ChannelTypeEnum).map((v) => ({
  channelType: v,
}))
const NON_UNIT_CHANNEL_TYPES = Object.values(ChannelTypeEnum)
  .filter((v) => v !== ChannelTypeEnum.Unit)
  .map((v) => ({ channelType: v }))

describe.each(ALL_CHANNEL_TYPES)(
  "ChannelPage, common behavior",
  ({ channelType }) => {
    it("Displays the channel search if search_filter is not undefined", async () => {
      const { channel } = setupApis({
        search_filter:
          "platform=ocw&platform=mitxonline&department=8&department=9",
        channel_type: channelType,
      })
      renderWithProviders(<ChannelPage />, {
        url: `/c/${channel.channel_type}/${channel.name}`,
      })
      if (channelType === ChannelTypeEnum.Topic) {
        setupTopicApis(channel)
      }
      await screen.findAllByText(channel.title)
      const expectedProps = expect.objectContaining({
        constantSearchParams: {
          platform: ["ocw", "mitxonline"],
          department: ["8", "9"],
        },
      })
      const expectedContext = expect.anything()

      expect(mockedChannelSearch).toHaveBeenLastCalledWith(
        expectedProps,
        expectedContext,
      )
    }, 10000)
    it("Does not display the channel search if search_filter is undefined", async () => {
      const { channel } = setupApis({
        channel_type: channelType,
      })
      channel.search_filter = undefined
      renderWithProviders(<ChannelPage />, {
        url: `/c/${channel.channel_type}/${channel.name}`,
      })
      if (channelType === ChannelTypeEnum.Topic) {
        setupTopicApis(channel)
      }
      await screen.findAllByText(channel.title)

      expect(mockedChannelSearch).toHaveBeenCalledTimes(0)
    }, 10000)

    it("Includes heading and subheading in banner", async () => {
      const { channel } = setupApis({
        channel_type: channelType,
      })
      channel.search_filter = undefined
      renderWithProviders(<ChannelPage />, {
        url: `/c/${channel.channel_type}/${channel.name}`,
      })
      if (channelType === ChannelTypeEnum.Topic) {
        setupTopicApis(channel)
      }
      await screen.findAllByText(channel.title)

      await waitFor(() => {
        screen.getAllByText(channel.configuration.sub_heading).forEach((el) => {
          expect(el).toBeInTheDocument()
        })
      })
      await waitFor(() => {
        screen.getAllByText(channel.configuration.heading).forEach((el) => {
          expect(el).toBeInTheDocument()
        })
      })
    }, 10000)

    it.each([{ isSubscribed: false }, { isSubscribed: true }])(
      "Displays the subscribe toggle for authenticated and unauthenticated users",
      async ({ isSubscribed }) => {
        const { channel } = setupApis(
          { search_filter: "q=ocw", channel_type: channelType },
          {},
          { isSubscribed },
        )
        renderWithProviders(<ChannelPage />, {
          url: `/c/${channel.channel_type}/${channel.name}`,
        })
        if (channelType === ChannelTypeEnum.Topic) {
          setupTopicApis(channel)
        }
        const subscribedButton = await screen.findAllByText("Follow")
        expect(subscribedButton[0]).toBeVisible()
      },
      10000,
    )
  },
)

describe.each(NON_UNIT_CHANNEL_TYPES)(
  "ChannelPage, common non-unit ($channelType)",
  ({ channelType }) => {
    it("Does not display a featured carousel if the channel type is not 'unit'", async () => {
      const { channel } = setupApis({
        search_filter: "topic=physics",
        channel_type: channelType,
      })
      if (channelType === ChannelTypeEnum.Topic) {
        setupTopicApis(channel)
      }

      renderWithProviders(<ChannelPage />, {
        url: `/c/${channel.channel_type}/${channel.name}`,
      })
      await screen.findAllByText(channel.title)
      const carousels = screen.queryByText("Featured Courses")
      expect(carousels).toBe(null)
    }, 10000)

    it("Displays the title, background, and avatar (channelType: %s)", async () => {
      const { channel } = setupApis({
        search_filter: "offered_by=ocw",
        channel_type: channelType,
      })
      if (channelType === ChannelTypeEnum.Topic) {
        setupTopicApis(channel)
      }

      const { view } = renderWithProviders(<ChannelPage />, {
        url: `/c/${channel.channel_type}/${channel.name}`,
      })
      const title = await screen.findByRole("heading", { name: channel.title })
      // Banner background image
      expect(
        someAncestor(title, (el) =>
          window
            .getComputedStyle(el)
            .backgroundImage.includes(channel.configuration.banner_background),
        ),
      ).toBe(true)
      // logo
      getByImageSrc(
        view.container,
        `${window.origin}${channel.configuration.logo}`,
      )
    }, 10000)

    test("headings", async () => {
      const { channel } = setupApis({
        search_filter: "topic=Physics",
        channel_type: channelType,
      })
      renderWithProviders(<ChannelPage />, {
        url: `/c/${channel.channel_type}/${channel.name}`,
      })
      if (channelType === ChannelTypeEnum.Topic) {
        setupTopicApis(channel)
      }

      await waitFor(() => {
        assertHeadings([
          { level: 1, name: channel.title },
          { level: 2, name: `Search within ${channel.title}` },
          { level: 3, name: "Filter" },
          { level: 3, name: "Search Results" },
        ])
      })
    }, 10000)
  },
)

describe("Channel Pages, Topic only", () => {
  test("Subtopics display", async () => {
    const { channel } = setupApis({
      search_filter: "topic=Physics",
      channel_type: ChannelTypeEnum.Topic,
    })
    renderWithProviders(<ChannelPage />, {
      url: `/c/${channel.channel_type}/${channel.name}`,
    })
    const { topic, subTopics } = setupTopicApis(channel)
    invariant(topic)

    const subTopicsTitle = await screen.findByText("Subtopics")
    expect(subTopicsTitle).toBeInTheDocument()
    const links = await screen.findAllByRole("link", {
      // name arg can be string, regex, or function
      name: (name) => subTopics?.results.map((t) => t.name).includes(name),
    })
    links.forEach((link, i) => {
      expect(link).toHaveAttribute(
        "href",
        new URL(subTopics.results[i].channel_url!, "http://localhost").pathname,
      )
    })
  }, 10000)

  test("Related topics display", async () => {
    const { channel } = setupApis({
      search_filter: "topic=Physics",
      channel_type: ChannelTypeEnum.Topic,
    })
    const { subTopics, subTopicChannels } = setupTopicApis(channel)
    invariant(subTopicChannels)
    const subTopicChannel = subTopicChannels[0]
    const filteredSubTopics = subTopics?.results.filter(
      (t) =>
        t.name.replace(/\s/g, "-") !== subTopicChannel.name.replace(/\s/g, "-"),
    )
    renderWithProviders(<ChannelPage />, {
      url: `/c/${subTopicChannel.channel_type}/${subTopicChannel.name.replace(/\s/g, "-")}`,
    })

    const relatedTopicsTitle = await screen.findByText("Related Topics")
    expect(relatedTopicsTitle).toBeInTheDocument()
    const links = await screen.findAllByRole("link", {
      // name arg can be string, regex, or function
      name: (name) => filteredSubTopics?.map((t) => t.name).includes(name),
    })
    links.forEach(async (link, i) => {
      expect(link).toHaveAttribute("href", filteredSubTopics[i].channel_url)
    })
  }, 10000)
})

describe("Channel Pages, Unit only", () => {
  it("Displays the channel title, banner, and avatar", async () => {
    const { channel } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })
    renderWithProviders(<ChannelPage />, {
      url: `/c/${channel.channel_type}/${channel.name}`,
    })

    const title = await screen.findByRole("heading", { name: channel.title })
    getByImageSrc(title, `${window.origin}${channel.configuration.logo}`)
  })
  it("Displays a featured carousel if the channel type is 'unit'", async () => {
    const { channel } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })

    renderWithProviders(<ChannelPage />, {
      url: `/c/${channel.channel_type}/${channel.name}`,
    })
    await screen.findAllByText(channel.title)
    const carousel = await screen.findByText("Featured Courses")
    expect(carousel).toBeInTheDocument()

    await waitFor(() => {
      expect(makeRequest).toHaveBeenCalledWith(
        "get",
        urls.learningResources.featured({ limit: 12, offered_by: ["ocw"] }),
        undefined,
      )
    })

    await waitFor(() => {
      expect(makeRequest).toHaveBeenCalledWith(
        "get",
        urls.learningResources.featured({ limit: 12 }),
        undefined,
      )
    })
  })

  test("headings", async () => {
    const { channel } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })
    renderWithProviders(<ChannelPage />, {
      url: `/c/${channel.channel_type}/${channel.name}`,
    })

    await waitFor(() => {
      assertHeadings([
        { level: 1, name: channel.title },
        { level: 2, name: "Featured Courses" },
        { level: 2, name: "What Learners Say" },
        { level: 2, name: `Search within ${channel.title}` },
        { level: 3, name: "Filter" },
        { level: 3, name: "Search Results" },
      ])
    })
  })
})
