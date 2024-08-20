import React from "react"
import HomePage from "./HomePage"
import NewsEventsSection from "./NewsEventsSection"
import { urls, setMockResponse } from "api/test-utils"
import {
  learningResources,
  newsEvents,
  testimonials,
} from "api/test-utils/factories"
import {
  renderWithProviders,
  screen,
  user,
  within,
  waitFor,
} from "../../../../mit-learn/src/test-utils"
import type { FeaturedApiFeaturedListRequest as FeaturedRequest } from "api"
import invariant from "tiny-invariant"
import * as routes from "@/common/urls"

const assertLinksTo = (
  el: HTMLElement,
  {
    pathname,
    search = {},
  }: {
    pathname: string
    search?: Record<string, string>
  },
) => {
  invariant(el instanceof HTMLAnchorElement, "Expected an anchor element")
  const url = new URL(el.href, window.location.href)
  const searchParams = Object.fromEntries(url.searchParams.entries())
  expect(url.pathname).toEqual(pathname)
  expect(searchParams).toEqual(search)
}

const setupAPIs = () => {
  setMockResponse.get(urls.userMe.get(), {})

  const resources = learningResources.resources({ count: 4 })
  const attestations = testimonials.testimonials({ count: 3 })

  setMockResponse.get(
    expect.stringContaining(urls.learningResources.list()),
    resources,
  )

  setMockResponse.get(urls.learningResources.featured({ limit: 12 }), resources)
  setMockResponse.get(
    urls.learningResources.featured({
      free: true,
      limit: 12,
    }),
    resources,
  )
  setMockResponse.get(
    urls.learningResources.featured({
      certification: true,
      professional: false,
      limit: 12,
    }),
    resources,
  )
  setMockResponse.get(
    urls.learningResources.featured({
      professional: true,
      limit: 12,
    }),
    resources,
  )

  setMockResponse.get(
    urls.newsEvents.list({ feed_type: ["news"], limit: 6, sortby: "-created" }),
    {},
  )
  setMockResponse.get(
    urls.newsEvents.list({
      feed_type: ["events"],
      limit: 5,
      sortby: "event_date",
    }),
    {},
  )

  setMockResponse.get(urls.topics.list({ is_toplevel: true }), {
    results: [],
  })

  setMockResponse.get(
    expect.stringContaining(urls.testimonials.list({})),
    attestations,
  )
}

describe("Home Page Hero", () => {
  test("Submitting search goes to search page", async () => {
    setupAPIs()
    const { location } = renderWithProviders(<HomePage />)
    const searchbox = screen.getByRole("textbox", { name: /search for/i })
    await user.click(searchbox)
    await user.paste("physics")
    await user.type(searchbox, "[Enter]")
    expect(location.current).toEqual(
      expect.objectContaining({
        pathname: "/search",
        search: "?q=physics",
      }),
    )
  })

  test("Displays popular searches", () => {
    setMockResponse.get(urls.topics.list({ is_toplevel: true }), {
      results: [],
    })
    setupAPIs()
    renderWithProviders(<HomePage />)
    const expected = [
      { label: "New", href: "/search?sortby=new" },
      { label: "Popular", href: "/search?sortby=-views" },
      { label: "Upcoming", href: "/search?sortby=upcoming" },
      { label: "Free", href: "/search?free=true" },
      { label: "With Certificate", href: "/search?certification=true" },
      { label: "Browse by Topic", href: "/topics/" },
      { label: "Explore All", href: "/search/" },
    ]
    expected.forEach(({ label, href }) => {
      const link = screen.getByRole<HTMLAnchorElement>("link", { name: label })
      expect(link).toHaveAttribute("href", href)
    })
  })
})

describe("Home Page Browse by Topic", () => {
  test("Displays topics links", async () => {
    setupAPIs()

    const response = learningResources.topics({ count: 3 })
    setMockResponse.get(urls.topics.list({ is_toplevel: true }), response)
    setMockResponse.get(urls.userMe.get(), {})
    renderWithProviders(<HomePage />)

    await waitFor(() => {
      const section = screen
        .getByRole("heading", {
          name: "Browse by Topic",
        })!
        .closest("section")!

      const links = within(section).getAllByRole("link")
      assertLinksTo(links[0], {
        pathname: new URL(response.results[0].channel_url!).pathname,
      })
      assertLinksTo(links[1], {
        pathname: new URL(response.results[1].channel_url!).pathname,
      })
      assertLinksTo(links[2], {
        pathname: new URL(response.results[2].channel_url!).pathname,
      })
    })
  })
})

