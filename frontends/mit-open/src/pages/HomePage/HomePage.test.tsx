import React from "react"
import HomePage from "./HomePage"
import { urls, setMockResponse } from "api/test-utils"
import { learningResources as factory } from "api/test-utils/factories"
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
  const resources = factory.resources({ count: 4 })
  setMockResponse.get(
    expect.stringContaining(urls.learningResources.list()),
    resources,
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
    const [upcoming, media] = screen.getAllByRole("tablist")
    within(upcoming).getByRole("tab", { name: "All" })
    within(upcoming).getByRole("tab", { name: "Professional" })
    within(media).getByRole("tab", { name: "All" })
    within(media).getByRole("tab", { name: "Videos" })
    within(media).getByRole("tab", { name: "Podcasts" })
  })
})

describe("Home Page Browse by Topics", () => {
  test("Displays topics links", async () => {
    setMockResponse.get(urls.userMe.get(), {})
    setMockResponse.get(urls.topics.list({ is_toplevel: true }), {
      count: 3,
      next: null,
      previous: null,
      results: [
        {
          id: 9,
          name: "Business",
          parent: null,
          channel_url: "https://mitopen.odl.mit.edu/c/topic/business/",
        },
        {
          id: 335,
          name: "Communications",
          parent: null,
          channel_url: "https://mitopen.odl.mit.edu/c/topic/communications/",
        },
        {
          id: 119,
          name: "Energy",
          parent: null,
          channel_url: "https://mitopen.odl.mit.edu/c/topic/energy/",
        },
      ],
    })

    setup()

    await waitFor(() => {
      const section = screen
        .getByRole("heading", {
          name: "Browse by Topics",
        })!
        .closest("section")!

      const links = within(section).getAllByRole("link")

      assertLinksTo(links[0], {
        pathname: "/c/topic/business/",
      })

      assertLinksTo(links[1], {
        pathname: "/c/topic/communications/",
      })

      assertLinksTo(links[2], {
        pathname: "/c/topic/energy/",
      })
    })
  })
})
