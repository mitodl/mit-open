import {
  renderTestApp,
  screen,
  waitFor,
  setMockResponse,
  within,
} from "../../test-utils"
import { factories, urls } from "api/test-utils"
import { Permissions } from "@/common/permissions"
import { DashboardTabLabels } from "./DashboardPage"
import { faker } from "@faker-js/faker/locale/en"
import {
  CourseResource,
  LearningResource,
  LearningResourceSearchResponse,
  LearningResourcesSearchRetrieveLearningFormatEnum,
} from "api"

const makeSearchResponse = (
  results: CourseResource[] | LearningResource[],
): LearningResourceSearchResponse => {
  return {
    metadata: {
      suggestions: [],
      aggregations: {},
    },
    count: 0,
    results: results,
    next: null,
    previous: null,
  }
}

const setupAPIs = () => {
  const profile = factories.profiles.profile({
    preference_search_filters: {
      topic: factories.learningResources
        .topics({ count: 3 })
        .results.map((topic) => topic.name),
      certification: faker.helpers.arrayElement([true, false]),
      learning_format: faker.helpers.arrayElements([
        "online",
        "in-person",
        "hybrid",
      ]),
    },
  })
  const certification: boolean | undefined =
    profile?.preference_search_filters.certification
  const topics = profile?.preference_search_filters.topic
  const learningFormat = Object.values(
    LearningResourcesSearchRetrieveLearningFormatEnum,
  ).filter((format) =>
    profile?.preference_search_filters.learning_format?.includes(format),
  )
  const courses = factories.learningResources.courses({ count: 20 })
  const resources = factories.learningResources.resources({ count: 20 })

  setMockResponse.get(urls.userMe.get(), {
    username: profile.username,
    [Permissions.Authenticated]: true,
  })
  setMockResponse.get(urls.profileMe.get(), profile)
  setMockResponse.get(
    expect.stringContaining(
      urls.search.resources({
        resource_type: ["course"],
        limit: 12,
        sortby: "-views",
        certification: certification,
        learning_format: learningFormat,
        topic: topics,
      }),
    ),
    makeSearchResponse(courses.results),
  )
  topics?.forEach((topic) => {
    setMockResponse.get(
      expect.stringContaining(
        urls.search.resources({
          resource_type: ["course"],
          limit: 12,
          sortby: "-views",
          topic: [topic],
        }),
      ),
      makeSearchResponse(courses.results),
    )
  })
  setMockResponse.get(
    expect.stringContaining(
      urls.search.resources({
        resource_type: ["course"],
        limit: 12,
        sortby: "-views",
        certification: certification,
      }),
    ),
    makeSearchResponse(courses.results),
  )
  setMockResponse.get(
    expect.stringContaining(
      urls.search.resources({ limit: 12, sortby: "new" }),
    ),
    makeSearchResponse([...courses.results, ...resources.results]),
  )
  setMockResponse.get(
    expect.stringContaining(
      urls.search.resources({ limit: 12, sortby: "-views" }),
    ),
    makeSearchResponse([...courses.results, ...resources.results]),
  )
}

describe("DashboardPage", () => {
  test("Renders title", async () => {
    setupAPIs()
    renderTestApp({
      url: "/dashboard",
    })
    await waitFor(() => {
      expect(document.title).toBe("User Home")
    })
    screen.getByRole("heading", {
      name: "Your MIT Learning Journey",
    })
  })

  test("Renders user info", async () => {
    setupAPIs()
    setMockResponse.get(urls.userMe.get(), {
      [Permissions.Authenticated]: true,
      first_name: "User",
      last_name: "Info",
    })

    renderTestApp({
      url: "/dashboard",
    })
    await waitFor(() => {
      /**
       * There should be two instances of "User Info" text,
       * one in the header and one in the main content
       */
      const userInfoText = screen.getAllByText("User Info")
      expect(userInfoText).toHaveLength(2)
    })
  })

  test("Renders user menu tabs and panels", async () => {
    setupAPIs()
    renderTestApp({
      url: "/dashboard",
    })
    const tabLists = await screen.findAllByRole("tablist")
    const desktopTabList = await screen.findByTestId("desktop-tab-list")
    const mobileTabList = await screen.findByTestId("mobile-tab-list")
    const desktopTabs = await within(desktopTabList).findAllByRole("tab")
    const mobileTabs = await within(mobileTabList).findAllByRole("tab")
    const tabPanels = await screen.findAllByRole("tabpanel", { hidden: true })
    // 1 for mobile, 1 for desktop
    expect(tabLists).toHaveLength(2)
    expect(mobileTabs).toHaveLength(3)
    expect(desktopTabs).toHaveLength(3)
    expect(tabPanels).toHaveLength(3)
    Object.values(DashboardTabLabels).forEach((label) => {
      const desktopLabel = within(desktopTabList).getByText(label)
      const mobileLabel = within(mobileTabList).getByText(label)
      expect(desktopLabel).toBeInTheDocument()
      expect(mobileLabel).toBeInTheDocument()
    })
  })

  test("Renders the expected tab links", async () => {
    setupAPIs()
    renderTestApp({
      url: "/dashboard",
    })
    Object.keys(DashboardTabLabels).forEach(async (key) => {
      const desktopTab = await screen.findByTestId(`desktop-tab-${key}`)
      const mobileTab = await screen.findByTestId(`mobile-tab-${key}`)
      expect(desktopTab).toBeInTheDocument()
      expect(mobileTab).toBeInTheDocument()
      expect(desktopTab).toHaveAttribute("href", `/dashboard#${key}`)
      expect(mobileTab).toHaveAttribute("href", `/dashboard#${key}`)
    })
  })
})
