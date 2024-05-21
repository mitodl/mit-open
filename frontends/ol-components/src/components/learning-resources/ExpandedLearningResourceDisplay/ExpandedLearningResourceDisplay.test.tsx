import React from "react"
import { render, screen } from "@testing-library/react"
import { ExpandedLearningResourceDisplay } from "./ExpandedLearningResourceDisplay"
import type { ExpandedLearningResourceDisplayProps } from "./ExpandedLearningResourceDisplay"
import { ResourceTypeEnum } from "api"
import { factories } from "api/test-utils"
import { ThemeProvider } from "../../ThemeProvider/ThemeProvider"
import { getReadableResourceType } from "ol-utilities"
import invariant from "tiny-invariant"

type DisplayProps = ExpandedLearningResourceDisplayProps
const IMG_CONFIG: DisplayProps["imgConfig"] = {
  key: "fake-key",
  width: 385,
  height: 200,
}

const setup = (props: Omit<DisplayProps, "imgConfig">) => {
  return render(
    <ThemeProvider>
      <ExpandedLearningResourceDisplay imgConfig={IMG_CONFIG} {...props} />
    </ThemeProvider>,
  )
}

describe("ExpandedLearningResourceDisplay", () => {
  it.each(Object.values(ResourceTypeEnum))(
    "Renders title and resource type",
    (resourceType) => {
      const resource = factories.learningResources.resource({
        resource_type: resourceType,
      })

      setup({ resource })
      screen.getByText(getReadableResourceType(resource.resource_type))
      screen.getByRole("heading", { name: resource.title })
    },
  )

  it.each(
    Object.values(ResourceTypeEnum).filter(
      (type) => type !== ResourceTypeEnum.Video,
    ),
  )("Displays an image for type=$resourceType", (resourceType) => {
    const resource = factories.learningResources.resource({
      resource_type: resourceType,
    })
    setup({ resource })
    const images = screen.getAllByRole("img")
    const image = images.find((img) =>
      img
        .getAttribute("src")
        ?.includes(encodeURIComponent(resource.image?.url ?? "")),
    )
    expect(image).toBeInTheDocument()
    invariant(image)
    expect(image).toHaveAttribute("alt", resource.image?.alt ?? "")
  })

  it("Renders a video for videos", () => {
    const video = factories.learningResources.resource({
      resource_type: ResourceTypeEnum.Video,
    })

    setup({ resource: video })
    // eslint-disable-next-line testing-library/no-node-access
    const embedlyCard = document.querySelector(".embedly-card")
    invariant(embedlyCard)
    expect(embedlyCard).toHaveAttribute("href", video.url)
  })
})
