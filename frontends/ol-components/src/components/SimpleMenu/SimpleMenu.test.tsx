import React from "react"
import { render, screen } from "@testing-library/react"
import user from "@testing-library/user-event"
import { SimpleMenu } from "./SimpleMenu"
import type { SimpleMenuItem } from "./SimpleMenu"
import type { LinkProps } from "react-router-dom"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

// Mock react-router-dom's Link so we don't need to set up a Router
jest.mock("react-router-dom", () => {
  return {
    Link: React.forwardRef<HTMLAnchorElement, LinkProps>(
      jest.fn((props, ref) => {
        return (
          <a
            {...props}
            ref={ref}
            data-prop-to={props.to}
            data-react-component="react-router-dom-link"
          />
        )
      }),
    ),
  }
})

describe("SimpleMenu", () => {
  it("Opens the menu when trigger is clicked", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: jest.fn() },
      { key: "two", label: "Item 2", onClick: jest.fn() },
    ]

    render(<SimpleMenu trigger={<button>Open Menu</button>} items={items} />, {
      wrapper: ThemeProvider,
    })

    expect(screen.queryByRole("menu")).toBe(null)
    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    expect(screen.queryByRole("menu")).not.toBe(null)
  })

  it("Calls the menuitem's event andler when clicked and closes menu", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: jest.fn() },
      { key: "two", label: "Item 2", onClick: jest.fn() },
    ]

    render(<SimpleMenu trigger={<button>Open Menu</button>} items={items} />, {
      wrapper: ThemeProvider,
    })
    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    const menu = screen.getByRole("menu")

    await user.click(screen.getByRole("menuitem", { name: "Item 1" }))
    expect(items[0].onClick).toHaveBeenCalled()
    expect(items[1].onClick).not.toHaveBeenCalled()

    expect(menu).not.toBeInTheDocument()
  })

  it("Calls the trigger's event handler when clicked, in addition to opening the menu", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: jest.fn() },
      { key: "two", label: "Item 2", onClick: jest.fn() },
    ]

    const triggerHandler = jest.fn()
    render(
      <SimpleMenu
        trigger={<button onClick={triggerHandler}>Open Menu</button>}
        items={items}
      />,
      { wrapper: ThemeProvider },
    )

    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    const menu = screen.getByRole("menu")
    expect(menu).toBeVisible()
    expect(triggerHandler).toHaveBeenCalled()
  })

  it("Calls onVisibilityChange when menu opens/closes", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: jest.fn() },
      { key: "two", label: "Item 2", onClick: jest.fn() },
    ]

    const visibilityHandler = jest.fn()
    render(
      <SimpleMenu
        onVisibilityChange={visibilityHandler}
        trigger={<button>Open Menu</button>}
        items={items}
      />,
      { wrapper: ThemeProvider },
    )

    expect(visibilityHandler).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    expect(visibilityHandler).toHaveBeenCalledTimes(1)
    expect(visibilityHandler).toHaveBeenCalledWith(true)

    visibilityHandler.mockClear()

    await user.click(screen.getByRole("menuitem", { name: "Item 1" }))
    expect(visibilityHandler).toHaveBeenCalledTimes(1)
    expect(visibilityHandler).toHaveBeenCalledWith(false)

    visibilityHandler.mockClear()
  })

  it("Renders link items using React Router's Link", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: jest.fn() },
      { key: "two", label: "Item 2", href: "./woof" },
    ]

    render(<SimpleMenu trigger={<button>Open Menu</button>} items={items} />, {
      wrapper: ThemeProvider,
    })
    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    const item2 = screen.getByRole("menuitem", { name: "Item 2" })
    expect(item2.dataset.reactComponent).toBe("react-router-dom-link")
    expect(item2.dataset.propTo).toBe("./woof")
  })

  it("Renders link with custom LinkComponent if specified", async () => {
    const LinkComponent = React.forwardRef<HTMLAnchorElement, { href: string }>(
      (props, ref) => {
        return <a {...props} ref={ref} data-react-component="custom-link" />
      },
    )
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: jest.fn() },
      { key: "two", label: "Item 2", href: "./woof", LinkComponent },
    ]

    render(<SimpleMenu trigger={<button>Open Menu</button>} items={items} />, {
      wrapper: ThemeProvider,
    })
    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    const item2 = screen.getByRole("menuitem", { name: "Item 2" })
    expect(item2.dataset.reactComponent).toBe("custom-link")
    expect((item2 as HTMLAnchorElement).href).toBe(`${window.origin}/woof`)
  })
})
