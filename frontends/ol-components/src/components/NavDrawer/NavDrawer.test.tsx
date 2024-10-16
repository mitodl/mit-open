import { NavData, NavDrawer } from "./NavDrawer"
import { render, screen } from "@testing-library/react"
import React from "react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

describe("NavDrawer", () => {
  it("Renders the expected drawer contents", () => {
    const navData: NavData = {
      sections: [
        {
          title: "TEST",
          items: [
            {
              title: "Link and description with icon",
              icon: "/path/to/image.svg",
              description: "This item has a link, description and icon",
              href: "https://mit.edu",
            },
            {
              title: "Link and description",
              description: "This item has a link and a description",
              href: "https://mit.edu",
            },
            {
              title: "Link but no description",
              href: "https://ocw.mit.edu",
            },
          ],
        },
      ],
    }
    render(<NavDrawer navdata={navData} open={true} />, {
      wrapper: ThemeProvider,
    })
    const links = screen.getAllByTestId("nav-link")
    const icons = screen.getAllByTestId("nav-link-icon")
    const titles = screen.getAllByTestId("nav-link-text")
    const descriptions = screen.getAllByTestId("nav-link-description")
    expect(links).toHaveLength(3)
    expect(icons).toHaveLength(1)
    expect(titles).toHaveLength(3)
    expect(descriptions).toHaveLength(2)
  })
})
