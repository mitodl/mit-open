import { faker } from "@faker-js/faker/locale/en"
import * as NiceModal from "@ebay/nice-modal-react"
import { AddToLearningPathDialog, AddToUserListDialog } from "./AddToListDialog"

import { setMockResponse, makeRequest, factories, urls } from "api/test-utils"

import {
  renderWithProviders,
  screen,
  user,
  within,
  act,
} from "../../test-utils"
import { manageListDialogs } from "../ManageListDialogs/ManageListDialogs"
import { waitForElementToBeRemoved } from "@testing-library/react"
import {
  LearningPathRelationship,
  LearningPathResource,
  LearningResource,
  UserList,
  UserListRelationship,
} from "api"
import invariant from "tiny-invariant"
import { ListType } from "api/constants"

const learningResourcesFactory = factories.learningResources
const userListsFactory = factories.userLists

jest.mock("@ebay/nice-modal-react", () => {
  const actual = jest.requireActual("@ebay/nice-modal-react")
  return {
    ...actual,
    show: jest.fn(actual.show),
  }
})

type SetupOptions = {
  inLists: number[]
  dialogOpen: boolean
}
const setupLearningPaths = ({
  inLists = [],
  dialogOpen = true,
}: Partial<SetupOptions> = {}) => {
  const resource = learningResourcesFactory.resource({
    learning_path_parents: [],
  })
  const paginatedLearningPaths = learningResourcesFactory.learningPaths({
    count: 3,
  })
  const learningPaths = paginatedLearningPaths.results
  const learningPathParents = resource.learning_path_parents!
  inLists.forEach((index) => {
    const learningPath = learningPaths[index]
    learningPathParents.push(
      learningResourcesFactory.microLearningPathRelationship({
        parent: learningPath.id,
        child: resource.id,
      }),
    )
    learningPath.learning_path.item_count += 1
  })
  setMockResponse.get(
    urls.learningResources.details({ id: resource.id }),
    resource,
  )
  setMockResponse.get(urls.learningPaths.list(), paginatedLearningPaths)
  const view = renderWithProviders(null)
  if (dialogOpen) {
    act(() => {
      NiceModal.show(AddToLearningPathDialog, { resourceId: resource.id })
    })
  }
  return {
    view,
    resource,
    lists: learningPaths,
    parents: learningPathParents,
  }
}

const setupUserLists = ({
  inLists = [],
  dialogOpen = true,
}: Partial<SetupOptions> = {}) => {
  const resource = learningResourcesFactory.resource({ user_list_parents: [] })
  const paginatedUserLists = userListsFactory.userLists({ count: 3 })
  const userLists = paginatedUserLists.results
  const userListParents = resource.user_list_parents!
  inLists.forEach((index) => {
    const userList = userLists[index]
    userListParents.push(
      userListsFactory.microUserListRelationship({
        parent: userList.id,
        child: resource.id,
      }),
    )
  })
  setMockResponse.get(
    urls.learningResources.details({ id: resource.id }),
    resource,
  )
  setMockResponse.get(urls.userLists.list(), paginatedUserLists)
  const view = renderWithProviders(null)
  if (dialogOpen) {
    act(() => {
      NiceModal.show(AddToUserListDialog, { resourceId: resource.id })
    })
  }
  return {
    view,
    resource,
    lists: userLists,
    parents: userListParents,
  }
}

const addToLearningPath = (
  resource: LearningResource,
  list: LearningPathResource,
): LearningPathRelationship => {
  const member = learningResourcesFactory.microLearningPathRelationship({
    parent: list.id,
    child: resource.id,
  })
  const modified = {
    ...resource,
    learning_path_parents: [...(resource.learning_path_parents ?? []), member],
  }
  return learningResourcesFactory.learningPathRelationship({
    ...member,
    resource: modified,
  })
}

const addToUserList = (
  resource: LearningResource,
  list: UserList,
): UserListRelationship => {
  const member = userListsFactory.microUserListRelationship({
    parent: list.id,
    child: resource.id,
  })
  const modified = {
    ...resource,
    user_list_parents: [...(resource.user_list_parents ?? []), member],
  }
  return userListsFactory.userListRelationship({
    ...member,
    resource: modified,
  })
}

