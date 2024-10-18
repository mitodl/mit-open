import React from "react"
import { render, screen, within } from "@testing-library/react"
import { courses } from "../LearningResourceCard/testUtils"
import InfoSection from "./InfoSection"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { formatRunDate } from "ol-utilities"
import invariant from "tiny-invariant"

describe("Learning resource info section pricing", () => {
  test("Free course, no certificate", () => {
    render(<InfoSection resource={courses.free.noCertificate} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("Free")
    expect(screen.queryByText("Paid")).toBeNull()
    expect(screen.queryByText("Earn a certificate:")).toBeNull()
    expect(screen.queryByText("Certificate included")).toBeNull()
  })

  test("Free course, with certificate, one price", () => {
    render(<InfoSection resource={courses.free.withCertificateOnePrice} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("Free")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Earn a certificate:")
    screen.getByText("$49")
  })

  test("Free course, with certificate, price range", () => {
    render(<InfoSection resource={courses.free.withCertificatePriceRange} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("Free")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Earn a certificate:")
    screen.getByText("$49 – $99")
  })

  test("Unknown price, no certificate", () => {
    render(<InfoSection resource={courses.unknownPrice.noCertificate} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("Paid")
    expect(screen.queryByText("Free")).toBeNull()
    expect(screen.queryByText("Earn a certificate:")).toBeNull()
    expect(screen.queryByText("Certificate included")).toBeNull()
  })

  test("Unknown price, with certificate", () => {
    render(<InfoSection resource={courses.unknownPrice.withCertificate} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("Paid")
    expect(screen.queryByText("Free")).toBeNull()
    screen.getByText("Certificate included")
  })

  test("Paid course, no certificate", () => {
    render(<InfoSection resource={courses.paid.withoutCertificate} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("$49")
    expect(screen.queryByText("Paid")).toBeNull()
    expect(screen.queryByText("Free")).toBeNull()
    expect(screen.queryByText("Earn a certificate:")).toBeNull()
    expect(screen.queryByText("Certificate included")).toBeNull()
  })

  test("Paid course, with certificate, one price", () => {
    render(<InfoSection resource={courses.paid.withCerticateOnePrice} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("$49")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Certificate included")
  })

  test("Paid course, with certificate, price range", () => {
    render(<InfoSection resource={courses.paid.withCertificatePriceRange} />, {
      wrapper: ThemeProvider,
    })

    screen.getByText("$49 – $99")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Certificate included")
  })
})

describe("Learning resource info section start date", () => {
  test("Start date", () => {
    const course = courses.free.dated
    const run = course.runs?.[0]
    invariant(run)
    const runDate = formatRunDate(run, false)
    invariant(runDate)
    render(<InfoSection resource={course} />, {
      wrapper: ThemeProvider,
    })

    const section = screen.getByTestId("drawer-info-items")
    within(section).getByText("Start Date:")
    within(section).getByText(runDate)
  })

  test("As taught in", () => {
    const course = courses.free.anytime
    const run = course.runs?.[0]
    invariant(run)
    const runDate = formatRunDate(run, true)
    invariant(runDate)
    render(<InfoSection resource={course} />, {
      wrapper: ThemeProvider,
    })

    const section = screen.getByTestId("drawer-info-items")
    within(section).getByText("As taught in:")
    within(section).getByText(runDate)
  })

  test("Multiple Runs", () => {
    const course = courses.free.multipleRuns
    const expectedDateText = course.runs
      ?.sort((a, b) => {
        if (a?.start_date && b?.start_date) {
          return Date.parse(a.start_date) - Date.parse(b.start_date)
        }
        return 0
      })
      .map((run) => formatRunDate(run, false))
      .join(" | ")
    invariant(expectedDateText)
    render(<InfoSection resource={course} />, {
      wrapper: ThemeProvider,
    })

    const section = screen.getByTestId("drawer-info-items")
    within(section).getByText((_content, node) => {
      return node?.textContent === expectedDateText || false
    })
  })
})
