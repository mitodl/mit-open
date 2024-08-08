import { test, expect } from "@playwright/test"

test.describe("Home page", () => {
  test("Loads and main elements are visible @sanity", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("link", { name: "MIT Learn" }),
      "Header link is visible",
    ).toBeVisible()
  })
})
