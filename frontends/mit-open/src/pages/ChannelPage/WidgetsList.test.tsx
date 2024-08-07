import React from "react"
import {
  renderWithProviders,
  screen,
  waitFor,
  expectProps,
  user,
  expectLastProps,
  setMockResponse,
  ignoreError,
} from "../../test-utils"
import { Widget, WidgetsListEditable } from "ol-widgets"
import { makeWidgetListResponse } from "ol-widgets/src/factories"
import WidgetsList from "./WidgetsList"
import { urls } from "api/test-utils"
import { makeRequest } from "../../test-utils/mockAxios"

jest.mock("ol-widgets", () => {
  const actual = jest.requireActual("ol-widgets")
  return {
    __esModule: true,
    ...actual,
    Widget: jest.fn(actual.Widget),
    WidgetsListEditable: jest.fn(actual.WidgetsListEditable),
  }
})
const spyWidget = jest.mocked(Widget)
const spyWidgetsListEditable = jest.mocked(WidgetsListEditable)

const setupApis = ({ widgets = 3 } = {}) => {
  const widgetsList = makeWidgetListResponse({}, { count: widgets })
  setMockResponse.get(urls.widgetLists.details(widgetsList.id), widgetsList)
  return { widgetsList }
}

describe("Viewing widgets with WidgetsList", () => {
  test("Renders widgets", async () => {
    /* Issue is in react-markdown v6.0.3. The package is now several versions ahead. We can remove this once we update
     * https://github.com/remarkjs/react-markdown/blob/ce6c1a71c17280e753e54e919511cd8bafadf86e/src/react-markdown.js#L138
     */
    const ignored = ignoreError(
      "Support for defaultProps will be removed from function components in a future major release",
    )

    const { widgetsList } = setupApis({ widgets: 3 })
    renderWithProviders(
      <WidgetsList isEditing={false} widgetListId={widgetsList.id} />,
    )

    /**
     * Check that widget components are still on-screen
     */
    const { widgets } = widgetsList
    const w1 = await screen.findByRole("heading", { name: widgets[0].title })
    const w2 = await screen.findByRole("heading", { name: widgets[1].title })
    const w3 = await screen.findByRole("heading", { name: widgets[2].title })

    const { DOCUMENT_POSITION_FOLLOWING } = Node
    expect(w1.compareDocumentPosition(w2)).toBe(DOCUMENT_POSITION_FOLLOWING)
    expect(w2.compareDocumentPosition(w3)).toBe(DOCUMENT_POSITION_FOLLOWING)

    /**
     * Check that the Widget component was called with correct props
     */
    expectProps(spyWidget, { widget: widgets.at(-1) })
    expectProps(spyWidget, { widget: widgets.at(-2) })
    expectProps(spyWidget, { widget: widgets.at(-3) })

    ignored.clear()
  })
})

describe("Editing widgets with WidgetsList", () => {
  it("renders WidgetsListEditable with expected stuff", async () => {
    const { widgetsList } = setupApis({ widgets: 3 })
    renderWithProviders(
      <WidgetsList isEditing={true} widgetListId={widgetsList.id} />,
    )

    /**
     * Check that widget components are still on-screen
     */
    const { widgets } = widgetsList
    await waitFor(() => {
      screen.getByRole("heading", { name: widgets[0].title })
      screen.getByRole("heading", { name: widgets[1].title })
      screen.getByRole("heading", { name: widgets[2].title })
    })
    expectLastProps(spyWidgetsListEditable, { widgetsList })
  })

  it("makes the expected API call when WidgetsListEditable is edited+submitted", async () => {
    const { widgetsList } = setupApis({ widgets: 3 })
    renderWithProviders(
      <WidgetsList isEditing={true} widgetListId={widgetsList.id} />,
    )
    const deleteBtns = await screen.findAllByRole("button", { name: /Delete/ })
    expect(deleteBtns.length).toBe(3)
    await user.click(deleteBtns[0])
    const modified = {
      ...widgetsList,
      widgets: widgetsList.widgets.slice(1),
    }
    setMockResponse.patch(urls.widgetLists.details(widgetsList.id), modified)
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(makeRequest).toHaveBeenCalledWith(
      "patch",
      urls.widgetLists.details(widgetsList.id),
      expect.objectContaining({
        widgets: modified.widgets,
      }),
    )
  })

  it("Does not make an API call if widget list not edited", async () => {
    const { widgetsList } = setupApis({ widgets: 3 })
    renderWithProviders(
      <WidgetsList isEditing={true} widgetListId={widgetsList.id} />,
    )
    // Wait for the widgets to have loaded
    const deleteBtns = await screen.findAllByRole("button", { name: /Delete/ })
    expect(deleteBtns.length).toBe(3)
    // click done without an edit
    const callCount = makeRequest.mock.calls.length
    await user.click(await screen.findByRole("button", { name: "Done" }))
    // call count should be same as before
    expect(makeRequest).toHaveBeenCalledTimes(callCount)
  })
})
