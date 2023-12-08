import React from "react"
import * as NiceModal from "@ebay/nice-modal-react"
import { makeLearningResource } from "ol-search-ui/src/test-utils/factories"
import { renderWithProviders, user, screen } from "../test-utils"
import type { User } from "../test-utils"
import LearningResourceCard from "./LearningResourceCard"
import type {
  LearningResourceCardPropsOld,
  LearningResourceCardPropsNew,
} from "./LearningResourceCard"
import AddToListDialog from "../pages/learningpaths/AddToListDialog"
import * as factories from "api/test-utils/factories"

jest.mock("@ebay/nice-modal-react", () => {
  const actual = jest.requireActual("@ebay/nice-modal-react")
  return {
    __esModule: true,
    ...actual,
    show: jest.fn(),
  }
})

describe("LearningResourceCard (old interface)", () => {
  type SetupOptions = {
    userSettings?: Partial<User>
    props?: Partial<LearningResourceCardPropsOld>
  }
  const setup = ({ userSettings: user, props = {} }: SetupOptions = {}) => {
    const { resource = makeLearningResource(), variant = "column" } = props
    const { view, location } = renderWithProviders(
      <LearningResourceCard {...props} resource={resource} variant={variant} />,
      { user },
    )
    return { resource, view, location }
  }

  test("Clicking resource title routes to LearningResourceDrawer", async () => {
    const { resource, location } = setup()
    expect(location.current.search).toBe("") // Drawer is closed
    await user.click(screen.getByRole("heading", { name: resource.title }))

    const actual = new URLSearchParams(location.current.search).sort()
    const expected = new URLSearchParams(
      Object.entries({
        resource_type: resource.object_type,
        resource_id: String(resource.id),
      }),
    ).sort()
    expect(actual).toEqual(expected)
  })

  test("Applies className to the resource card", () => {
    const { view } = setup({ props: { className: "test-class" } })
    expect(view.container.firstChild).toHaveClass("test-class")
  })
})

describe("LearningResourceCard (new interface)", () => {
  const makeResource = factories.learningResources.resource
  type SetupOptions = {
    userSettings?: Partial<User>
    props?: Partial<LearningResourceCardPropsNew>
  }
  const setup = ({ userSettings: user, props = {} }: SetupOptions = {}) => {
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
    const { view } = setup({ props: { className: "test-class" } })
    expect(view.container.firstChild).toHaveClass("test-class")
  })

  test.each([
    {
      userSettings: { is_learning_path_editor: false },
      expectButton: false,
    },
    {
      userSettings: { is_learning_path_editor: true },
      expectButton: true,
    },
  ])(
    "Shows LearningPaths button if and only if user has editing privileges",
    async ({ userSettings, expectButton }) => {
      setup({ userSettings })
      const button = screen.queryByRole("button", {
        name: labels.addToLearningPaths,
      })
      expect(!!button).toBe(expectButton)
    },
  )

  test("Clicking LearningPath button opens AddToListDialog", async () => {
    const showModal = jest.mocked(NiceModal.show)

    const { resource } = setup({
      userSettings: { is_learning_path_editor: true },
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
