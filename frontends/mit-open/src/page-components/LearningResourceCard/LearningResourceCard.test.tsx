import React from "react"
import * as NiceModal from "@ebay/nice-modal-react"
import { renderWithProviders, user, screen } from "../../test-utils"
import type { User } from "../../test-utils"
import LearningResourceCard from "./LearningResourceCard"
import type { LearningResourceCardProps } from "./LearningResourceCard"
import AddToListDialog from "./AddToListDialog"
import * as factories from "api/test-utils/factories"

jest.mock("@ebay/nice-modal-react", () => {
  const actual = jest.requireActual("@ebay/nice-modal-react")
  return {
    __esModule: true,
    ...actual,
    show: jest.fn(),
  }
})

describe("LearningResourceCard", () => {
  const makeResource = factories.learningResources.resource
  type SetupOptions = {
    user?: Partial<User>
    props?: Partial<LearningResourceCardProps>
  }
  const setup = ({ user, props = {} }: SetupOptions = {}) => {
    const { resource = makeResource(), variant = "column" } = props
    const { view } = renderWithProviders(
      <LearningResourceCard {...props} resource={resource} variant={variant} />,
      { user },
    )
    return { resource, view }
  }

  const labels = {
    addToLearningPaths: "Add to Learning Path",
  }

  test("Applies className to the resource card", () => {
    const { view } = setup({ user: {}, props: { className: "test-class" } })
    expect(view.container.firstChild).toHaveClass("test-class")
  })

  test.each([
    {
      user: { is_learning_path_editor: false },
      expectButton: false,
    },
    {
      user: { is_learning_path_editor: true },
      expectButton: true,
    },
  ])(
    "Shows LearningPaths button if and only if user has editing privileges",
    async ({ user, expectButton }) => {
      setup({ user })
      const button = screen.queryByRole("button", {
        name: labels.addToLearningPaths,
      })
      expect(!!button).toBe(expectButton)
    },
  )

  test("Clicking LearningPath button opens AddToListDialog", async () => {
    const showModal = jest.mocked(NiceModal.show)

    const { resource } = setup({
      user: { is_learning_path_editor: true },
    })
    const button = screen.getByRole("button", {
      name: labels.addToLearningPaths,
    })

    expect(showModal).not.toHaveBeenCalled()
    await user.click(button)
    expect(showModal).toHaveBeenCalledWith(AddToListDialog, {
      resourceId: resource.id,
    })
  })
})
