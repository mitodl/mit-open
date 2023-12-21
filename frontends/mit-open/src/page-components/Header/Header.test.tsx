import React from "react"
import Header from "./Header"
import {
  renderWithProviders,
  screen,
  within,
  user,
  expectWindowNavigation,
} from "../../test-utils"
import invariant from "tiny-invariant"
import * as urls from "@/common/urls"

describe("Header", () => {
  it("Includes a link to MIT Homepage", async () => {
    renderWithProviders(<Header />)
    const header = screen.getByRole("banner")
    within(header).getByTitle("MIT Homepage", { exact: false })
  })
})

describe("UserMenu", () => {
  /**
   * Opens the user menu and returns the HTML element for the menu (contains
   * child `menuitem`s.)
   */
  const findUserMenu = async () => {
    const trigger = screen.getByRole("button", { name: "User Menu" })
    await user.click(trigger)
    return screen.findByRole("menu")
  }

  test("Trigger button shows PersonIcon for unauthenticated users", () => {
    renderWithProviders(<Header />, { user: { is_authenticated: false } })
    const trigger = screen.getByRole("button", { name: "User Menu" })
    within(trigger).getByTestId("PersonIcon")
  })

  test.each([
    { first_name: "", last_name: "" },
    { first_name: null, last_name: null },
  ])(
    "Trigger button shows PersonIcon for authenticated users w/o initials",
    (userSettings) => {
      renderWithProviders(<Header />, {
        user: { is_authenticated: true, ...userSettings },
      })
      const trigger = screen.getByRole("button", { name: "User Menu" })
      within(trigger).getByTestId("PersonIcon")
    },
  )

  test.each([
    {
      userSettings: { first_name: "Alice", last_name: "Bee" },
      expectedInitials: "AB",
    },
    {
      userSettings: { first_name: "Alice", last_name: "" },
      expectedInitials: "A",
    },
    {
      userSettings: { first_name: "", last_name: "Bee" },
      expectedInitials: "B",
    },
  ])(
    "Trigger button shows initials if available",
    ({ userSettings, expectedInitials }) => {
      renderWithProviders(<Header />, {
        user: { is_authenticated: true, ...userSettings },
      })
      const trigger = screen.getByRole("button", { name: "User Menu" })
      expect(trigger.textContent).toBe(expectedInitials)
    },
  )

  test.each([
    {
      isAuthenticated: false,
      initialUrl: "/foo/bar?cat=meow",
      expected: {
        text: "Log in",
        url: urls.login({ pathname: "/foo/bar", search: "?cat=meow" }),
      },
    },
    {
      isAuthenticated: true,
      initialUrl: "/foo/bar?cat=meow",
      expected: { text: "Log out", url: urls.LOGOUT },
    },
  ])(
    "Users (authenticated=$isAuthenticated) see '$expected.text' link",
    async ({ isAuthenticated, expected, initialUrl }) => {
      renderWithProviders(<Header />, {
        url: initialUrl,
        user: { is_authenticated: isAuthenticated },
      })
      const menu = await findUserMenu()
      const authLink = within(menu).getByRole("menuitem", {
        name: expected.text,
      })

      invariant(authLink instanceof HTMLAnchorElement)
      expect(authLink.href).toBe(`${window.origin}${expected.url}`)

      // Check for real navigation; Login page needs a page reload
      await expectWindowNavigation(() => user.click(authLink))
    },
  )

  test("Learning path editors see 'Learning Paths' link", async () => {
    const { location } = renderWithProviders(<Header />, {
      user: { is_learning_path_editor: true },
    })
    const menu = await findUserMenu()
    const link = within(menu).getByRole("menuitem", {
      name: "Learning Paths",
    })
    await user.click(link)
    expect(location.current.pathname).toBe("/learningpaths/")
  })

  test("Users WITHOUT LearningPathEditor permission do not see 'Learning Paths' link", async () => {
    renderWithProviders(<Header />, {
      user: { is_learning_path_editor: false },
    })
    const menu = await findUserMenu()
    const link = within(menu).queryByRole("menuitem", {
      name: "Learning Paths",
    })
    expect(link).toBe(null)
  })
})
