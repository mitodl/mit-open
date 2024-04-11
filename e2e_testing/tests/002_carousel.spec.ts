import { test, expect } from "@playwright/test"

test.describe("Home page upcoming courses carousel", () => {
  test("Page section renders correctly @sanity", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Upcoming Courses" }),
      "Upcoming courses header is visible",
    ).toBeVisible()
  })

  test("Carousel item renders correctly", async ({ page }) => {
    await page.goto("/")

    await expect(
      page
        .locator("section")
        .filter({
          hasText: "Upcoming Courses",
        })
        .getByRole("tab"),
    ).toHaveText(["All", "Professional"])
  })
})
