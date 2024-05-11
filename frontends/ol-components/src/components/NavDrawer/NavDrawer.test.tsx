import { NavDrawer } from "./NavDrawer"
import { render, screen } from "@testing-library/react"
import React from "react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

describe("NavDrawer", () => {
  it.each([
    {
      navData: {
        sections: [
          {
            title: "TEST",
            items: [
              {
                title: "Test Item 1",
                description: "The first test item",
                href: "https://mit.edu",
              },
              {
                title: "Test Item 2",
                description: "The second test item",
                href: "https://ocw.mit.edu",
              },
            ],
          },
        ],
      },
      expectedLinks: 2,
      expectedTitles: 2,
      expectedDescriptions: 2,
    },
    {
      navData: {
        sections: [
          {
            title: "TEST",
            items: [
              {
                title: "Test Item 1",
                description: "The first test item",
                href: "https://mit.edu",
              },
              {
                title: "Test Item 2",
                description: "The second test item",
                href: "https://ocw.mit.edu",
              },
              {
                title: "Test Item 3",
                description: "The third test item",
              },
            ],
          },
        ],
      },
      expectedLinks: 2,
      expectedTitles: 3,
      expectedDescriptions: 3,
    },
    {
      navData: {
        sections: [
          {
            title: "TEST",
            items: [
              {
                title: "Test Item 1",
                description: "The first test item",
                href: "https://mit.edu",
              },
              {
                title: "Test Item 2",
                href: "https://ocw.mit.edu",
              },
              {
                title: "Test Item 3",
                description: "The third test item",
              },
            ],
          },
        ],
      },
      expectedLinks: 2,
      expectedTitles: 3,
      expectedDescriptions: 2,
    },
  ])(
    "Renders the expected drawer contents",
    async ({
      navData,
      expectedLinks,
      expectedTitles,
      expectedDescriptions,
    }) => {
      render(<NavDrawer navdata={navData} open={true} />, {
        wrapper: ThemeProvider,
      })
      const links = await screen.getAllByRole("link")
      const titles = await screen.findAllByRole("heading")
      const descriptions = await screen.findAllByRole("note")
      expect(links).toHaveLength(expectedLinks)
      expect(titles).toHaveLength(expectedTitles)
      expect(descriptions).toHaveLength(expectedDescriptions)
      if (Number(expectedTitles) > Number(expectedLinks)) {
        let linksComingSoon = 0
        Array.prototype.forEach.call(titles, (title) => {
          if (title.textContent?.includes("(Coming Soon)")) {
            linksComingSoon++
          }
        })
        expect(linksComingSoon === expectedTitles - expectedLinks)
      }
    },
  )
})
