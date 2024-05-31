import React from "react"
import { render, screen } from "@testing-library/react"
import { CardTemplate } from "./CardTemplate"
import { DEFAULT_RESOURCE_IMG } from "ol-utilities"
import { makeImgConfig } from "ol-utilities/test-utils/factories"

describe("CardTemplate", () => {
  it("renders title and cover image", () => {
    const title = "Test Title"
    render(
      <CardTemplate
        variant="column"
        imgUrl={DEFAULT_RESOURCE_IMG}
        imgConfig={makeImgConfig()}
        title={title}
      />,
    )
    const heading = screen.getByRole("heading", { name: title })
    expect(heading).toHaveAccessibleName(title)
  })
})
