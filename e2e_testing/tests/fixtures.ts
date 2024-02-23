import { test as base, Page } from "@playwright/test"
import { signInUser } from "./helpers/authentication"

type Fixtures = {
  authenticated: Page
}

export const test = base.extend<Fixtures>({
  authenticated: async ({ browser }, use) => {
    const page = await signInUser(browser)

    await use(page)
  },
})

export { expect } from "@playwright/test"
