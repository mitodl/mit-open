import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"

import ChannelMenu from "./ChannelMenu"
import { urls } from "api/test-utils"
import { setMockResponse, user } from "@/test-utils"
import { channels as factory } from "api/test-utils/factories"
import { ThemeProvider } from "ol-components"

describe("ChannelMenu", () => {
  it("Includes links to channel management", async () => {
    const channel = factory.channel()
    setMockResponse.get(
      urls.channels.details(channel.channel_type, channel.name),
      channel,
    )

    render(
      <BrowserRouter>
        <ChannelMenu channelType={channel.channel_type} name={channel.name} />
      </BrowserRouter>,
      { wrapper: ThemeProvider },
    )
    const dropdown = await screen.findByRole("button")
    await user.click(dropdown)

    const item1 = screen.getByRole("menuitem", { name: "Channel Settings" })
    expect((item1 as HTMLAnchorElement).href).toContain(
      `/c/${channel.channel_type}/${channel.name}/manage`,
    )
  })
})
