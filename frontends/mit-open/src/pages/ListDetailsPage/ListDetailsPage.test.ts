import { faker } from "@faker-js/faker/locale/en"
import { factories, urls } from "api/test-utils"
import type {
  LearningPathResource,
  PaginatedLearningPathRelationshipList,
} from "api"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import ItemsListing from "@/page-components/ItemsListing/ItemsListing"
import { learningPathsView } from "@/common/urls"
import {
  screen,
  renderTestApp,
  setMockResponse,
  user,
  waitFor,
  act,
  expectLastProps,
} from "../../test-utils"
import { User } from "../../types/settings"
import { ControlledPromise } from "ol-test-utilities"
import invariant from "tiny-invariant"

jest.mock("../../page-components/ItemsListing/ItemsListing", () => {
  const actual = jest.requireActual(
    "../../page-components/ItemsListing/ItemsListing",
  )
  return {
    __esModule: true,
    ...actual,
    default: jest.fn(actual.default),
  }
})

const spyItemsListing = jest.mocked(ItemsListing)

/**
 * Set up the mock API responses for lists page.
 */
const setup = ({
  userSettings,
  path,
  ...opts
}: {
  userSettings?: Partial<User>
  path: LearningPathResource
  pageSize?: number
}) => {
  invariant(path.learning_path, "Must pass a learning path")
  const pageSize = opts.pageSize ?? path.learning_path.item_count
  const paginatedRelationships =
    factories.learningResources.learningPathRelationships({
      count: Math.min(path.learning_path.item_count, pageSize),
      parent: path.id,
    })
  const detailsUrl = urls.learningPaths.details({ id: path.id })
  const pathResourcesUrl = urls.learningPaths.resources({
    learning_resource_id: path.id,
    /**
     * This is not paginated yet. It's a staff-only view, so let's just increase
     * the pagesize to 100 for now.
     */
    limit: 100,
  })
  setMockResponse.get(detailsUrl, path)
  setMockResponse.get(pathResourcesUrl, paginatedRelationships)

  const { queryClient } = renderTestApp({
    user: userSettings || {},
    url: learningPathsView(path.id),
  })
  return {
    paginatedRelationships,
    queryClient,
    pathResourcesUrl,
    detailsUrl,
  }
}

describe("ListDetailsPage", () => {
  it("Renders list title", async () => {
    const path = factories.learningResources.learningPath()
    setup({ path })
    await screen.findByRole("heading", { name: path.title })
    await waitFor(() => expect(document.title).toBe(`${path.title} | MIT Open`))
  })

  test.each([
    {
      userSettings: { is_learning_path_editor: false },
      canEdit: false,
    },
    {
      userSettings: { is_learning_path_editor: true },
      canEdit: true,
    },
  ])(
    "Users can edit if and only if is_learning_path_editor",
    async ({ userSettings, canEdit }) => {
      const path = factories.learningResources.learningPath()
      setup({ path, userSettings })
      await screen.findByRole("heading", { name: path.title })

      const editButton = screen.queryByRole("button", { name: "Edit" })
      expect(!!editButton).toBe(canEdit)
    },
  )

  test.each([
    {
      userSettings: { is_authenticated: false },
      canSort: false,
    },
    {
      userSettings: { is_authenticated: true },
      canSort: true,
    },
  ])(
    "Users can reorder if and only if authenticated",
    async ({ userSettings, canSort }) => {
      const path = factories.learningResources.learningPath()
      setup({ path, userSettings })
      await screen.findByRole("heading", { name: path.title })

      const reorderButton = screen.queryByRole("button", { name: "Reorder" })
      expect(!!reorderButton).toBe(canSort)
    },
  )

  test("Clicking reorder makes items reorderable, clicking Done makes them static", async () => {
    const path = factories.learningResources.learningPath()
    setup({ path, userSettings: { is_learning_path_editor: true } })
    const reorderButton = await screen.findByRole("button", {
      name: "Reorder",
    })
    expectLastProps(spyItemsListing, { sortable: false })
    await user.click(reorderButton)
    expectLastProps(spyItemsListing, { sortable: true })

    expect(reorderButton).toHaveAccessibleName("Done ordering")
    await user.click(reorderButton)
    expectLastProps(spyItemsListing, { sortable: false })
  }, 10000)

  it.each([
    {
      itemCount: 0,
      canReorder: false,
    },
    {
      itemCount: faker.number.int({ min: 1, max: 20 }),
      canReorder: true,
    },
  ])(
    "Shows 'Reorder' button if and only not empty",
    async ({ itemCount, canReorder }) => {
      const path = factories.learningResources.learningPath({
        learning_path: {
          item_count: itemCount,
        },
      })
      setup({ path, userSettings: { is_learning_path_editor: true } })
      await screen.findByRole("heading", { name: path.title })
      const reorderButton = screen.queryByRole("button", { name: "Reorder" })
      expect(!!reorderButton).toBe(canReorder)
    },
  )

  test("Edit buttons opens editing dialog", async () => {
    const path = factories.learningResources.learningPath()
    setup({ path, userSettings: { is_learning_path_editor: true } })
    const editButton = await screen.findByRole("button", { name: "Edit" })

    const editList = jest.spyOn(manageListDialogs, "upsertLearningPath")
    editList.mockImplementationOnce(jest.fn())

    expect(editList).not.toHaveBeenCalled()
    await user.click(editButton)
    expect(editList).toHaveBeenCalledWith(path)
  })

  test("Displays list count", async () => {
    const path = factories.learningResources.learningPath({
      learning_path: {
        item_count: 30,
      },
    })
    setup({ path, pageSize: 3 })
    await screen.findByText("30 items")
  })

  test("Passes appropriate props to ItemsListing", async () => {
    const path = factories.learningResources.learningPath()
    const { paginatedRelationships } = setup({ path })
    expectLastProps(spyItemsListing, {
      isLoading: true,
      items: [],
      emptyMessage: "There are no items in this list yet.",
    })

    await waitFor(() => {
      expectLastProps(spyItemsListing, {
        // sortable is tested elsewhere
        isLoading: false,
        items: paginatedRelationships.results,
        emptyMessage: "There are no items in this list yet.",
      })
    })
  })

  test("Passes isRefetching=true to ItemsList while reloading data", async () => {
    const path = factories.learningResources.learningPath()
    const { paginatedRelationships, queryClient, pathResourcesUrl } = setup({
      path,
    })
    await waitFor(() => expectLastProps(spyItemsListing, { isLoading: false }))
    expectLastProps(spyItemsListing, { isRefetching: false })
    spyItemsListing.mockClear()

    const response =
      new ControlledPromise<PaginatedLearningPathRelationshipList>()
    setMockResponse.get(pathResourcesUrl, response)

    spyItemsListing.mockClear()
    // invalidate the cache entries and check that isRefetching is true
    act(() => {
      queryClient.invalidateQueries({ queryKey: ["learningResources"] })
    })

    // Wait till everything has settled except our ControlledPromise
    await waitFor(() => expect(queryClient.isFetching()).toBe(1))
    await waitFor(() =>
      expectLastProps(spyItemsListing, { isRefetching: true }),
    )
    spyItemsListing.mockClear()
    await act(async () => {
      response.resolve(paginatedRelationships)
      await response
    })
    await waitFor(() =>
      expectLastProps(spyItemsListing, { isRefetching: false }),
    )
  }, 10000)
})
