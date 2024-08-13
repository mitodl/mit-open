import { urls, factories, makeRequest } from "api/test-utils"
import { ChannelTypeEnum, type Channel } from "api/v0"
import type { LearningResourcesSearchResponse } from "api"
import {
  renderTestApp,
  screen,
  setMockResponse,
  within,
  waitFor,
  assertPartialMetas,
} from "../../test-utils"
import ChannelSearch from "./ChannelSearch"

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

describe("ChannelPage", () => {
  it.each(
    Object.values(ChannelTypeEnum).filter((v) => v !== ChannelTypeEnum.Unit),
  )(
    "Displays the title, background, and avatar (channelType: %s)",
    async (channelType) => {
      const { channel } = setupApis({
        search_filter: "offered_by=ocw",
        channel_type: channelType,
      })

      renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
      const title = await screen.findByRole("heading", { name: channel.title })
      await waitFor(() => {
        assertPartialMetas({
          title: `${channel.title} | ${APP_SETTINGS.SITE_NAME}`,
        })
      })
      // Banner background image
      expect(
        someAncestor(title, (el) =>
          window
            .getComputedStyle(el)
            .backgroundImage.includes(channel.configuration.banner_background),
        ),
      ).toBe(true)
      // logo
      const images = screen.getAllByRole<HTMLImageElement>("img")
      const logos = images.filter((img) =>
        img.src.includes(channel.configuration.logo),
      )
      expect(logos.length).toBe(1)
    },
  )

  it("Does not display a featured carousel if the channel type is not 'unit'", async () => {
    const { channel } = setupApis({
      search_filter: "topic=physics",
      channel_type: "topic",
    })

    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
    await screen.findAllByText(channel.title)
    const carousels = screen.queryByText("Featured Courses")
    expect(carousels).toBe(null)
  })
  it("Displays the channel search if search_filter is not undefined", async () => {
    const { channel } = setupApis({
      search_filter:
        "platform=ocw&platform=mitxonline&department=8&department=9",
    })
    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
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
  })
  it("Does not display the channel search if search_filter is undefined", async () => {
    const { channel } = setupApis()
    channel.search_filter = undefined
    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
    await screen.findAllByText(channel.title)

    expect(mockedChannelSearch).toHaveBeenCalledTimes(0)
  })

  it("Includes heading and subheading in banner", async () => {
    const { channel } = setupApis()
    channel.search_filter = undefined
    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
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
  })

  it.each([{ isSubscribed: false }, { isSubscribed: true }])(
    "Displays the subscribe toggle for authenticated and unauthenticated users",
    async ({ isSubscribed }) => {
      const { channel } = setupApis(
        { search_filter: "q=ocw" },
        {},
        { isSubscribed },
      )
      renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
      const subscribedButton = await screen.findByText("Follow")
      expect(subscribedButton).toBeVisible()
    },
  )
})

describe("Unit Channel Pages", () => {
  it("Sets the expected meta tags", async () => {
    const { channel } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })
    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
    const title = `${channel.title} | ${APP_SETTINGS.SITE_NAME}`
    const { heading: description } = channel.configuration
    await waitFor(() => {
      assertPartialMetas({
        title,
        description,
        og: { title, description },
      })
    })
  })

  it("Sets the expected metadata tags when resource drawer is open", async () => {
    /**
     * Check that the meta tags are correct on channel page, even when the
     * resource drawer is open.
     */
    const { channel } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })
    const resource = factories.learningResources.resource()
    setMockResponse.get(
      urls.learningResources.details({ id: resource.id }),
      resource,
    )

    renderTestApp({
      url: `/c/${channel.channel_type}/${channel.name}?resource=${resource.id}`,
    })
    await screen.findByRole("heading", { name: channel.title, hidden: true })
    const title = `${resource.title} | ${APP_SETTINGS.SITE_NAME}`
    const description = resource.description
    await waitFor(() => {
      assertPartialMetas({
        title,
        description,
        og: { title, description },
      })
    })
  })

  it("Displays the channel title, banner, and avatar", async () => {
    const { channel } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })
    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })

    const title = await screen.findByRole("heading", { name: channel.title })
    const image = within(title).getByRole<HTMLImageElement>("img")
    expect(image.src).toContain(channel.configuration.logo)
  })
  it("Displays a featured carousel if the channel type is 'unit'", async () => {
    const { channel } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })

    renderTestApp({ url: `/c/${channel.channel_type}/${channel.name}` })
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
})
