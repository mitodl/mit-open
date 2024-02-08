import { describe, test, expect } from "@playwright/test"

const { BASE_URL } = process.env

describe("Home page", () => {
  test("Loads and main elements are visible @sanity", async ({ page }) => {
    await page.goto(BASE_URL!)

    await expect(
      page.getByRole("link", { name: "MIT Open" }),
      "Header link is visible",
    ).toBeVisible()

    await expect(
      page.getByRole("heading", { name: "Learn from MIT" }),
      "Main heading is visible",
    ).toBeVisible()

    await expect(
      page.getByPlaceholder("What do you want to learn?"),
      "Main search input is visible",
    ).toBeVisible()
  })
})