describe.each([ListType.LearningPath, ListType.UserList])(
  "AddToListDialog",
  (listType: string) => {
    test("List is checked iff resource is in list", async () => {
      const index = faker.number.int({ min: 0, max: 2 })
      if (listType === ListType.LearningPath) {
        setupLearningPaths({ inLists: [index] })
      } else if (listType === ListType.UserList) {
        setupUserLists({ inLists: [index] })
      }

      const checkboxes =
        await screen.findAllByRole<HTMLInputElement>("checkbox")
      expect(checkboxes[0].checked).toBe(index === 0)
      expect(checkboxes[1].checked).toBe(index === 1)
      expect(checkboxes[2].checked).toBe(index === 2)
    })

    test("Clicking an unchecked list adds item to that list", async () => {
      let title = ""
      let id = -1
      let addToListUrl = ""
      if (listType === ListType.LearningPath) {
        const { resource, lists } = setupLearningPaths()
        const list = faker.helpers.arrayElement(lists)

        addToListUrl = urls.learningPaths.resources({
          learning_resource_id: list.id,
        })
        const newRelationship = addToLearningPath(resource, list)
        setMockResponse.post(addToListUrl, newRelationship)
        setMockResponse.get(
          urls.learningResources.details({ id: resource.id }),
          resource,
        )
        title = list.title
        id = list.id
      } else if (listType === ListType.UserList) {
        const { resource, lists } = setupUserLists()
        const list = faker.helpers.arrayElement(lists)

        addToListUrl = urls.userLists.resources({
          userlist_id: list.id,
        })
        const newRelationship = addToUserList(resource, list)
        setMockResponse.post(addToListUrl, newRelationship)
        setMockResponse.get(
          urls.learningResources.details({ id: resource.id }),
          resource,
        )
        title = list.title
        id = list.id
      }

      const listButton = await screen.findByRole("button", { name: title })
      const checkbox =
        within(listButton).getByRole<HTMLInputElement>("checkbox")

      expect(checkbox.checked).toBe(false)
      await user.click(listButton)

      expect(makeRequest).toHaveBeenCalledWith(
        "post",
        addToListUrl,
        expect.objectContaining({
          parent: id,
        }),
      )
    })

    test("Clicking a checked list removes item from that list", async () => {
      const index = faker.number.int({ min: 0, max: 2 })
      let title = ""
      let removalUrl = ""
      if (listType === ListType.LearningPath) {
        const { resource, lists, parents } = setupLearningPaths({
          inLists: [index],
        })
        const list = lists[index]
        const relationship = parents.find(({ parent }) => parent === list.id)
        invariant(relationship)

        title = list.title
        removalUrl = urls.learningPaths.resourceDetails({
          id: relationship.id,
          learning_resource_id: relationship.parent,
        })
        setMockResponse.delete(removalUrl)
        setMockResponse.get(
          urls.learningResources.details({ id: resource.id }),
          resource,
        )
      } else if (listType === ListType.UserList) {
        const { resource, lists, parents } = setupUserLists({
          inLists: [index],
        })
        const list = lists[index]
        const relationship = parents.find(({ parent }) => parent === list.id)
        invariant(relationship)

        title = list.title
        removalUrl = urls.userLists.resourceDetails({
          id: relationship.id,
          userlist_id: relationship.parent,
        })
        setMockResponse.delete(removalUrl)
        setMockResponse.get(
          urls.userLists.details({ id: resource.id }),
          resource,
        )
      }

      const listButton = await screen.findByRole("button", { name: title })
      const checkbox =
        within(listButton).getByRole<HTMLInputElement>("checkbox")

      expect(checkbox.checked).toBe(true)
      await user.click(listButton)

      expect(makeRequest).toHaveBeenCalledWith("delete", removalUrl, undefined)
    })

    test("Clicking 'Create a new list' opens the create list dialog", async () => {
      let createList = null
      if (listType === ListType.LearningPath) {
        // Don't actually open the 'Create List' modal, or we'll need to mock API responses.
        createList = jest
          .spyOn(manageListDialogs, "upsertLearningPath")
          .mockImplementationOnce(jest.fn())
        setupLearningPaths()
      } else if (listType === ListType.UserList) {
        // Don't actually open the 'Create List' modal, or we'll need to mock API responses.
        createList = jest
          .spyOn(manageListDialogs, "upsertUserList")
          .mockImplementationOnce(jest.fn())
        setupUserLists()
      }
      const button = await screen.findByRole("button", {
        name: "Create a new list",
      })
      expect(createList).not.toHaveBeenCalled()
      await user.click(button)
      expect(createList).toHaveBeenCalledWith()
    })

    test("Opens and closes via NiceModal", async () => {
      let title = ""
      if (listType === ListType.LearningPath) {
        const { resource: resource1 } = setupLearningPaths()
        title = resource1.title
      } else if (listType === ListType.UserList) {
        const { resource: resource1 } = setupUserLists()
        title = resource1.title
      }

      const dialog1 = await screen.findByRole("dialog")
      await within(dialog1).findByText(title, { exact: false })

      // Close the dialog
      act(() => {
        if (listType === ListType.LearningPath) {
          NiceModal.hide(AddToLearningPathDialog)
        } else if (listType === ListType.UserList) {
          NiceModal.hide(AddToUserListDialog)
        }
      })
      await waitForElementToBeRemoved(dialog1)

      // Open it with a new resource
      const resource2 = learningResourcesFactory.resource()
      setMockResponse.get(
        urls.learningResources.details({ id: resource2.id }),
        resource2,
      )
      act(() => {
        if (listType === ListType.LearningPath) {
          NiceModal.show(AddToLearningPathDialog, { resourceId: resource2.id })
        } else if (listType === ListType.UserList) {
          NiceModal.show(AddToUserListDialog, { resourceId: resource2.id })
        }
      })
      const dialog2 = await screen.findByRole("dialog")
      await within(dialog2).findByText(resource2.title, { exact: false })
    })
  },
)
