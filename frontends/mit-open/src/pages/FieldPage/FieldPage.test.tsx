import { assertInstanceOf } from "ol-utilities"
import { urls, factories, makeRequest } from "api/test-utils"
import type { Channel } from "api/v0"
import type { LearningResourcesSearchResponse } from "api"
import {
  renderTestApp,
  screen,
  setMockResponse,
  within,
  waitFor,
} from "../../test-utils"
import FieldSearch from "./FieldSearch"

jest.mock("./FieldSearch", () => {
  const actual = jest.requireActual("./FieldSearch")
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  }
})
const mockedFieldSearch = jest.mocked(FieldSearch)

const setupApis = (
  fieldPatch?: Partial<Channel>,
  search?: Partial<LearningResourcesSearchResponse>,
  { isSubscribed = false, isAuthenticated = false } = {},
) => {
  const field = factories.fields.field(fieldPatch)
  setMockResponse.get(urls.userMe.get(), {
    is_authenticated: isAuthenticated,
  })
  setMockResponse.get(
    urls.fields.details(field.channel_type, field.name),
    field,
  )
  setMockResponse.get(
    expect.stringContaining(urls.learningResources.featured()),
    factories.learningResources.resources({ count: 0 }),
  )

  const urlParams = new URLSearchParams(fieldPatch?.search_filter)
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
  if (fieldPatch?.search_filter) {
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
    field,
  }
}

describe("FieldPage", () => {
  it("Displays the field title, banner, and avatar", async () => {
    const { field } = setupApis()
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })

    const title = await screen.findAllByText(field.title)
    const header = title[0].closest("header")
    assertInstanceOf(header, HTMLElement)
    const images = within(header).getAllByRole("img") as HTMLImageElement[]
    const headerStyles = getComputedStyle(header)
    expect(headerStyles.backgroundImage).toContain(
      field.configuration.banner_background,
    )
    expect(images[0].src).toContain(field.configuration.logo)
  })
  it("Displays a featured carousel if the channel type is 'unit'", async () => {
    const { field } = setupApis({
      search_filter: "offered_by=ocw",
      channel_type: "unit",
    })

    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findAllByText(field.title)
    const carousel = await screen.findByText("Featured Courses")
    expect(carousel).toBeInTheDocument()

    await waitFor(() => {
      expect(makeRequest).toHaveBeenCalledWith(
        "get",
        urls.learningResources.featured({ limit: 12, offered_by: ["ocw"] }),
        undefined,
      )
    })
    expect(
      makeRequest.mock.calls.filter(([method, url]) => {
        return (
          method === "get" && url.includes(urls.learningResources.featured())
        )
      }).length,
    ).toBe(1)
  })
  it("Does not display a featured carousel if the channel type is not 'unit'", async () => {
    const { field } = setupApis({
      search_filter: "topic=physics",
      channel_type: "topic",
    })

    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findAllByText(field.title)
    const carousels = screen.queryByText("Featured Courses")
    expect(carousels).toBe(null)
  })

  it("Displays the field search if search_filter is not undefined", async () => {
    const { field } = setupApis({
      search_filter:
        "platform=ocw&platform=mitxonline&department=8&department=9",
    })
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)
    const expectedProps = expect.objectContaining({
      constantSearchParams: {
        platform: ["ocw", "mitxonline"],
        department: ["8", "9"],
      },
    })
    const expectedContext = expect.anything()

    expect(mockedFieldSearch).toHaveBeenLastCalledWith(
      expectedProps,
      expectedContext,
    )
  })
  it("Does not display the field search if search_filter is undefined", async () => {
    const { field } = setupApis()
    field.search_filter = undefined
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)

    expect(mockedFieldSearch).toHaveBeenCalledTimes(0)
  })

  it("Includes heading and subheading in banner", async () => {
    const { field } = setupApis()
    field.search_filter = undefined
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)

    await waitFor(() => {
      expect(
        screen.getByText(field.configuration.sub_heading),
      ).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText(field.configuration.heading)).toBeInTheDocument()
    })
  })

  it.each([{ isSubscribed: false }, { isSubscribed: true }])(
    "Displays the subscribe toggle for authenticated and unauthenticated users",
    async ({ isSubscribed }) => {
      const { field } = setupApis(
        { search_filter: "q=ocw" },
        {},
        { isSubscribed },
      )
      renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
      const subscribedButton = await screen.findByText("Follow")
      expect(subscribedButton).toBeVisible()
    },
  )
})
