import React from "react"
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { ButtonLink, ActionButtonLink } from "./Button"

// Mock react-router-dom's Link so we don't need to set up a Router
jest.mock("react-router-dom", () => {
  return {
    Link: jest.fn((props) => <a href={props.to}>{props.children}</a>),
  }
})

describe("ButtonLink", () => {
  test("renders a link", () => {
    render(<ButtonLink href="/test">Link text here</ButtonLink>, {
      wrapper: ThemeProvider,
    })
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/test")
  })
})

describe("ActionButtonLink", () => {
  test("renders a link", () => {
    render(<ActionButtonLink href="/test">Link text here</ActionButtonLink>, {
      wrapper: ThemeProvider,
    })
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/test")
  })
})
