import React from "react"
import { FollowPopover } from "./FollowPopover"
import { renderWithProviders, screen, within } from "@/test-utils"
import invariant from "tiny-invariant"
import * as urls from "@/common/urls"

test("FollowPopover shows link to sign up", async () => {
  renderWithProviders(
    <FollowPopover anchorEl={document.body} onClose={jest.fn} />,
    {
      url: "/some-path?dog=woof",
    },
  )
  const dialog = screen.getByRole("dialog")
  const link = within(dialog).getByRole("link")
  invariant(link instanceof HTMLAnchorElement)
  expect(link.href).toMatch(
    urls.login({
      pathname: "/some-path",
      search: "?dog=woof",
    }),
  )
})
