import React from "react"
import { SignupPopover } from "./SignupPopover"
import invariant from "tiny-invariant"
import { render, screen, within } from "@testing-library/react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { BrowserRouter } from "react-router-dom"

test("SignupPopover shows link to sign up", async () => {
  const signupUrl = "https://example.com/signup"
  render(
    <BrowserRouter>
      <ThemeProvider>
        <SignupPopover
          signupUrl={signupUrl}
          anchorEl={document.body}
          onClose={jest.fn}
        />
        ,
      </ThemeProvider>
    </BrowserRouter>,
  )
  const dialog = screen.getByRole("dialog")
  const link = within(dialog).getByRole("link")
  invariant(link instanceof HTMLAnchorElement)
  expect(link.href).toMatch(signupUrl)
})
