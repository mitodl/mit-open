import React from "react"
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { ButtonLink, ActionButtonLink } from "./Button"
import Link  from "next/link"

// Mock react-router-dom's Link so we don't need to set up a Router
jest.mock("react-router-dom", () => {
  return {
    Link: jest.fn((props) => <a href={props.to}>{props.children}</a>),
  }
})

describe("ButtonLink", () => {
  test.each([
    {
      reloadDocument: undefined,
      label: "Link",
    },
    {
      reloadDocument: false,
      label: "Link",
    },
    {
      reloadDocument: true,
      label: "Anchor",
    },
  ])(
    "renders with reloadDocument if reloadDocument=$reloadDocument",
    ({ reloadDocument }) => {
      render(
        <ButtonLink href="/test" reloadDocument={reloadDocument}>
          Link text here
        </ButtonLink>,
        { wrapper: ThemeProvider },
      )
      screen.getByRole("link")
      expect(Link).toHaveBeenCalledWith(
        expect.objectContaining({ reloadDocument }),
        expect.anything(),
      )
    },
  )
})

describe("ActionButtonLink", () => {
  test.each([
    {
      reloadDocument: undefined,
      label: "Link",
    },
    {
      reloadDocument: false,
      label: "Link",
    },
    {
      reloadDocument: true,
      label: "Anchor",
    },
  ])(
    "renders with reloadDocument if reloadDocument=$reloadDocument",
    ({ reloadDocument }) => {
      render(
        <ActionButtonLink href="/test" reloadDocument={reloadDocument}>
          Link text here
        </ActionButtonLink>,
        { wrapper: ThemeProvider },
      )
      screen.getByRole("link")
      expect(Link).toHaveBeenCalledWith(
        expect.objectContaining({ reloadDocument }),
        expect.anything(),
      )
    },
  )
})
