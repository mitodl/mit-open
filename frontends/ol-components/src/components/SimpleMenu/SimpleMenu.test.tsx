import React from "react"
import { render, screen } from "@testing-library/react"
import user from "@testing-library/user-event"
import { SimpleMenu } from "./SimpleMenu"
import type { SimpleMenuItem } from "./SimpleMenu"
import { RouterProvider, createMemoryRouter } from "react-router"

describe("SimpleMenu", () => {
  it("Opens the menu when trigger is clicked", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1" },
      { key: "two", label: "Item 2" },
    ]
    const actionsOrLinks = {
      one: jest.fn(),
      two: jest.fn(),
    }

    render(
      <SimpleMenu
        trigger={<button>Open Menu</button>}
        items={items}
        actionsOrLinks={actionsOrLinks}
      />,
    )

    expect(screen.queryByRole("menu")).toBe(null)
    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    expect(screen.queryByRole("menu")).not.toBe(null)
  })

  it.each([
    { loc: "/one", expectedLoc: { pathname: "/one" } },
    {
      loc: { pathname: "/one", hash: "alpha" },
      expectedLoc: { pathname: "/one", hash: "#alpha" },
    },
  ])(
    "Renders links and accepts strings or location objects",
    async ({ loc, expectedLoc }) => {
      const items: SimpleMenuItem[] = [
        { key: "one", label: "Item 1" },
        { key: "two", label: "Item 2" },
      ]
      const actionsOrLinks = {
        one: loc,
        two: jest.fn(),
      }

      const router = createMemoryRouter([
        {
          path: "/",
          element: (
            <SimpleMenu
              trigger={<button>Open Menu</button>}
              items={items}
              actionsOrLinks={actionsOrLinks}
            />
          ),
        },
        {
          path: "*",
          element: null,
        },
      ])

      render(<RouterProvider router={router} />)

      await user.click(screen.getByRole("button", { name: "Open Menu" }))

      const links = screen.getAllByRole("link")
      const menuItems = screen.getAllByRole("menuitem")
      expect(links.length).toBe(1)
      expect(menuItems.length).toBe(2)
      const [link] = links
      await user.click(link)
      expect(router.state.location).toEqual(
        expect.objectContaining(expectedLoc),
      )
    },
  )

  it("Calls the menuitem's event andler when clicked and closes menu", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1" },
      { key: "two", label: "Item 2" },
    ]
    const actionsOrLinks = {
      one: jest.fn(),
      two: jest.fn(),
    }

    render(
      <SimpleMenu
        trigger={<button>Open Menu</button>}
        items={items}
        actionsOrLinks={actionsOrLinks}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    const menu = screen.getByRole("menu")

    await user.click(screen.getByRole("menuitem", { name: "Item 1" }))
    expect(actionsOrLinks.one).toHaveBeenCalled()
    expect(actionsOrLinks.two).not.toHaveBeenCalled()

    expect(menu).not.toBeInTheDocument()
  })

  it("Calls the trigger's event handler when clicked, in addition to opening the menu", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1" },
      { key: "two", label: "Item 2" },
    ]
    const actionsOrLinks = {
      one: jest.fn(),
      two: jest.fn(),
    }

    const triggerHandler = jest.fn()
    render(
      <SimpleMenu
        trigger={<button onClick={triggerHandler}>Open Menu</button>}
        items={items}
        actionsOrLinks={actionsOrLinks}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    const menu = screen.getByRole("menu")
    expect(menu).toBeVisible()
    expect(triggerHandler).toHaveBeenCalled()
  })
})
