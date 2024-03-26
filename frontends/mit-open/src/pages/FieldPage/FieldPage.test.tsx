import { assertInstanceOf } from "ol-utilities"
import { urls } from "api/test-utils"
import type { FieldChannel } from "api/v0"
import { fields as factory } from "api/test-utils/factories"
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

jest.mock("./WidgetsList", () => {
  const actual = jest.requireActual("./WidgetsList")
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  }
})
const mockWidgetList = jest.mocked(WidgetList)

const setupApis = (fieldPatch?: Partial<FieldChannel>) => {
  const field = factory.field(fieldPatch)

  setMockResponse.get(urls.fields.details(field.name), field)

  const widgetsList = makeWidgetListResponse()
  setMockResponse.get(
    urls.widgetLists.details(field.widget_list || -1),
    widgetsList,
  )

  return {
    field,
    widgets: widgetsList.widgets,
  }
}

describe("FieldPage", () => {
  it("Displays the field title, banner, and avatar", async () => {
    const { field } = setupApis()
    renderTestApp({ url: `/fields/${field.name}` })

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

  it.each([
    {
      getUrl: (field: FieldChannel) => `/fields/${field.name}`,
      isEditing: false,
      urlDesc: "/fields/:name/",
    },
    {
      getUrl: (field: FieldChannel) => `/fields/${field.name}/manage/widgets/`,
      isEditing: true,
      urlDesc: "/fields/:name/manage/widgets/",
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
      const url = `/fields/${field.name}/manage/widgets/`
      const { location } = renderTestApp({ url })
      // click done without an edit
      await user.click(await screen.findByRole("button", { name: btnName }))

      await waitFor(() => {
        expect(location.current.pathname).toBe(makeFieldViewPath(field.name))
      })
    },
  )
})
