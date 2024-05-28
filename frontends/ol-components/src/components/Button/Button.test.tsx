import React from "react"
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { ButtonLink, ActionButtonLink } from "./Button"
import type { LinkProps } from "react-router-dom"

// Mock react-router-dom's Link so we don't need to set up a Router
jest.mock("react-router-dom", () => {
  return {
    Link: React.forwardRef<HTMLAnchorElement, LinkProps>(
      jest.fn((props, ref) => {
        if (typeof props.to !== "string") {
          throw new Error("Expected to prop to be a string")
        }
        return (
          <a
            {...props}
            ref={ref}
            href={props.to} // otherwise the anchor won't have role link
            data-prop-to={props.to}
            data-react-component="react-router-dom-link"
          />
        )
      }),
    ),
  }
})

describe("ButtonLink", () => {
  test.each([
    {
      nativeAnchor: undefined,
      reactRouter: true,
      label: "Link",
    },
    {
      nativeAnchor: false,
      reactRouter: true,
      label: "Link",
    },
    {
      nativeAnchor: true,
      reactRouter: false,
      label: "Anchor",
    },
  ])(
    "renders a $label when nativeAnchor is $nativeAnchor",
    ({ nativeAnchor, reactRouter }) => {
      render(
        <ButtonLink href="/test" nativeAnchor={nativeAnchor}>
          Link text here
        </ButtonLink>,
        { wrapper: ThemeProvider },
      )
      const link = screen.getByRole("link")
      expect(link.dataset["reactComponent"] === "react-router-dom-link").toBe(
        reactRouter,
      )
    },
  )
})

describe("ActionButtonLink", () => {
  test.each([
    {
      nativeAnchor: undefined,
      reactRouter: true,
      label: "Link",
    },
    {
      nativeAnchor: false,
      reactRouter: true,
      label: "Link",
    },
    {
      nativeAnchor: true,
      reactRouter: false,
      label: "Anchor",
    },
  ])(
    "renders a $label when nativeAnchor is $nativeAnchor",
    ({ nativeAnchor, reactRouter }) => {
      render(
        <ActionButtonLink href="/test" nativeAnchor={nativeAnchor}>
          Link text here
        </ActionButtonLink>,
        { wrapper: ThemeProvider },
      )
      const link = screen.getByRole("link")
      expect(link.dataset["reactComponent"] === "react-router-dom-link").toBe(
        reactRouter,
      )
    },
  )
})
