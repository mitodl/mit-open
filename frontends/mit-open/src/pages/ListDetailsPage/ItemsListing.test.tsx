import React from "react"
import { faker } from "@faker-js/faker/locale/en"
import { SortableList, SortableItem } from "ol-components"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import { factories, urls, makeRequest } from "api/test-utils"
import {
  screen,
  expectProps,
  renderWithProviders,
  setMockResponse,
  waitFor,
  act,
} from "../../test-utils"
import ItemsListing from "./ItemsListing"
import type {
  ItemsListingProps,
  LearningResourceListItem,
} from "./ItemsListing"
import { ControlledPromise } from "ol-test-utilities"
import invariant from "tiny-invariant"
import { LIST_TYPE_LEARNING_PATH, LIST_TYPE_USER_LIST } from "api/constants/"

jest.mock("ol-components", () => {
  const actual = jest.requireActual("ol-components")
  return {
    __esModule: true,
    ...actual,
    SortableList: jest.fn(actual.SortableList),
    SortableItem: jest.fn(actual.SortableItem),
  }
})

const spyLearningResourceCard = jest.mocked(LearningResourceCard)
const spySortableList = jest.mocked(SortableList)
const spySortableItem = jest.mocked(SortableItem)

const learningResourcesFactory = factories.learningResources
const userListsFactory = factories.userLists

const getPaginatedRelationships = (
  listType: string,
  count: number,
  parent: number,
) => {
  if (listType === LIST_TYPE_LEARNING_PATH) {
    return learningResourcesFactory.learningPathRelationships({
      count,
      parent,
    })
  } else if (listType === LIST_TYPE_USER_LIST) {
    return userListsFactory.userListRelationships({
      count,
      parent,
    })
  } else {
    throw new Error("Invalid list type passed to getPaginatedRelationships")
  }
}

describe("ItemsListing", () => {
  test.each([
    { listType: LIST_TYPE_LEARNING_PATH },
    { listType: LIST_TYPE_USER_LIST },
  ])("Shows loading message while loading", ({ listType }) => {
    const emptyMessage = "Empty list"

    const { view } = renderWithProviders(
      <ItemsListing
        listType={listType}
        emptyMessage={emptyMessage}
        isLoading
      />,
    )
    screen.getByLabelText("Loading")
    view.rerender(
      <ItemsListing listType={listType} emptyMessage={emptyMessage} />,
    )
  })

  test.each([
    { listType: LIST_TYPE_LEARNING_PATH, count: 0, hasEmptyMessage: true },
    {
      listType: LIST_TYPE_LEARNING_PATH,
      count: faker.datatype.number({ min: 1, max: 5 }),
      hasEmptyMessage: false,
    },
    { listType: LIST_TYPE_LEARNING_PATH, count: 0, hasEmptyMessage: true },
    {
      listType: LIST_TYPE_USER_LIST,
      count: faker.datatype.number({ min: 1, max: 5 }),
      hasEmptyMessage: false,
    },
  ])(
    "Shows empty message when there are no items",
    ({ listType, count, hasEmptyMessage }) => {
      const emptyMessage = faker.lorem.sentence()
      const paginatedRelationships = getPaginatedRelationships(
        listType,
        count,
        faker.datatype.number(),
      )
      renderWithProviders(
        <ItemsListing
          listType={listType}
          emptyMessage={emptyMessage}
          items={paginatedRelationships.results as LearningResourceListItem[]}
        />,
      )
      const emptyMessageElement = screen.queryByText(emptyMessage)
      expect(!!emptyMessageElement).toBe(hasEmptyMessage)
    },
  )

  test.each([
    { listType: LIST_TYPE_LEARNING_PATH, sortable: false, cardProps: {} },
    {
      listType: LIST_TYPE_LEARNING_PATH,
      sortable: true,
      cardProps: { sortable: true },
    },
    { listType: LIST_TYPE_USER_LIST, sortable: false, cardProps: {} },
    {
      listType: LIST_TYPE_USER_LIST,
      sortable: true,
      cardProps: { sortable: true },
    },
  ])(
    "Shows a list of LearningResourceCards with sortable=$sortable",
    ({ listType, sortable, cardProps }) => {
      const emptyMessage = faker.lorem.sentence()
      const paginatedRelationships = getPaginatedRelationships(
        listType,
        faker.datatype.number({ min: 2, max: 4 }),
        faker.datatype.number(),
      )
      const items = paginatedRelationships.results as LearningResourceListItem[]
      renderWithProviders(
        <ItemsListing
          listType={listType}
          emptyMessage={emptyMessage}
          items={items}
          sortable={sortable}
        />,
      )
      const titles = items.map((item) => item.resource.title)
      const headings = screen.getAllByRole("heading", {
        name: (value) => titles.includes(value),
      })
      expect(headings.map((h) => h.textContent)).toEqual(titles)
      items.forEach(({ resource }) => {
        expectProps(spyLearningResourceCard, { resource, ...cardProps })
      })
    },
  )
})

