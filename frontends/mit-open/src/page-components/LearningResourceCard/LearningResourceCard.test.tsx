import React from "react"
import * as NiceModal from "@ebay/nice-modal-react"
import { renderWithProviders, user, screen, waitFor } from "../../test-utils"
import type { User } from "../../test-utils"
import LearningResourceCard from "./LearningResourceCard"
import type { LearningResourceCardProps } from "./LearningResourceCard"
import { AddToLearningPathDialog, AddToUserListDialog } from "./AddToListDialog"
import * as factories from "api/test-utils/factories"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"

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

    const { view, location, waitForUser } = renderWithProviders(
      <LearningResourceCard {...props} resource={resource} variant={variant} />,
      { user },
    )
    return { resource, view, location, waitForUser }
  }

  const labels = {
    addToLearningPaths: "Add to Learning Path",
    addToUserList: "Add to User List",
  }

  test("Applies className to the resource card", async () => {
    const { view } = setup({ user: {}, props: { className: "test-class" } })

    await waitFor(() =>
      expect(view.container.firstChild).toHaveClass("test-class"),
    )
  })

  test.each([
    {
      user: { is_authenticated: true, is_learning_path_editor: false },
      expectAddToLearningPathButton: false,
      expectAddToUserListButton: true,
    },
    {
      user: { is_authenticated: true, is_learning_path_editor: true },
      expectAddToLearningPathButton: true,
      expectAddToUserListButton: true,
    },
    {
      user: { is_authenticated: false },
      expectAddToLearningPathButton: false,
      expectAddToUserListButton: false,
    },
  ])(
    "Shows add to list buttons if and only if user is authenticated and has editing privileges",
    async ({
      user,
      expectAddToLearningPathButton,
      expectAddToUserListButton,
    }) => {
      const { waitForUser } = setup({ user })
      await waitForUser!()

      if (expectAddToLearningPathButton) {
        await screen.findByRole("button", {
          name: labels.addToLearningPaths,
        })
      } else {
        expect(
          screen.queryByRole("button", {
            name: labels.addToLearningPaths,
          }),
        ).not.toBeInTheDocument()
      }
      if (expectAddToUserListButton) {
        await screen.findByRole("button", {
          name: labels.addToUserList,
        })
      } else {
        await waitFor(() => {
          expect(
            screen.queryByRole("button", {
              name: labels.addToUserList,
            }),
          ).not.toBeInTheDocument()
        })
      }
    },
  )

  test("Clicking add to list button opens AddToListDialog", async () => {
    const showModal = jest.mocked(NiceModal.show)

    const { resource, waitForUser } = setup({
      user: { is_learning_path_editor: true },
    })

    await waitForUser!()

    const addToLearningPathButton = screen.getByRole("button", {
      name: labels.addToLearningPaths,
    })
    const addToUserListButton = screen.getByRole("button", {
      name: labels.addToUserList,
    })

    expect(showModal).not.toHaveBeenCalled()
    await user.click(addToLearningPathButton)
    expect(showModal).toHaveBeenLastCalledWith(AddToLearningPathDialog, {
      resourceId: resource.id,
    })
    await user.click(addToUserListButton)
    expect(showModal).toHaveBeenLastCalledWith(AddToUserListDialog, {
      resourceId: resource.id,
    })
  })

  test("Clicking card title opens resource drawer", async () => {
    const { resource, location, waitForUser } = setup({
      user: { is_learning_path_editor: true },
    })

    await waitForUser!()

    const cardTitle = screen.getByRole("heading", { name: resource.title })
    await user.click(cardTitle)
    expect(
      new URLSearchParams(location.current.search).get(
        RESOURCE_DRAWER_QUERY_PARAM,
      ),
    ).toBe(String(resource.id))
  })
})
