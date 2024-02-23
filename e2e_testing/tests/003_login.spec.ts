import { test, expect } from "./fixtures"

test.describe("User can log in @sanity", () => {
  test("User is logged out - Authenticated page redirects to SSO login screen", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    await expect(page).toHaveURL(
      /\/realms\/olapps\/protocol\/openid-connect\/auth/,
    )
  })

  test("User logs in and can view authenticated page", async ({
    authenticated: page,
  }) => {
    await page.goto("/")
    await page.getByLabel("User Menu").click()
    await page.getByRole("menuitem", { name: "Dashboard" }).click()

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  })

  test("User logs out and authenticated page redirects to SSO login screen", async ({
    authenticated: page,
  }) => {
    await page.getByLabel("User Menu").click()
    await page.getByRole("menuitem", { name: "Log out" }).click()

    // Sometimes we get an OIDC logout button, sometimes we go straight to "You are logged out"
    const logoutButton = page.getByRole("button", { name: "Logout" })
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    }

    await page.goto("/dashboard")
    await page.waitForURL(/\/realms\/olapps\/protocol\/openid-connect\/auth/)
  })
})
