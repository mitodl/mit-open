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
  it("Includes a link to the Homepage", async () => {
    setMockResponse.get(urls.userMe.get(), {})
    renderWithProviders(<Header />)
    const header = screen.getByRole("banner")
    within(header).getAllByTitle("Link to Homepage", { exact: false })
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

  test.each([{}, { profile: null }, { profile: {} }])(
    "Trigger button shows UserIcon for authenticated users w/o initials",
    async (userSettings) => {
      setMockResponse.get(urls.userMe.get(), userSettings)

      renderWithProviders(<Header />)

      const trigger = await screen.findByRole("button", { name: "User Menu" })
      within(trigger).getByTestId("UserIcon")
    },
  )

  test("Trigger button shows name if available", async () => {
    setMockResponse.get(urls.userMe.get(), { profile: { name: "Alice Bee" } })

    renderWithProviders(<Header />)
    const trigger = await screen.findByRole("button", { name: "User Menu" })
    expect(trigger.textContent).toBe("Alice Bee")
  })

  test("Unauthenticated users see the Sign Up / Login link", async () => {
    const isAuthenticated = false
    const initialUrl = "/foo/bar?cat=meow"
    const expectedUrl = urlConstants.login({
      pathname: "/foo/bar",
      search: "?cat=meow",
    })
    setMockResponse.get(urls.userMe.get(), {
      is_authenticated: isAuthenticated,
    })
    renderWithProviders(<Header />, {
      url: initialUrl,
    })
    const desktopLoginButton = await screen.findByTestId("login-button-desktop")
    const mobileLoginButton = await screen.findByTestId("login-button-mobile")
    invariant(desktopLoginButton instanceof HTMLAnchorElement)
    invariant(mobileLoginButton instanceof HTMLAnchorElement)
    expect(desktopLoginButton.href).toBe(expectedUrl)
    expect(mobileLoginButton.href).toBe(expectedUrl)

    // Check for real navigation; Login page needs a page reload
    await expectWindowNavigation(() => user.click(desktopLoginButton))
    await expectWindowNavigation(() => user.click(mobileLoginButton))
  })

  test("Authenticated users see the Log Out link", async () => {
    const isAuthenticated = true
    const initialUrl = "/foo/bar?cat=meow"
    const expected = { text: "Log Out", url: urlConstants.LOGOUT }
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
    expect(authLink.href).toBe(expected.url)

    // Check for real navigation; Login page needs a page reload
    await expectWindowNavigation(() => user.click(authLink))
  })

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
