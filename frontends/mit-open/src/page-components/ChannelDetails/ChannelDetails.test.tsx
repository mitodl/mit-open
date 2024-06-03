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
      channel_type: "offeror",
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
    const fieldData = field as Record<string, string[] | string>
    screen.getByText(fieldData?.offeror_detail.offeror.offerings.join(" | "))
    screen.getByText(fieldData?.offeror_detail.offeror.audience.join(" | "))
    screen.getByText(fieldData?.offeror_detail.offeror.formats.join(" | "))
    screen.getByText(
      fieldData?.offeror_detail.offeror.certifications.join(" | "),
    )
    screen.getByText(
      fieldData?.offeror_detail.offeror.content_types.join(" | "),
    )
  })
})