describe("Sorting ItemListing", () => {
  const setup = (props: Partial<ItemsListingProps> = {}) => {
    const listType = props.listType || ""
    const emptyMessage = faker.lorem.sentence()
    const parentId = faker.datatype.number()
    const paginatedRelationships = getPaginatedRelationships(
      listType,
      5,
      parentId,
    )
    const items = paginatedRelationships.results as LearningResourceListItem[]
    const defaultProps: ItemsListingProps = {
      listType: listType,
      items: items,
      isLoading: false,
      sortable: true,
      emptyMessage,
    }
    const allProps = { ...defaultProps, ...props }
    renderWithProviders(<ItemsListing {...allProps} />)

    const onSortEnd = spySortableList.mock.lastCall?.[0]?.onSortEnd
    invariant(onSortEnd)

    const simulateDrag = (from: number, to: number) => {
      const active = items[from]
      const over = items[to]
      onSortEnd({
        activeIndex: from,
        overIndex: to,
        active: {
          data: {
            // @ts-expect-error not fully simulated
            current: active,
          },
        },
        over: {
          data: {
            // @ts-expect-error not fully simulated
            current: over,
          },
        },
      })
    }

    const patchUrl = (listType: string, id: number) => {
      if (listType === LIST_TYPE_LEARNING_PATH) {
        return urls.learningPaths.resourceDetails({
          learning_resource_id: parentId,
          id,
        })
      } else if (listType === LIST_TYPE_USER_LIST) {
        return urls.userLists.resourceDetails({
          userlist_id: parentId,
          id,
        })
      } else {
        throw new Error("Invalid list type passed to patchUrl")
      }
    }

    return { simulateDrag, items, patchUrl }
  }

  test.each([LIST_TYPE_LEARNING_PATH, LIST_TYPE_USER_LIST])(
    "Dragging an item to a new position calls API correctly",
    async (listType: string) => {
      const { simulateDrag, items, patchUrl } = setup({ listType: listType })
      const [from, to] = [1, 3]
      const active = items[from]
      const over = items[to]

      setMockResponse.patch(patchUrl(listType, active.id))

      act(() => simulateDrag(from, to))

      await waitFor(() => {
        expect(makeRequest).toHaveBeenCalledWith(
          "patch",
          patchUrl(listType, active.id),
          {
            position: over.position,
          },
        )
      })
    },
  )

  test.each([LIST_TYPE_LEARNING_PATH, LIST_TYPE_USER_LIST])(
    "Dragging is disabled while API call is made",
    async (listType: string) => {
      const { simulateDrag, items, patchUrl } = setup({ listType: listType })
      const [from, to] = [1, 3]
      const active = items[from]

      const patchResponse = new ControlledPromise<void>()
      setMockResponse.patch(patchUrl(listType, active.id), patchResponse)

      act(() => simulateDrag(from, to))
      await waitFor(() => {
        expect(makeRequest).toHaveBeenCalledWith(
          "patch",
          patchUrl(listType, active.id),
          expect.anything(),
        )
      })

      expectProps(spySortableItem, { disabled: true })

      await act(async () => {
        patchResponse.resolve()
        await patchResponse
      })

      expectProps(spySortableItem, { disabled: false })
    },
  )

  test.each([LIST_TYPE_LEARNING_PATH, LIST_TYPE_USER_LIST])(
    "UI order is correct while waiting for API response",
    async (listType: string) => {
      const { simulateDrag, items, patchUrl } = setup({ listType: listType })
      const titles = items.map((items) => items.resource.title)
      const [from, to] = [1, 3]
      const active = items[from]

      const patchResponse = new ControlledPromise<void>()
      setMockResponse.patch(patchUrl(listType, active.id), patchResponse)

      const titleEls1 = screen.getAllByRole("heading", {
        name: (value) => titles.includes(value),
      })
      expect(titleEls1.map((el) => el.textContent)).toEqual(titles)

      act(() => simulateDrag(from, to))

      await waitFor(() => {
        const titleEls2 = screen.getAllByRole("heading", {
          name: (value) => titles.includes(value),
        })
        expect(titleEls2).toEqual([
          titleEls1[0],
          titleEls1[2],
          titleEls1[3],
          titleEls1[1],
          titleEls1[4],
        ])
      })
    },
  )

  test.each([LIST_TYPE_LEARNING_PATH, LIST_TYPE_USER_LIST])(
    "Sorting is disabled when isRefetching=true",
    async (listType: string) => {
      setup({ listType: listType, isRefetching: true })
      expectProps(spySortableItem, { disabled: true })
    },
  )
})
