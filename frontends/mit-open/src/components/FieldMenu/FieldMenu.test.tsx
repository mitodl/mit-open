import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"

import FieldMenu from "./FieldMenu"
import { urls } from "api/test-utils"
import { setMockResponse, user } from "../../test-utils"
import { fields as factory } from "api/test-utils/factories"
import { ThemeProvider } from "ol-components"

describe("FieldMenu", () => {
  it("Includes links to field management and widget management", async () => {
    const field = factory.field()
    setMockResponse.get(
      urls.fields.details(field.channel_type, field.name),
      field,
    )

    render(
      <BrowserRouter>
        <FieldMenu channelType={field.channel_type} name={field.name} />
      </BrowserRouter>,
      { wrapper: ThemeProvider },
    )
    const dropdown = await screen.findByRole("button")
    await user.click(dropdown)

    const item1 = screen.getByRole("menuitem", { name: "Field Settings" })
    expect((item1 as HTMLAnchorElement).href).toContain(
      `/c/${field.channel_type}/${field.name}/manage`,
    )

    const item2 = screen.getByRole("menuitem", { name: "Manage Widgets" })
    expect((item2 as HTMLAnchorElement).href).toContain(
      `/c/${field.channel_type}/${field.name}/manage/widgets`,
    )
  })
})
