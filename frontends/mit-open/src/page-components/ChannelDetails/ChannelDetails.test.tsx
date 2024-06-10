import React from "react"
import { render, screen } from "@testing-library/react"
import { ChannelDetails } from "./ChannelDetails"
import { BrowserRouter } from "react-router-dom"
import { urls } from "api/test-utils"
import { setMockResponse } from "../../test-utils"
import { fields as factory } from "api/test-utils/factories"
import { ThemeProvider } from "ol-components"

describe("ChannelDetails", () => {
  it("Includes channel detail info panel", async () => {
    const field = factory.field({
      title: "Test Title",
      channel_type: "unit",
    })
    setMockResponse.get(
      urls.fields.details(field.channel_type, field.name),
      field,
    )
    render(
      <BrowserRouter>
        <ChannelDetails field={field} />
      </BrowserRouter>,
      { wrapper: ThemeProvider },
    )
    const fieldData = field as unknown as Record<string, unknown>
    const offerorDetail = fieldData.unit_detail as unknown as Record<
      string,
      unknown
    >
    const offeror = offerorDetail.offeror as unknown as Record<string, unknown>
    const offerings = offeror.offerings as string[]
    const audience = offeror.audience as string[]
    const formats = offeror.formats as string[]
    const contentTypes = offeror.content_types as string[]
    const certifications = offeror.certifications as string[]
    screen.getByText(offerings.join(" | "))
    screen.getByText(audience.join(" | "))
    screen.getByText(formats.join(" | "))
    screen.getByText(certifications.join(" | "))
    screen.getByText(contentTypes.join(" | "))
  })
})
