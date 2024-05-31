import React from "react"
import { render, screen } from "@testing-library/react"
import { assertInstanceOf, resourceThumbnailSrc } from "ol-utilities"
import { LearningResourceCardTemplate } from "./LearningResourceCardTemplate"
import { makeImgConfig } from "ol-utilities/test-utils/factories"
import { allowConsoleErrors } from "ol-test-utilities"
import user from "@testing-library/user-event"
import * as factories from "api/test-utils/factories"
import { ResourceTypeEnum } from "api"

const factory = factories.learningResources

describe("LearningResourceCard", () => {
  it("renders title and cover image", () => {
    const resource = factory.course()
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
    expect(coverImg.src).toBe(resourceThumbnailSrc(resource.image, imgConfig))
  })

  it("does not show an image if and only if suppressImage is true", () => {
    const resource = factory.course()
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
    const resource = factory.course()
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

  it.each([{ certification: false }, { certification: true }])(
    "should render an icon if the object has a certificate",
    ({ certification }) => {
      const resource = factory.course({
        certification,
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
      expect(certIcon === null).not.toBe(certification)
    },
  )

  it("Should show an item count if the resource is a list", () => {
    const resource = factory.learningPath()
    const count = resource.learning_path?.item_count
    const imgConfig = makeImgConfig()

    render(
      <LearningResourceCardTemplate
        variant="column"
        resource={resource}
        imgConfig={imgConfig}
      />,
    )
    const itemText = count === 1 ? "1 item" : `${count} items`
    const itemCount = screen.getByText(itemText)
    expect(itemCount).toBeVisible()
  })

  it("Should NOT show an item count if the resource is NOT a list", () => {
    const resource = factory.resource({
      title: "Not a list",
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
    const itemCount = screen.queryByText("item", { exact: false })
    expect(itemCount).toBe(null)
  })

  it.each([
    { sortable: true, shows: "Shows" },
    { sortable: false, shows: "Does not show" },
  ])("$shows a drag handle when sortable is $sortable", ({ sortable }) => {
    const resource = factory.resource()
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
      const resource = factory.resource()
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
