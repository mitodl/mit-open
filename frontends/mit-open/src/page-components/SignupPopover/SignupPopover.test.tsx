import React from "react"
import { SignupPopover } from "./SignupPopover"
import { renderWithProviders, screen, within } from "@/test-utils"
import invariant from "tiny-invariant"
import * as urls from "@/common/urls"

test("SignupPopover shows link to sign up", async () => {
  renderWithProviders(
    <SignupPopover anchorEl={document.body} onClose={jest.fn} />,
  )
  const dialog = screen.getByRole("dialog")
  const link = within(dialog).getByRole("link")
  invariant(link instanceof HTMLAnchorElement)
  expect(link.href).toMatch(urls.login())
})
