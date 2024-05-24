import { assertInstanceOf } from "ol-utilities"
import { urls, factories } from "api/test-utils"
import type { FieldChannel } from "api/v0"
import type { LearningResourceSearchResponse } from "api"

import WidgetList from "./WidgetsList"
import {
  renderTestApp,
  screen,
  setMockResponse,
  within,
  user,
  waitFor,
} from "../../test-utils"
import { makeWidgetListResponse } from "ol-widgets/src/factories"
import { makeFieldViewPath } from "@/common/urls"
import FieldSearch from "./FieldSearch"

jest.mock("./WidgetsList", () => {
  const actual = jest.requireActual("./WidgetsList")
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  }
})
const mockWidgetList = jest.mocked(WidgetList)

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
    widgets: widgetsList.widgets,
  }
}

describe("FieldPage", () => {
  it("Displays the field title, banner, and avatar", async () => {
    const { field } = setupApis()
    renderTestApp({ url: `/c/${field.channel_type}/${field.name}` })

    const title = await screen.findByText(field.title)
    const header = title.closest("header")
    assertInstanceOf(header, HTMLElement)
    const images = within(header).getAllByRole("img") as HTMLImageElement[]

    expect(images[0].src).toBe(field.banner)
    expect(images).toEqual([
      /**
       * Unless it is meaningful, the alt text should be an empty string, and
       * the channel header already has a title.
       */
      expect.objectContaining({ src: field.banner, alt: "" }),
      expect.objectContaining({ src: field.avatar_medium, alt: "" }),
    ])
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

  it.each([
    {
      getUrl: (field: FieldChannel) => `/c/${field.channel_type}/${field.name}`,
      isEditing: false,
      urlDesc: "/c/:channelType/:name/",
    },
    {
      getUrl: (field: FieldChannel) =>
        `/c/${field.channel_type}/${field.name}/manage/widgets/`,
      isEditing: true,
      urlDesc: "/c/:channelType/:name/manage/widgets/",
    },
  ])(
    "Renders readonly WidgetList at $urlDesc",
    async ({ getUrl, isEditing }) => {
      const { field, widgets } = setupApis()
      const url = getUrl(field)
      renderTestApp({ url })

      // below we check the FC was called correctly
      // but let's check that it is still visible, too.
      await screen.findByText(widgets[0].title)
      expect(field.widget_list).toEqual(expect.any(Number))

      const expectedProps = expect.objectContaining({
        widgetListId: field.widget_list,
        isEditing: isEditing,
      })
      const expectedContext = expect.anything()
      expect(mockWidgetList).toHaveBeenLastCalledWith(
        expectedProps,
        expectedContext,
      )
    },
  )

  it.each([{ btnName: "Done" }, { btnName: "Cancel" }])(
    "When managing widgets, $text returns to field page",
    async ({ btnName }) => {
      const { field } = setupApis()
      const url = `/c/${field.channel_type}/${field.name}/manage/widgets/`
      const { location } = renderTestApp({ url })
      // click done without an edit
      await user.click(await screen.findByRole("button", { name: btnName }))

      await waitFor(() => {
        expect(location.current.pathname).toBe(
          makeFieldViewPath(field.channel_type, field.name),
        )
      })
    },
  )

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
