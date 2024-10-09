import React from "react"
import { renderWithProviders, screen, waitFor, within } from "@/test-utils"
import type { LearningResourcesSearchResponse } from "api"
import DepartmentListingPage from "./DepartmentListingPage"
import { factories, setMockResponse, urls } from "api/test-utils"
import invariant from "tiny-invariant"
import { faker } from "@faker-js/faker/locale/en"
import { assertHeadings } from "ol-test-utilities"

const makeSearchResponse = (
  aggregations: Record<string, number>,
): LearningResourcesSearchResponse => {
  return {
    metadata: {
      suggestions: [],
      aggregations: {
        department: Object.entries(aggregations).map(([key, docCount]) => ({
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

describe("DepartmentListingPage", () => {
  const setupApis = () => {
    const schools = factories.learningResources.schools({ count: 2 })
    const makeDept = factories.learningResources.department
    const department1 = makeDept({ department_id: "dept1" })
    const department2 = makeDept({ department_id: "dept2" })
    const department3 = makeDept({ department_id: "dept3" })
    const department4 = makeDept({ department_id: "dept4" })
    const department5 = makeDept({ department_id: "dept5" })

    schools.results[0].departments = [department1, department2]
    schools.results[1].departments = [department3, department4, department5]
    const departments = [
      department1,
      department2,
      department3,
      department4,
      department5,
    ]
    const courseCounts = {
      dept1: 10,
      dept2: 20,
      dept3: 1,
      dept4: 40,
      dept5: 50,
    }
    const programCounts = {
      dept1: 1,
      dept2: 2,
      dept3: 0,
      dept4: 4,
      dept5: 5,
    }

    setMockResponse.get(urls.schools.list(), schools)
    setMockResponse.get(urls.channels.counts("department"), [
      {
        name: department1.name,
        title: department1.name,
        counts: {
          programs: 1,
          courses: 10,
        },
      },
      {
        name: department2.name,
        title: department2.name,
        counts: {
          programs: 2,
          courses: 20,
        },
      },
      {
        name: department3.name,
        title: department3.name,
        counts: {
          programs: 0,
          courses: 1,
        },
      },
      {
        name: department4.name,
        title: department4.name,
        counts: {
          programs: 4,
          courses: 40,
        },
      },
      {
        name: department5.name,
        title: department5.name,
        counts: {
          programs: 5,
          courses: 50,
        },
      },
    ])
    setMockResponse.get(
      urls.search.resources({
        resource_type: ["course"],
        aggregations: ["department"],
      }),
      makeSearchResponse(courseCounts),
    )
    setMockResponse.get(
      urls.search.resources({
        resource_type: ["program"],
        aggregations: ["department"],
      }),
      makeSearchResponse(programCounts),
    )

    return {
      schools: schools.results,
      departments,
    }
  }

  it("Has correct page title", async () => {
    setupApis()
    renderWithProviders(<DepartmentListingPage />)
    screen.getByRole("heading", { name: "Browse by Academic Department" })
  })

  it("Lists schools and departments", async () => {
    const { schools, departments } = setupApis()
    renderWithProviders(<DepartmentListingPage />)

    const school0 = (
      await screen.findByRole("heading", {
        name: schools[0].name,
      })
    ).closest("section")
    const school1 = (
      await screen.findByRole("heading", {
        name: schools[1].name,
      })
    ).closest("section")
    invariant(school0)
    invariant(school1)

    const school0depts = within(school0).getAllByRole("link")
    const school1depts = within(school1).getAllByRole("link")

    expect(school0depts).toHaveLength(2)
    expect(school1depts).toHaveLength(3)

    const [d1, d2, d3, d4, d5] = departments
    expect(school0depts[0]).toHaveTextContent(d1.name)
    expect(school0depts[1]).toHaveTextContent(d2.name)

    expect(school1depts[0]).toHaveTextContent(d3.name)
    expect(school1depts[1]).toHaveTextContent(d4.name)
    expect(school1depts[2]).toHaveTextContent(d5.name)
  })

  test("Department links show course and program counts", async () => {
    const { departments } = setupApis()
    renderWithProviders(<DepartmentListingPage />)

    const link1 = await screen.findByRole("link", {
      name: (name) => name.includes(departments[0].name),
    })
    const link2 = await screen.findByRole("link", {
      name: (name) => name.includes(departments[1].name),
    })
    const link3 = await screen.findByRole("link", {
      name: (name) => name.includes(departments[2].name),
    })

    expect(link1).toHaveTextContent("10 Courses")
    expect(link1).toHaveTextContent("1 Program")

    expect(link2).toHaveTextContent("20 Courses")
    expect(link2).toHaveTextContent("2 Programs")

    expect(link3).toHaveTextContent("1 Course")
    expect(link3).not.toHaveTextContent("Program")
  })

  test("Department links navigate to department page", async () => {
    const { departments } = setupApis()
    renderWithProviders(<DepartmentListingPage />)

    const dept = faker.helpers.arrayElement(departments)
    const link = await screen.findByRole("link", {
      name: (name) => name.includes(dept.name),
    })

    expect(link).toHaveAttribute("href", new URL(dept.channel_url!).pathname)
  })

  test("headings", async () => {
    const { schools } = setupApis()
    renderWithProviders(<DepartmentListingPage />)

    await waitFor(() => {
      assertHeadings([
        { level: 1, name: "Browse by Academic Department" },
        ...schools.map(({ name }) => ({ level: 2, name })),
      ])
    })
  })
})
