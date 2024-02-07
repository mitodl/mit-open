import { test, expect } from "@playwright/test"

const { BASE_URL } = process.env

test("Home page loads and main elements are visible", async ({ page }) => {
  console.log("BASE_URL: ", BASE_URL)
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
