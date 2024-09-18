import React from "react"
import { render, screen } from "@testing-library/react"

import { ThemeProvider } from "ol-components"
import { channels as factory } from "api/test-utils/factories"
import ChannelAvatar from "./ChannelAvatar"

describe("Avatar", () => {
  it("Displays a small avatar image for the channel", async () => {
    const channel = factory.channel()
    render(<ChannelAvatar channel={channel} imageSize="small" />, {
      wrapper: ThemeProvider,
    })
    const img = screen.getByRole("img")
    expect(img.getAttribute("alt")).toBe("") // should be empty unless meaningful
    expect(img.getAttribute("src")).toEqual(channel.avatar_small)
  })
  it("Displays a medium avatar image by default", async () => {
    const channel = factory.channel()
    render(<ChannelAvatar channel={channel} />, { wrapper: ThemeProvider })
    const img = screen.getByRole("img")
    expect(img.getAttribute("alt")).toBe("") // should be empty unless meaningful
    expect(img.getAttribute("src")).toEqual(channel.avatar_medium)
  })
  it("Displays initials if no avatar image exists", async () => {
    const channel = factory.channel({
      title: "Test Title",
      avatar: null,
      avatar_small: null,
      avatar_medium: null,
    })
    render(<ChannelAvatar channel={channel} />, { wrapper: ThemeProvider })
    const img = screen.queryByRole("img")
    expect(img).toBeNull()
    await screen.findByText("TT")
  })
})
