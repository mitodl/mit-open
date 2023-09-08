import React from "react"
import { render, screen } from "@testing-library/react"
import { assertInstanceOf } from "ol-util"
import LearningResourceCardTemplate from "./LearningResourceCardTemplate"
import { makeImgConfig } from "../test-utils/factories"
import { resourceThumbnailSrc } from "../utils"
import { allowConsoleErrors } from "ol-util/test-utils"
import user from "@testing-library/user-event"
import * as factories from "api/test-utils/factories"
import { ResourceTypeEnum } from "api"

const makeResource = factories.learningResources.resource

describe("LearningResourceCard", () => {
  it("renders title and cover image", () => {
    const resource = makeResource({ resource_type: ResourceTypeEnum.Course })
    const imgConfig = makeImgConfig()
    render(
      <LearningResourceCardTemplate
        variant="column"
        resource={resource}
        imgConfig={imgConfig}
      />,
    )
    const heading = screen.getByRole("heading", { name: resource.title })

    const coverImg = screen.getByRole("img", { name: "" })
    assertInstanceOf(coverImg, HTMLImageElement)
    expect(heading).toHaveAccessibleName(resource.title)
    expect(coverImg.alt).toBe("") // Alert! This should be empty unless it is meaningful.
    expect(coverImg.src).toBe(resourceThumbnailSrc(resource, imgConfig))
  })

  it("does not show an image iff suppressImage is true", () => {
    const resource = makeResource({
      resource_type: ResourceTypeEnum.Course,
    })
    const imgConfig = makeImgConfig()
    const { rerender } = render(
      <LearningResourceCardTemplate
        variant="column"
        resource={resource}
        imgConfig={imgConfig}
      />,
    )
    const images = screen.queryAllByRole("img")
    rerender(
      <LearningResourceCardTemplate
        variant="column"
        resource={resource}
        imgConfig={imgConfig}
        suppressImage={true}
      />,
    )
    expect(screen.queryAllByRole("img").length).toBe(images.length - 1)
  })

  it("Calls onActivate when clicking title", async () => {
    const resource = makeResource({
      resource_type: ResourceTypeEnum.Course,
    })
    const imgConfig = makeImgConfig()
    const onActivate = jest.fn()
    render(
      <LearningResourceCardTemplate
        variant="column"
        resource={resource}
        imgConfig={imgConfig}
        onActivate={onActivate}
      />,
    )

    const heading = screen.getByRole("button", { name: resource.title })
    await user.click(heading)
    expect(onActivate).toHaveBeenCalledWith(resource)
  })

  it.each([
    { certification: null, hasCertificate: false },
    { certification: undefined, hasCertificate: false },
    { certification: "cert", hasCertificate: true },
  ])(
    "should render an icon if the object has a certificate",
    ({ certification, hasCertificate }) => {
      const resource = makeResource({
        certification,
        resource_type: ResourceTypeEnum.Course,
      })
      const imgConfig = makeImgConfig()

      render(
        <LearningResourceCardTemplate
          variant="column"
          resource={resource}
          imgConfig={imgConfig}
        />,
      )
      const certIcon = screen.queryByAltText("Receive a certificate", {
        exact: false,
      })
      expect(certIcon === null).not.toBe(hasCertificate)
    },
  )

  it.each([
    { sortable: true, shows: "Shows" },
    { sortable: false, shows: "Does not show" },
  ])("$shows a drag handle when sortable is $sortable", ({ sortable }) => {
    const resource = makeResource()
    const imgConfig = makeImgConfig()
    render(
      <LearningResourceCardTemplate
        variant="row-reverse"
        resource={resource}
        imgConfig={imgConfig}
        sortable={sortable}
      />,
    )

    expect(!!screen.queryByTestId("DragIndicatorIcon")).toBe(sortable)
  })

  it.each([{ variant: "row" }, { variant: "column" }] as const)(
    "Throws error if sortable & unsupported variant",
    ({ variant }) => {
      const resource = makeResource()
      const imgConfig = makeImgConfig()
      const shouldThrow = () => {
        render(
          <LearningResourceCardTemplate
            variant={variant}
            resource={resource}
            imgConfig={imgConfig}
            sortable={true}
          />,
        )
      }
      allowConsoleErrors()
      expect(shouldThrow).toThrow(/only supported for variant='row-reverse'/)
    },
  )
})
