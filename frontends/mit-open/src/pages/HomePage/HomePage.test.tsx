import React from "react"
import HomePage from "./HomePage"
import NewsEventsSection from "./NewsEventsSection"
import { urls, setMockResponse } from "api/test-utils"
import { learningResources, newsEvents } from "api/test-utils/factories"
import {
  renderWithProviders,
  screen,
  user,
  within,
  waitFor,
} from "../../test-utils"
import invariant from "tiny-invariant"

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

const setup = () => {
  const resources = learningResources.resources({ count: 4 })
  setMockResponse.get(
    expect.stringContaining(urls.learningResources.list()),
    resources,
  )
  setMockResponse.get(
    expect.stringContaining(urls.learningResources.featured()),
    resources,
  )

  setMockResponse.get(
    urls.newsEvents.list({ feed_type: ["news"], limit: 6 }),
    {},
  )
  setMockResponse.get(
    urls.newsEvents.list({ feed_type: ["events"], limit: 5 }),
    {},
  )

  return renderWithProviders(<HomePage />)
}

describe("Home Page Hero", () => {
  test("Submitting search goes to search page", async () => {
    setMockResponse.get(urls.userMe.get(), {})
    setMockResponse.get(urls.topics.list({ is_toplevel: true }), {
      results: [],
    })

    const { location } = setup()
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
    setup()
    const aiCourses = screen.getByRole<HTMLAnchorElement>("link", {
      name: /ai courses/i,
    })
    const engineeringCourses = screen.getByRole<HTMLAnchorElement>("link", {
      name: /engineering courses/i,
    })
    const all = screen.getByRole<HTMLAnchorElement>("link", {
      name: /explore all/i,
    })
    assertLinksTo(aiCourses, {
      pathname: "/search",
      search: { topic: "Artificial Intelligence", resource_type: "course" },
    })
    assertLinksTo(engineeringCourses, {
      pathname: "/search",
      search: { topic: "Engineering", resource_type: "course" },
    })
    assertLinksTo(all, { pathname: "/search" })
  })
})

describe("Home Page Carousel", () => {
  test("Tabbed Carousel sanity check", () => {
    setMockResponse.get(urls.topics.list({ is_toplevel: true }), {
      results: [],
    })
    setup()
    const [featured, media] = screen.getAllByRole("tablist")
    within(featured).getByRole("tab", { name: "All" })
    within(featured).getByRole("tab", { name: "Free" })
    within(featured).getByRole("tab", { name: "Certificate" })
    within(featured).getByRole("tab", { name: "Professional" })
    within(media).getByRole("tab", { name: "All" })
    within(media).getByRole("tab", { name: "Videos" })
    within(media).getByRole("tab", { name: "Podcasts" })
  })
})

describe("Home Page Browse by Topics", () => {
  test("Displays topics links", async () => {
    const response = learningResources.topics({ count: 3 })
    setMockResponse.get(urls.topics.list({ is_toplevel: true }), response)
    setMockResponse.get(urls.userMe.get(), {})

    setup()

    await waitFor(() => {
      const section = screen
        .getByRole("heading", {
          name: "Browse by Topics",
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
      urls.newsEvents.list({ feed_type: ["news"], limit: 6 }),
      news,
    )

    const events = newsEvents.eventItems({ count: 5 })
    setMockResponse.get(
      urls.newsEvents.list({ feed_type: ["events"], limit: 5 }),
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
      urls.newsEvents.list({ feed_type: ["news"], limit: 6 }),
      news,
    )

    const events = newsEvents.eventItems({ count: 5 })
    setMockResponse.get(
      urls.newsEvents.list({ feed_type: ["events"], limit: 5 }),
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
