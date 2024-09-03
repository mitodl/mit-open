import React from "react"
import { renderWithProviders, screen, waitFor, within } from "@/test-utils"
import type { LearningResourcesSearchResponse } from "api"
import TopicsListingPage from "./TopicsListingPage"
import { factories, setMockResponse, urls } from "api/test-utils"
import invariant from "tiny-invariant"
import { assertHeadings } from "ol-test-utilities"

const makeSearchResponse = (
  aggregations: Record<string, number>,
): LearningResourcesSearchResponse => {
  return {
    metadata: {
      suggestions: [],
      aggregations: {
        topic: Object.entries(aggregations).map(([key, docCount]) => ({
          key,
          doc_count: docCount,
        })),
      },
    },
    count: 0,
    results: [],
    next: null,
    previous: null,
  }
}

const sorter = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name)

describe("TopicsListingPage", () => {
  const setupApis = () => {
    const make = factories.learningResources
    const t1 = make.topic({ parent: null })
    const t1a = make.topic({ parent: t1.id })
    const t1b = make.topic({ parent: t1.id })
    const t1c = make.topic({ parent: t1.id })
    const t1a1 = make.topic({ parent: t1a.id })
    const t2 = make.topic({ parent: null })
    const t2a = make.topic({ parent: t2.id })
    const t2b = make.topic({ parent: t2.id })
    const topics = { t1, t1a, t1b, t1c, t1a1, t2, t2a, t2b }

    const courseCounts = {
      [t1.name]: 100,
      [t2.name]: 200,
    }
    const programCounts = {
      [t1.name]: 10,
      [t2.name]: 20,
    }

    setMockResponse.get(urls.topics.list(), {
      count: Object.values(topics).length,
      next: null,
      previous: null,
      results: Object.values(topics),
    })
    setMockResponse.get(
      urls.search.resources({
        resource_type: ["course"],
        aggregations: ["topic"],
      }),
      makeSearchResponse(courseCounts),
    )
    setMockResponse.get(
      urls.search.resources({
        resource_type: ["program"],
        aggregations: ["topic"],
      }),
      makeSearchResponse(programCounts),
    )

    const sortedSubtopics1 = [topics.t1a, topics.t1b, topics.t1c].sort(sorter)
    const sortedSubtopics2 = [topics.t2a, topics.t2b].sort(sorter)

    return {
      topics,
      sortedSubtopics1,
      sortedSubtopics2,
    }
  }

  const closestItem = (el: HTMLElement) => {
    const item = el.closest("li")
    invariant(item)
    return item
  }

  it("Has a page title", async () => {
    setupApis()
    renderWithProviders(<TopicsListingPage />)
    await waitFor(() => {
      expect(document.title).toBe("Topics | MIT Learn")
    })
    screen.getByRole("heading", { name: "Browse by Topic" })
  })

  it("Lists subtopics grouped by topic", async () => {
    const { topics, sortedSubtopics1, sortedSubtopics2 } = setupApis()
    renderWithProviders(<TopicsListingPage />)

    const topic1 = closestItem(
      await screen.findByRole("heading", { name: topics.t1.name }),
    )
    const topic2 = closestItem(
      await screen.findByRole("heading", { name: topics.t2.name }),
    )

    const subtopics1 = within(topic1).getAllByRole<HTMLAnchorElement>("link")
    const subtopics2 = within(topic2).getAllByRole<HTMLAnchorElement>("link")

    expect(subtopics1).toHaveLength(1 + 3) // root topic + sbutopics
    expect(subtopics2).toHaveLength(1 + 2) // root topic + sbutopics

    expect(subtopics1[0]).toHaveTextContent(topics.t1.name)
    expect(subtopics1[1]).toHaveTextContent(sortedSubtopics1[0].name)
    expect(subtopics1[2]).toHaveTextContent(sortedSubtopics1[1].name)
    expect(subtopics1[3]).toHaveTextContent(sortedSubtopics1[2].name)
    expect(subtopics1.map((el) => el.href)).toEqual([
      topics.t1.channel_url,
      ...sortedSubtopics1.map((t) => t.channel_url),
    ])

    expect(subtopics2[0]).toHaveTextContent(topics.t2.name)
    expect(subtopics2[1]).toHaveTextContent(sortedSubtopics2[0].name)
    expect(subtopics2[2]).toHaveTextContent(sortedSubtopics2[1].name)
    expect(subtopics2.map((el) => el.href)).toEqual([
      topics.t2.channel_url,
      ...sortedSubtopics2.map((t) => t.channel_url),
    ])
  })

  test("Department links show course and program counts", async () => {
    const { topics } = setupApis()
    renderWithProviders(<TopicsListingPage />)

    const topic1 = closestItem(
      await screen.findByRole("heading", { name: topics.t1.name }),
    )
    const topic2 = closestItem(
      await screen.findByRole("heading", { name: topics.t2.name }),
    )

    await new Promise((res) => setTimeout(res, 200))

    expect(topic1).toHaveTextContent("Courses: 100")
    expect(topic1).toHaveTextContent("Programs: 10")

    expect(topic2).toHaveTextContent("Courses: 200")
    expect(topic2).toHaveTextContent("Programs: 20")
  })

  test("headings", async () => {
    const { topics } = setupApis()
    const sorted = [topics.t1, topics.t2].sort(sorter)
    renderWithProviders(<TopicsListingPage />)
    await waitFor(() => {
      assertHeadings([
        { level: 1, name: "Browse by Topic" },
        ...sorted.map((t) => ({ level: 2, name: t.name })),
      ])
    })
  })
})
