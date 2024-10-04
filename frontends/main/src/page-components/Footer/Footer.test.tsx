import { render, screen } from "@testing-library/react"
import Footer from "./Footer"
import React from "react"
import { ThemeProvider } from "ol-components"
import * as urls from "@/common/urls"

describe("Footer", () => {
  test("Renders the appropriate text and links", async () => {
    render(
      <ThemeProvider>
        <Footer />
      </ThemeProvider>,
    )
    interface Links {
      [key: string]: string
    }
    const expectedLinks: Links = {
      // key is blank here because the link is an image
      "": "https://mit.edu/",
      Home: urls.HOME,
      "About Us": urls.ABOUT,
      Accessibility: urls.ACCESSIBILITY,
      "Privacy Policy": urls.PRIVACY,
      "Contact Us": urls.CONTACT,
    }
    const footer = screen.getByRole("contentinfo")
    const address = screen.getByTestId("footer-address")
    const links = screen.getAllByRole("link")
    const copyright = screen.getByText(
      `© ${new Date().getFullYear()} Massachusetts Institute of Technology`,
    )

    expect(footer).toBeInTheDocument()
    expect(address).toHaveTextContent("Massachusetts Institute of Technology")
    expect(address).toHaveTextContent("77 Massachusetts Avenue")
    expect(address).toHaveTextContent("Cambridge, MA 02139")
    expect(links).toHaveLength(6)
    for (const link of links) {
      expect(link).toHaveAttribute(
        "href",
        expectedLinks[link.textContent?.trim() as string],
      )
    }
    expect(copyright).toBeInTheDocument()
  })
})
