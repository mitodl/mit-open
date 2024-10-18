import React from "react"
import * as NiceModal from "@ebay/nice-modal-react"
import { renderWithProviders, user, screen, expectProps } from "@/test-utils"
import type { User } from "api/hooks/user"
import { ResourceCard } from "./ResourceCard"
import { getReadableResourceType } from "ol-utilities"
import { ResourceTypeEnum } from "api"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import type { ResourceCardProps } from "./ResourceCard"
import { urls, factories, setMockResponse } from "api/test-utils"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import invariant from "tiny-invariant"
import { LearningResourceCard, LearningResourceListCard } from "ol-components"

jest.mock("ol-components", () => {
  const actual = jest.requireActual("ol-components")
  return {
    __esModule: true,
    ...actual,
    LearningResourceCard: jest.fn(actual.LearningResourceCard),
    LearningResourceListCard: jest.fn(actual.LearningResourceListCard),
  }
})

jest.mock("@ebay/nice-modal-react", () => {
  const actual = jest.requireActual("@ebay/nice-modal-react")
  const show = jest.fn()
  return {
    __esModule: true,
    ...actual,
    show,
    default: {
      ...actual.default,
      show: show,
    },
  }
})

describe.each([
  {
    BaseComponent: LearningResourceCard,
    isList: false,
  },
  {
    BaseComponent: LearningResourceListCard,
    isList: true,
  },
])("$CardComponent", ({ BaseComponent, isList }) => {
  const makeResource = factories.learningResources.resource
  type SetupOptions = {
    user?: Partial<User>
    props?: Partial<ResourceCardProps>
  }
  const setup = ({ user, props = {} }: SetupOptions = {}) => {
    const { resource = makeResource() } = props
    if (user?.is_authenticated) {
      setMockResponse.get(urls.userMe.get(), user)
    } else {
      setMockResponse.get(urls.userMe.get(), {}, { code: 403 })
    }
    const { view, location } = renderWithProviders(
      <ResourceCard {...props} resource={resource} list={isList} />,
    )
    return { resource, view, location }
  }

  test("Applies className to the resource card", () => {
    const { view } = setup({ user: {}, props: { className: "test-class" } })
    expect(view.container.firstChild).toHaveClass("test-class")
  })

  test.each([
    {
      user: { is_authenticated: true, is_learning_path_editor: false },
      expectAddToLearningPathButton: false,
    },
    {
      user: { is_authenticated: true, is_learning_path_editor: true },
      expectAddToLearningPathButton: true,
    },
    {
      user: { is_authenticated: false },
      expectAddToLearningPathButton: false,
    },
  ])(
    "Always shows 'Add to User List' button, but only shows 'Add to Learning Path' button if user is a learning path editor",
    async ({ user, expectAddToLearningPathButton }) => {
      const { resource } = setup({ user })
      await screen.findByRole("button", {
        name: `Bookmark ${getReadableResourceType(resource?.resource_type as ResourceTypeEnum)}`,
      })

      const addToLearningPathButton = screen.queryByRole("button", {
        name: "Add to Learning Path",
      })
      expect(!!addToLearningPathButton).toBe(expectAddToLearningPathButton)
    },
  )

  test.each([
    {
      userlist: { count: 1, inList: true },
      learningpath: { count: 1, inList: true },
    },
    {
      userlist: { count: 0, inList: false },
      learningpath: { count: 1, inList: true },
    },
    {
      userlist: { count: 1, inList: true },
      learningpath: { count: 0, inList: false },
    },
    {
      userlist: { count: 0, inList: false },
      learningpath: { count: 0, inList: false },
    },
  ])(
    "'Add to ...' buttons are filled based on membership in list",
    ({ userlist, learningpath }) => {
      const resource = makeResource()
      const { microLearningPathRelationship } = factories.learningResources
      const { microUserListRelationship } = factories.userLists
      resource.learning_path_parents = Array.from(
        { length: learningpath.count },
        () => microLearningPathRelationship({ child: resource.id }),
      )
      resource.user_list_parents = Array.from({ length: userlist.count }, () =>
        microUserListRelationship({ child: resource.id }),
      )

      setup({ user: { is_authenticated: true }, props: { resource } })

      expectProps(BaseComponent, {
        resource,
        inLearningPath: learningpath.inList,
        inUserList: userlist.inList,
      })
    },
  )

  test("Clicking add to list button opens AddToListDialog when authenticated", async () => {
    const showModal = jest.mocked(NiceModal.show)

    const { resource } = setup({
      user: { is_learning_path_editor: true, is_authenticated: true },
    })
    const addToUserListButton = await screen.findByRole("button", {
      name: `Bookmark ${getReadableResourceType(resource?.resource_type as ResourceTypeEnum)}`,
    })
    const addToLearningPathButton = await screen.findByRole("button", {
      name: "Add to Learning Path",
    })

    expect(showModal).not.toHaveBeenCalled()
    await user.click(addToLearningPathButton)
    invariant(resource)
    expect(showModal).toHaveBeenLastCalledWith(AddToLearningPathDialog, {
      resourceId: resource.id,
    })
    await user.click(addToUserListButton)
    expect(showModal).toHaveBeenLastCalledWith(AddToUserListDialog, {
      resourceId: resource.id,
    })
  })

  test("Clicking 'Add to User List' opens signup popover if not authenticated", async () => {
    const { resource } = setup({
      user: { is_authenticated: false },
    })
    const addToUserListButton = await screen.findByRole("button", {
      name: `Bookmark ${getReadableResourceType(resource?.resource_type as ResourceTypeEnum)}`,
    })
    await user.click(addToUserListButton)
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeVisible()
    expect(dialog).toHaveTextContent("Sign Up")
  })

  test("Clicking card opens resource drawer", async () => {
    const { resource } = setup({
      user: { is_learning_path_editor: true },
    })
    invariant(resource)
    const link = screen.getByRole("link", { name: new RegExp(resource.title) })
    const href = link.getAttribute("href")
    invariant(href)
    const url = new URL(href, window.location.href)
    expect(url.searchParams.get(RESOURCE_DRAWER_QUERY_PARAM)).toBe(
      String(resource.id),
    )
  })
})
