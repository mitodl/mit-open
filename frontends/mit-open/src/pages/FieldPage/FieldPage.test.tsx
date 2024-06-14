import { assertInstanceOf } from "ol-utilities"
import { urls, factories } from "api/test-utils"
import type { FieldChannel } from "api/v0"
import type { LearningResourceSearchResponse } from "api"
import {
  renderTestApp,
  screen,
  setMockResponse,
  within,
  user,
  act,
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
  fieldPatch?: Partial<FieldChannel>,
  search?: Partial<LearningResourceSearchResponse>,
  userIsAuthenticated?: boolean,
  userIsSubscribed?: boolean,
) => {
  const field = factories.fields.field(fieldPatch)
  setMockResponse.get(urls.userMe.get(), {
    is_authenticated: userIsAuthenticated,
  })
  setMockResponse.get(
    urls.fields.details(field.channel_type, field.name),
    field,
  )
  setMockResponse.get(
    urls.learningResources.featured({ limit: 12, platform: ["ocw"] }),
    factories.learningResources.resources({ count: 0 }),
  )
  setMockResponse.get(
    urls.learningResources.featured({ limit: 12 }),
    factories.learningResources.resources({ count: 0 }),
  )

  const urlParams = new URLSearchParams(fieldPatch?.search_filter)
  const subscribeParams: Record<string, string[] | string> = {}
  for (const [key, value] of urlParams.entries()) {
    subscribeParams[key] = value.split(",")
  }
  subscribeParams["source_type"] = "channel_subscription_type"
  const subscribeResponse = userIsSubscribed
    ? factories.percolateQueries.percolateQueryList({ count: 1 }).results
    : factories.percolateQueries.percolateQueryList({ count: 0 }).results
  if (fieldPatch?.search_filter) {
    setMockResponse.get(
      `${urls.userSubscription.check(subscribeParams)}`,
      subscribeResponse,
    )
    setMockResponse.post(`${urls.userSubscription.post()}`, subscribeResponse)
  }
  if (userIsSubscribed === true) {
    setMockResponse.delete(
      urls.userSubscription.delete(subscribeResponse[0]?.id),
      subscribeResponse[0],
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
      search_filter: "unit=ocw",
      channel_type: "unit",
    })

    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findAllByText(field.title)
    const carousel = await screen.findByText("Featured Courses")
    act(() => {
      expect(carousel).toBeInTheDocument()
    })
  })
  it("Does not display a featured carousel if the channel type is not 'unit'", async () => {
    const { field } = setupApis({
      search_filter: "topic=physics",
      channel_type: "topic",
    })

    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findAllByText(field.title)
    const carousels = screen.queryByText("Featured Courses")
    act(() => {
      expect(carousels).toBe(null)
    })
  })
  it("Displays the field search if search_filter is not undefined", async () => {
    const { field } = setupApis({ search_filter: "platform=ocw" })
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)
    const expectedProps = expect.objectContaining({
      constantSearchParams: { platform: ["ocw"] },
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

  it("Displays the unsubscribe toggle if the user is authenticated and subscribed", async () => {
    const { field } = setupApis({ search_filter: "q=ocw" }, {}, true, true)
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)
    const subscribedButton = await screen.findByText("Subscribed")
    assertInstanceOf(subscribedButton, HTMLButtonElement)
    user.click(subscribedButton)
    const unsubscribeButton = await screen.findByText("Unsubscribe")
    assertInstanceOf(unsubscribeButton, HTMLLIElement)
  })

  it("Displays the subscribe toggle if the user is authenticated but not subscribed", async () => {
    const { field } = setupApis({ search_filter: "q=ocw" }, {}, true, false)
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)
    const subscribeButton = await screen.findByText("Subscribe")
    assertInstanceOf(subscribeButton, HTMLButtonElement)
  })
  it("Hides the subscribe toggle if the user is not authenticated", async () => {
    const { field } = setupApis({ search_filter: "q=ocw" }, {}, false, false)
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })
    await screen.findByText(field.title)
    await waitFor(() => {
      expect(screen.queryByText("Subscribe")).not.toBeInTheDocument()
    })
  })
})
