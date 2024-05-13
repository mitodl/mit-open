import { NavDrawer } from "./NavDrawer"
import { render, screen } from "@testing-library/react"
import React from "react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

describe("NavDrawer", () => {
  it("Renders the expected drawer contents", () => {
    const navData = {
      sections: [
        {
          title: "TEST",
          items: [
            {
              title: "Link and description",
              description: "This item has a link and a description",
              href: "https://mit.edu",
            },
            {
              title: "Link but no description",
              href: "https://ocw.mit.edu",
            },
            {
              title: "Description, but no link",
              description: "This item has a description, but no link",
            },
            {
              title: "Title only",
            },
          ],
        },
      ],
    }
    render(<NavDrawer navdata={navData} open={true} />, {
      wrapper: ThemeProvider,
    })
    const links = screen.getAllByTestId("nav-link")
    const titles = screen.getAllByTestId("nav-link-text")
    const descriptions = screen.getAllByTestId("nav-link-description")
    expect(links).toHaveLength(2)
    expect(titles).toHaveLength(4)
    expect(descriptions).toHaveLength(2)
    let linksComingSoon = 0
    Array.prototype.forEach.call(titles, (title) => {
      if (title.textContent?.includes("(Coming Soon)")) {
        linksComingSoon++
      }
    })
    expect(linksComingSoon === 2).toBeTruthy()
  })
})
