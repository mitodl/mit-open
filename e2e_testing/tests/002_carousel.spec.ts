import { test, expect } from "@playwright/test"

const { BASE_URL } = process.env

test("Home page upcoming courses carousel renders correctly", async ({
  page,
}) => {
  await page.goto(BASE_URL!)

  await expect(
    page.getByRole("heading", { name: "Upcoming Courses" }),
    "Upcoming courses header is visible",
  ).toBeVisible()

  await expect(
    page
      .locator("section")
      .filter({
        hasText: "Upcoming Courses",
      })
      .getByRole("tabpanel")
      .getByText("Program"),
    "Resource type is visible",
  ).toBeVisible()

  await expect(
    page
      .locator("section")
      .filter({
        hasText: "Upcoming Courses",
      })
      .getByRole("tabpanel")
      .getByRole("button", { name: "Test 100000" }),
    "Title is visible",
  ).toBeVisible()

  await expect(
    page
      .locator("section")
      .filter({
        hasText: "Upcoming Courses",
      })
      .getByRole("tabpanel"),
    "Provider is visible",
  ).toBeVisible()
})
