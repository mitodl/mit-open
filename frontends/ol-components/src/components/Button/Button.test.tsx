import React from "react"
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { ButtonLink, ActionButtonLink } from "./Button"
import Link from "next/link"

jest.mock("next/link", () => {
  const Actual = jest.requireActual("next/link")
  return {
    __esModule: true,
    default: jest.fn((args) => <Actual.default {...args} />),
  }
})

describe("ButtonLink", () => {
  test.each([
    {
      rawAnchor: undefined,
      label: "Link",
    },
    {
      rawAnchor: false,
      label: "Link",
    },
    {
      rawAnchor: true,
      label: "Anchor",
    },
  ])("renders with anchor tag if rawAnchor=$rawAnchor", ({ rawAnchor }) => {
    render(
      <ButtonLink href="/test" rawAnchor={rawAnchor}>
        Link text here
      </ButtonLink>,
      { wrapper: ThemeProvider },
    )
    screen.getByRole("link")
    if (rawAnchor) {
      expect(Link).not.toHaveBeenCalled()
    } else {
      expect(Link).toHaveBeenCalled()
    }
  })
})

describe("ActionButtonLink", () => {
  test.each([
    {
      rawAnchor: undefined,
      label: "Link",
    },
    {
      rawAnchor: false,
      label: "Link",
    },
    {
      rawAnchor: true,
      label: "Anchor",
    },
  ])("renders with rawAnchor if rawAnchor=$rawAnchor", ({ rawAnchor }) => {
    render(
      <ActionButtonLink href="/test" rawAnchor={rawAnchor}>
        Link text here
      </ActionButtonLink>,
      { wrapper: ThemeProvider },
    )
    screen.getByRole("link")
    if (rawAnchor) {
      expect(Link).not.toHaveBeenCalled()
    } else {
      expect(Link).toHaveBeenCalled()
    }
  })
})
