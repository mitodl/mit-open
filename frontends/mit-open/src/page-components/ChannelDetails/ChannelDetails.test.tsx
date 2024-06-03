import React from "react"
import { render, screen } from "@testing-library/react"
import ChannelDetails from "./ChannelDetails"

describe("ChannelDetails", () => {
  it("renders title and cover image", () => {
    const title = "Test Title"
    render(<ChannelDetails />)
    const heading = screen.getByRole("heading", { name: title })
    expect(heading).toHaveAccessibleName(title)
  })
})
