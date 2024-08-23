import {
  renderTestApp,
  screen,
  fireEvent,
  user,
  waitFor,
} from "../../test-utils"
import { factories, urls, setMockResponse } from "api/test-utils"
import { channels as factory } from "api/test-utils/factories"
import { makeChannelViewPath, makeChannelEditPath } from "@/common/urls"
import { makeWidgetListResponse } from "ol-widgets/src/factories"
import type { Channel } from "api/v0"

const setupApis = (channelOverrides: Partial<Channel>) => {
  const channel = factory.channel({ is_moderator: true, ...channelOverrides })
  setMockResponse.get(urls.userMe.get(), {})
  channel.search_filter = undefined
  setMockResponse.get(
    urls.learningResources.featured({ limit: 12 }),
    factories.learningResources.resources({ count: 0 }),
  )

  setMockResponse.get(
    urls.channels.details(channel.channel_type, channel.name),
    channel,
  )
  setMockResponse.get(
    urls.widgetLists.details(channel.widget_list || -1),
    makeWidgetListResponse({}, { count: 0 }),
  )

  setMockResponse.get(expect.stringContaining(urls.testimonials.list({})), {
    results: [],
  })

  return channel
}

describe("EditChannelAppearanceForm", () => {
  it("Displays the channel title, appearance inputs with current channel values", async () => {
    const channel = setupApis({})
    expect(channel.is_moderator).toBeTruthy()
    renderTestApp({
      url: `${makeChannelEditPath(channel.channel_type, channel.name)}/#appearance`,
    })
    const descInput = (await screen.findByLabelText(
      "Description",
    )) as HTMLInputElement
    const titleInput = (await screen.findByLabelText(
      "Title",
    )) as HTMLInputElement
    expect(titleInput.value).toEqual(channel.title)
    expect(descInput.value).toEqual(channel.public_description)
  })

  it("Shows an error if a required channel is blank", async () => {
    const channel = setupApis({})
    renderTestApp({
      url: `${makeChannelEditPath(channel.channel_type, channel.name)}/#appearance`,
    })
    const titleInput = await screen.findByLabelText("Title")
    const titleError = screen.queryByText("Title is required")
    expect(titleError).toBeNull()
    fireEvent.change(titleInput, {
      target: { value: "" },
    })
    fireEvent.blur(titleInput)
    await screen.findByText("Title is required")
  })

  it("updates channel values on form submission", async () => {
    const channel = setupApis({
      featured_list: null, // so we don't have to mock userList responses
      lists: [],
    })

    const newTitle = "New Title"
    const newDesc = "New Description"
    const newChannelType = "topic"
    // Initial channel values
    const updatedValues = {
      ...channel,
      title: newTitle,
      public_description: newDesc,
      channel_type: newChannelType,
    }
    setMockResponse.patch(urls.channels.patch(channel.id), updatedValues)
    const { location } = renderTestApp({
      url: `${makeChannelEditPath(channel.channel_type, channel.name)}/#appearance`,
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
    // Expected channel values after submit
    setMockResponse.get(
      urls.channels.details(newChannelType, channel.name),
      updatedValues,
    )
    await user.click(submitBtn)

    await waitFor(() => {
      expect(location.current.pathname).toBe(
        makeChannelViewPath(newChannelType, channel.name),
      )
    })
    await screen.findAllByText(newTitle)
    await screen.findAllByText(newDesc)
  }, 10000)
})
