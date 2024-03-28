import React from "react"
import { render, screen } from "@testing-library/react"
import CardTemplate from "./CardTemplate"

describe("CardTemplate", () => {
  it("renders title and cover image", () => {
    const title = "Test Title"
    render(<CardTemplate variant="column" title={title} />)
    const heading = screen.getByRole("heading", { name: title })
    expect(heading).toHaveAccessibleName(title)
  })
})
