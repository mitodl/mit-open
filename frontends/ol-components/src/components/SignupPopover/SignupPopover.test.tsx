import React from "react"
import { SignupPopover } from "./SignupPopover"
import invariant from "tiny-invariant"
import { mockRouter } from "ol-test-utilities/mocks/nextNavigation"
import { render, screen, within } from "@testing-library/react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

test("SignupPopover shows link to sign up", async () => {
  mockRouter.setCurrentUrl("/some-path?dog=woof")
  const signupUrl = "login"

  render(
    <SignupPopover
      signupUrl={signupUrl}
      anchorEl={document.body}
      onClose={jest.fn}
    />,
    {
      wrapper: ThemeProvider,
    },
  )
  const dialog = screen.getByRole("dialog")
  const link = within(dialog).getByRole("link")
  invariant(link instanceof HTMLAnchorElement)
  expect(link.href).toMatch(signupUrl)
})
