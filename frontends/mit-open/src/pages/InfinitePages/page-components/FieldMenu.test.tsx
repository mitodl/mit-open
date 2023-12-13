import React from "react"
import { screen, waitFor } from "@testing-library/react"
import { urls } from "services/api/fields"
import * as factories from "services/api/fields/test-utils/factories"
import { setMockResponse, renderWithProviders, user } from "../../../test-utils"
import FieldMenu from "./FieldMenu"
import { assertInstanceOf } from "ol-util"

describe("FieldMenu", () => {
  it("Includes links to field management and widget management", async () => {
    const field = factories.makeField()
    setMockResponse.get(urls.fieldDetails(field.name), field)
    renderWithProviders(<FieldMenu field={field} />)
    const dropdown = await screen.findByRole("button", { name: "Settings" })
    await user.click(dropdown)
    const links = await waitFor(async () => {
      const found = await screen.findAllByRole("link")
      expect(found.length).toBe(2)
      found.every((link) => assertInstanceOf(link, HTMLAnchorElement))
      return found as HTMLAnchorElement[]
    })

    expect(new URL(links[0].href)).toEqual(
      expect.objectContaining({
        pathname: `/infinite/fields/${field.name}/manage`,
      }),
    )
    expect(new URL(links[1].href)).toEqual(
      expect.objectContaining({
        pathname: `/infinite/fields/${field.name}/manage/widgets`,
      }),
    )
  })
})
