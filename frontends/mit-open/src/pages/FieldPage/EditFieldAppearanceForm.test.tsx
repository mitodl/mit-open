import {
  renderTestApp,
  screen,
  fireEvent,
  user,
  waitFor,
} from "../../test-utils"
import { factories, urls, setMockResponse } from "api/test-utils"
import { fields as factory } from "api/test-utils/factories"
import { makeFieldViewPath, makeFieldEditPath } from "@/common/urls"
import { makeWidgetListResponse } from "ol-widgets/src/factories"
import type { FieldChannel } from "api/v0"

const setupApis = (fieldOverrides: Partial<FieldChannel>) => {
  const field = factory.field({ is_moderator: true, ...fieldOverrides })
  setMockResponse.get(urls.userMe.get(), {})
  field.search_filter = undefined
  setMockResponse.get(
    urls.learningResources.featured({ limit: 12 }),
    factories.learningResources.resources({ count: 0 }),
  )

  setMockResponse.get(
    urls.fields.details(field.channel_type, field.name),
    field,
  )
  setMockResponse.get(
    urls.widgetLists.details(field.widget_list || -1),
    makeWidgetListResponse({}, { count: 0 }),
  )
  return field
}

describe("EditFieldAppearanceForm", () => {
  it("Displays the field title, appearance inputs with current field values", async () => {
    const field = setupApis({})
    expect(field.is_moderator).toBeTruthy()
    renderTestApp({
      url: `${makeFieldEditPath(field.channel_type, field.name)}/#appearance`,
    })
    const descInput = (await screen.findByLabelText(
      "Description",
    )) as HTMLInputElement
    const titleInput = (await screen.findByLabelText(
      "Title",
    )) as HTMLInputElement
    expect(titleInput.value).toEqual(field.title)
    expect(descInput.value).toEqual(field.public_description)
  })

  it("Shows an error if a required field is blank", async () => {
    const field = setupApis({})
    renderTestApp({
      url: `${makeFieldEditPath(field.channel_type, field.name)}/#appearance`,
    })
    const titleInput = await screen.findByLabelText("Title")
    const titleError = screen.queryByText("Title is required.")
    expect(titleError).toBeNull()
    fireEvent.change(titleInput, {
      target: { value: "" },
    })
    fireEvent.blur(titleInput)
    await screen.findByText("Title is required.")
  })

  it("updates field values on form submission", async () => {
    const field = setupApis({
      featured_list: null, // so we don't have to mock userList responses
      lists: [],
    })

    const newTitle = "New Title"
    const newDesc = "New Description"
    const newChannelType = "topic"
    // Initial field values
    const updatedValues = {
      ...field,
      title: newTitle,
      public_description: newDesc,
      channel_type: newChannelType,
    }
    setMockResponse.patch(urls.fields.patch(field.id), updatedValues)
    const { location } = renderTestApp({
      url: `${makeFieldEditPath(field.channel_type, field.name)}/#appearance`,
    })
    const titleInput = (await screen.findByLabelText(
      "Title",
    )) as HTMLInputElement
    const descInput = (await screen.findByLabelText(
      "Description",
    )) as HTMLInputElement
    const channelTypeInput = (await screen.findByLabelText(
      "Channel Type",
    )) as HTMLInputElement
    const submitBtn = await screen.findByText("Save")
    channelTypeInput.setAttribute("channel_type", newChannelType)
    titleInput.setSelectionRange(0, titleInput.value.length)
    await user.type(titleInput, newTitle)
    descInput.setSelectionRange(0, descInput.value.length)
    await user.type(descInput, newDesc)
    // Expected field values after submit
    setMockResponse.get(
      urls.fields.details(newChannelType, field.name),
      updatedValues,
    )
    await user.click(submitBtn)

    await waitFor(() => {
      expect(location.current.pathname).toBe(
        makeFieldViewPath(newChannelType, field.name),
      )
    })
    await screen.findAllByText(newTitle)
    await screen.findAllByText(newDesc)
  }, 10000)
})
