import { faker } from "@faker-js/faker/locale/en"
import * as NiceModal from "@ebay/nice-modal-react"
import AddToListDialog from "./AddToListDialog"

import { setMockResponse, makeRequest, factories, urls } from "api/test-utils"

import {
  renderWithProviders,
  screen,
  user,
  within,
  act,
} from "../../test-utils"
import { manageListDialogs } from "./ManageListDialogs"
import { waitForElementToBeRemoved } from "@testing-library/react"
import {
  LearningPathRelationship,
  LearningPathResource,
  LearningResource,
} from "api"
import invariant from "tiny-invariant"

const factory = factories.learningResources

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
const setup = ({
  inLists = [],
  dialogOpen = true,
}: Partial<SetupOptions> = {}) => {
  const resource = factory.resource({ learning_path_parents: [] })
  const paginatedLists = factory.learningPaths({ count: 3 })
  const lists = paginatedLists.results
  const parents = resource.learning_path_parents!

  inLists.forEach((index) => {
    const list = lists[index]
    parents.push(
      factory.microRelationship({
        parent: list.id,
        child: resource.id,
      }),
    )
    // @ts-expect-errorhttps://github.com/mitodl/mit-open/pull/73 should fix this.
    list.learning_path.item_count += 1
  })

  setMockResponse.get(
    urls.learningResources.details({ id: resource.id }),
    resource,
  )
  setMockResponse.get(urls.learningPaths.list(), paginatedLists)

  const view = renderWithProviders(null)

  if (dialogOpen) {
    act(() => {
      NiceModal.show(AddToListDialog, { resourceId: resource.id })
    })
  }

  return {
    view,
    resource,
    lists,
    parents,
  }
}

const addToList = (
  resource: LearningResource,
  list: LearningPathResource,
): LearningPathRelationship => {
  const member = factory.microRelationship({
    parent: list.id,
    child: resource.id,
  })
  const modified = {
    ...resource,
    learning_path_parents: [...(resource.learning_path_parents ?? []), member],
  }
  return factory.learningPathRelationship({
    ...member,
    resource: modified,
  })
}

describe("AddToListDialog", () => {
  test("List is checked iff resource is in list", async () => {
    const index = faker.datatype.number({ min: 0, max: 2 })
    setup({ inLists: [index] })

    const checkboxes = await screen.findAllByRole<HTMLInputElement>("checkbox")
    expect(checkboxes[0].checked).toBe(index === 0)
    expect(checkboxes[1].checked).toBe(index === 1)
    expect(checkboxes[2].checked).toBe(index === 2)
  })

  test("Clicking an unchecked list adds item to that list", async () => {
    const { resource, lists } = setup()
    const list = faker.helpers.arrayElement(lists)

    const addToListUrl = urls.learningPaths.resources({ parent_id: list.id })
    const newRelationship = addToList(resource, list)
    setMockResponse.post(addToListUrl, newRelationship)
    setMockResponse.get(
      urls.learningResources.details({ id: resource.id }),
      resource,
    )

    const listButton = await screen.findByRole("button", { name: list.title })
    const checkbox = within(listButton).getByRole<HTMLInputElement>("checkbox")

    expect(checkbox.checked).toBe(false)
    await user.click(listButton)

    expect(makeRequest).toHaveBeenCalledWith(
      "post",
      addToListUrl,
      expect.objectContaining({
        parent: list.id,
      }),
    )
  })

  test("Clicking a checked list removes item from that list", async () => {
    const index = faker.datatype.number({ min: 0, max: 2 })
    const { resource, lists, parents } = setup({ inLists: [index] })
    const list = lists[index]
    const relationship = parents.find(({ parent }) => parent === list.id)
    invariant(relationship)

    const removalUrl = urls.learningPaths.resourceDetails({
      id: relationship.id,
      parent_id: relationship.parent,
    })
    setMockResponse.delete(removalUrl)
    setMockResponse.get(
      urls.learningResources.details({ id: resource.id }),
      resource,
    )

    const listButton = await screen.findByRole("button", { name: list.title })
    const checkbox = within(listButton).getByRole<HTMLInputElement>("checkbox")

    expect(checkbox.checked).toBe(true)
    await user.click(listButton)

    expect(makeRequest).toHaveBeenCalledWith("delete", removalUrl, undefined)
  })

  test("Clicking 'Create a new list' opens the create list dialog", async () => {
    // Don't actually open the 'Create List' modal, or we'll need to mock API responses.
    const createList = jest
      .spyOn(manageListDialogs, "upsert")
      .mockImplementationOnce(jest.fn())

    setup()
    const button = await screen.findByRole("button", {
      name: "Create a new list",
    })

    expect(createList).not.toHaveBeenCalled()
    await user.click(button)
    expect(createList).toHaveBeenCalledWith()
  })

  test("Opens and closes via NiceModal", async () => {
    const { resource: resource1 } = setup()
    const dialog1 = await screen.findByRole("dialog")
    await within(dialog1).findByText(resource1.title, { exact: false })

    // Close the dialog
    act(() => {
      NiceModal.hide(AddToListDialog)
    })
    await waitForElementToBeRemoved(dialog1)

    // Open it with a new resource
    const resource2 = factory.resource()
    setMockResponse.get(
      urls.learningResources.details({ id: resource2.id }),
      resource2,
    )
    act(() => {
      NiceModal.show(AddToListDialog, { resourceId: resource2.id })
    })
    const dialog2 = await screen.findByRole("dialog")
    await within(dialog2).findByText(resource2.title, { exact: false })
  })
})
