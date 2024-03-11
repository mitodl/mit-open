import type { Browser } from "@playwright/test"

export const signInUser = async (browser: Browser) => {
  const context = await browser.newContext({
    storageState: "playwright/.auth/user.json",
  })
  const page = await context.newPage()

  await page.goto("/login/ol-oidc")

  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL)
  await page.getByRole("button", { name: "Next" }).click()

  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD)
  await page.getByRole("button", { name: "Next" }).click()

  return page
}
