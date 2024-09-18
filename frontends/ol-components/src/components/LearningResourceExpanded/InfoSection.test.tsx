import React from "react"
import { render, screen } from "@testing-library/react"
import { courses } from "../LearningResourceCard/testUtils"
import InfoSection from "./InfoSection"

describe("Learning resource info section pricing", () => {
  test("Free course, no certificate", () => {
    render(<InfoSection resource={courses.free.noCertificate} />)

    screen.getByText("Free")
    expect(screen.queryByText("Paid")).toBeNull()
    expect(screen.queryByText("Earn a certificate:")).toBeNull()
    expect(screen.queryByText("Certificate included")).toBeNull()
  })

  test("Free course, with certificate, one price", () => {
    render(<InfoSection resource={courses.free.withCertificateOnePrice} />)

    screen.getByText("Free")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Earn a certificate:")
    screen.getByText("$49")
  })

  test("Free course, with certificate, price range", () => {
    render(<InfoSection resource={courses.free.withCertificatePriceRange} />)

    screen.getByText("Free")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Earn a certificate:")
    screen.getByText("$49 – $99")
  })

  test("Unknown price, no certificate", () => {
    render(<InfoSection resource={courses.unknownPrice.noCertificate} />)

    screen.getByText("Paid")
    expect(screen.queryByText("Free")).toBeNull()
    expect(screen.queryByText("Earn a certificate:")).toBeNull()
    expect(screen.queryByText("Certificate included")).toBeNull()
  })

  test("Unknown price, with certificate", () => {
    render(<InfoSection resource={courses.unknownPrice.withCertificate} />)

    screen.getByText("Paid")
    expect(screen.queryByText("Free")).toBeNull()
    screen.getByText("Certificate included")
  })

  test("Paid course, no certificate", () => {
    render(<InfoSection resource={courses.paid.withoutCertificate} />)

    screen.getByText("$49")
    expect(screen.queryByText("Paid")).toBeNull()
    expect(screen.queryByText("Free")).toBeNull()
    expect(screen.queryByText("Earn a certificate:")).toBeNull()
    expect(screen.queryByText("Certificate included")).toBeNull()
  })

  test("Paid course, with certificate, one price", () => {
    render(<InfoSection resource={courses.paid.withCerticateOnePrice} />)

    screen.getByText("$49")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Certificate included")
  })

  test("Paid course, with certificate, price range", () => {
    render(<InfoSection resource={courses.paid.withCertificatePriceRange} />)

    screen.getByText("$49 – $99")
    expect(screen.queryByText("Paid")).toBeNull()
    screen.getByText("Certificate included")
  })
})
