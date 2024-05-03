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
import * as urlConstants from "@/common/urls"
import { setMockResponse, urls } from "api/test-utils"

describe("Header", () => {
  it("Includes a link to MIT Homepage", async () => {
    setMockResponse.get(urls.userMe.get(), {})
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
    const trigger = await screen.findByRole("button", { name: "User Menu" })
    await user.click(trigger)
    return screen.findByRole("menu")
  }

  test("Trigger button shows PersonIcon for unauthenticated users", async () => {
    setMockResponse.get(urls.userMe.get(), { is_authenticated: false })
    renderWithProviders(<Header />)
    const trigger = await screen.findByRole("button", { name: "User Menu" })
    within(trigger).getByTestId("PersonIcon")
  })

  test.each([
    { first_name: "", last_name: "" },
    { first_name: null, last_name: null },
  ])(
    "Trigger button shows PersonIcon for authenticated users w/o initials",
    async (userSettings) => {
      setMockResponse.get(urls.userMe.get(), userSettings)

      renderWithProviders(<Header />)

      const trigger = await screen.findByRole("button", { name: "User Menu" })
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
    async ({ userSettings, expectedInitials }) => {
      setMockResponse.get(urls.userMe.get(), userSettings)

      renderWithProviders(<Header />)
      const trigger = await screen.findByRole("button", { name: "User Menu" })
      expect(trigger.textContent).toBe(expectedInitials)
    },
  )

  test.each([
    {
      isAuthenticated: false,
      initialUrl: "/foo/bar?cat=meow",
      expected: {
        text: "Log in",
        url: urlConstants.login({ pathname: "/foo/bar", search: "?cat=meow" }),
      },
    },
    {
      isAuthenticated: true,
      initialUrl: "/foo/bar?cat=meow",
      expected: { text: "Log out", url: urlConstants.LOGOUT },
    },
  ])(
    "Users (authenticated=$isAuthenticated) see '$expected.text' link",
    async ({ isAuthenticated, expected, initialUrl }) => {
      setMockResponse.get(urls.userMe.get(), {
        is_authenticated: isAuthenticated,
      })
      renderWithProviders(<Header />, {
        url: initialUrl,
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
    setMockResponse.get(urls.userMe.get(), { is_learning_path_editor: true })
    const { location } = renderWithProviders(<Header />)
    const menu = await findUserMenu()
    const link = within(menu).getByRole("menuitem", {
      name: "Learning Paths",
    })
    await user.click(link)
    expect(location.current.pathname).toBe("/learningpaths/")
  })

  test("Users WITHOUT LearningPathEditor permission do not see 'Learning Paths' link", async () => {
    setMockResponse.get(urls.userMe.get(), { is_learning_path_editor: false })
    renderWithProviders(<Header />)
    const menu = await findUserMenu()
    const link = within(menu).queryByRole("menuitem", {
      name: "Learning Paths",
    })
    expect(link).toBe(null)
  })
})