describe("Home Page News and Events", () => {
  test("Displays News section", async () => {
    const news = newsEvents.newsItems({ count: 6 })
    setMockResponse.get(
      urls.newsEvents.list({
        feed_type: ["news"],
        limit: 6,
        sortby: "-created",
      }),
      news,
    )

    const events = newsEvents.eventItems({ count: 5 })
    setMockResponse.get(
      urls.newsEvents.list({
        feed_type: ["events"],
        limit: 5,
        sortby: "event_date",
      }),
      events,
    )

    renderWithProviders(<NewsEventsSection />)

    let section
    await waitFor(() => {
      section = screen
        .getByRole("heading", { name: "Stories" })!
        .closest("section")!
    })

    const links = within(section!).getAllByRole("link")

    expect(links[0]).toHaveAttribute("href", news.results[0].url)
    within(links[0]).getByText(news.results[0].title)

    expect(links[1]).toHaveAttribute("href", news.results[1].url)
    within(links[1]).getByText(news.results[1].title)

    expect(links[2]).toHaveAttribute("href", news.results[2].url)
    within(links[2]).getByText(news.results[2].title)

    expect(links[3]).toHaveAttribute("href", news.results[3].url)
    within(links[3]).getByText(news.results[3].title)

    expect(links[4]).toHaveAttribute("href", news.results[4].url)
    within(links[4]).getByText(news.results[4].title)

    expect(links[5]).toHaveAttribute("href", news.results[5].url)
    within(links[5]).getByText(news.results[5].title)
  })

  test("Displays Events section", async () => {
    const news = newsEvents.newsItems({ count: 6 })
    setMockResponse.get(
      urls.newsEvents.list({
        feed_type: ["news"],
        limit: 6,
        sortby: "-created",
      }),
      news,
    )

    const events = newsEvents.eventItems({ count: 5 })
    setMockResponse.get(
      urls.newsEvents.list({
        feed_type: ["events"],
        limit: 5,
        sortby: "event_date",
      }),
      events,
    )

    renderWithProviders(<NewsEventsSection />)

    let section
    await waitFor(() => {
      section = screen
        .getByRole("heading", { name: "Events" })!
        .closest("section")!
    })

    const links = within(section!).getAllByRole("link")

    expect(links[0]).toHaveAttribute("href", events.results[0].url)
    within(links[0]).getByText(events.results[0].title)

    expect(links[1]).toHaveAttribute("href", events.results[1].url)
    within(links[1]).getByText(events.results[1].title)

    expect(links[2]).toHaveAttribute("href", events.results[2].url)
    within(links[2]).getByText(events.results[2].title)

    expect(links[3]).toHaveAttribute("href", events.results[3].url)
    within(links[3]).getByText(events.results[3].title)

    expect(links[4]).toHaveAttribute("href", events.results[4].url)
    within(links[4]).getByText(events.results[4].title)
  })
})

describe("Home Page personalize section", () => {
  test("Links to dashboard when authenticated", async () => {
    setMockResponse.get(urls.userMe.get(), {})
    setupAPIs()

    renderWithProviders(<HomePage />)
    const personalize = (
      await screen.findByRole("heading", {
        name: "Continue Your Journey",
      })
    ).closest("section")
    invariant(personalize)
    const link = within(personalize).getByRole("link")
    expect(link).toHaveAttribute("href", "/dashboard/")
  })

  test("Links to login when not authenticated", async () => {
    setupAPIs()

    setMockResponse.get(urls.userMe.get(), {}, { code: 403 })
    renderWithProviders(<HomePage />)
    const personalize = (
      await screen.findByRole("heading", {
        name: "Personalize Your Journey",
      })
    ).closest("section")
    invariant(personalize)
    const link = within(personalize).getByRole("link")
    expect(link).toHaveAttribute(
      "href",
      routes.login({
        pathname: routes.DASHBOARD_HOME,
      }),
    )
  })
})

describe("Home Page Testimonials", () => {
  test("Displays testimonials carousel", async () => {
    setupAPIs()

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      screen.getAllByText(/testable title/i)
    })
  })
})

describe("Home Page Carousel", () => {
  test.each<{ tab: string; params: FeaturedRequest }>([
    {
      tab: "All",
      params: { limit: 12, resource_type: ["course"] },
    },
    {
      tab: "Free",
      params: { limit: 12, resource_type: ["course"], free: true },
    },
    {
      tab: "With Certificate",
      params: {
        resource_type: ["course"],
        limit: 12,
        certification: true,
        professional: false,
      },
    },
    {
      tab: "Professional & Executive Learning",
      params: { resource_type: ["course"], limit: 12, professional: true },
    },
  ])("Featured Courses Carousel Tabs", async ({ tab, params }) => {
    const resources = learningResources.resources({ count: 12 })
    setupAPIs()

    // The tab buttons eager-load the resources so we need to set them all up.

    // This is for the clicked tab (which might be "All")
    // We will check that its response is visible as cards.
    setMockResponse.get(
      urls.learningResources.featured({ ...params }),
      resources,
    )

    renderWithProviders(<HomePage />)
    screen.findByRole("tab", { name: tab }).then(async (featuredTab) => {
      await user.click(within(featuredTab).getByRole("tab", { name: tab }))
      const [featuredPanel] = screen.getAllByRole("tabpanel")
      await within(featuredPanel).findByText(resources.results[0].title)
    })
  })

  test("Tabbed Carousel sanity check", async () => {
    setupAPIs()

    renderWithProviders(<HomePage />)

    screen.findAllByRole("tablist").then(([featured, media]) => {
      within(featured).getByRole("tab", { name: "All" })
      within(featured).getByRole("tab", { name: "Free" })
      within(featured).getByRole("tab", { name: "With Certificate" })
      within(featured).getByRole("tab", {
        name: "Professional & Executive Learning",
      })
      within(media).getByRole("tab", { name: "All" })
      within(media).getByRole("tab", { name: "Videos" })
      within(media).getByRole("tab", { name: "Podcasts" })
    })
  })
})
