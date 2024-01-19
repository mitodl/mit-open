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
import type { ItemsListingProps } from "./ItemsListing"
import { ControlledPromise } from "ol-test-utilities"
import invariant from "tiny-invariant"

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

const factory = factories.learningResources

describe("ItemsListing", () => {
  test("Shows loading message while loading", () => {
    const emptyMessage = "Empty list"

    const { view } = renderWithProviders(
      <ItemsListing emptyMessage={emptyMessage} isLoading />,
    )
    screen.getByLabelText("Loading")
    view.rerender(<ItemsListing emptyMessage={emptyMessage} />)
  })

  test.each([
    { count: 0, hasEmptyMessage: true },
    {
      count: faker.datatype.number({ min: 1, max: 5 }),
      hasEmptyMessage: false,
    },
  ])(
    "Shows empty message when there are no items",
    ({ count, hasEmptyMessage }) => {
      const emptyMessage = faker.lorem.sentence()
      const paginatedRelationships = factory.learningPathRelationships({
        count,
        parent: faker.datatype.number(),
      })
      renderWithProviders(
        <ItemsListing
          emptyMessage={emptyMessage}
          items={paginatedRelationships.results}
        />,
      )
      const emptyMessageElement = screen.queryByText(emptyMessage)
      expect(!!emptyMessageElement).toBe(hasEmptyMessage)
    },
  )

  test.each([
    { sortable: false, cardProps: {} },
    { sortable: true, cardProps: { sortable: true } },
  ])(
    "Shows a list of LearningResourceCards with sortable=$sortable",
    ({ sortable, cardProps }) => {
      const emptyMessage = faker.lorem.sentence()
      const paginatedRelationships = factory.learningPathRelationships({
        count: faker.datatype.number({ min: 2, max: 4 }),
        parent: faker.datatype.number(),
      })
      const items = paginatedRelationships.results
      renderWithProviders(
        <ItemsListing
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
    const emptyMessage = faker.lorem.sentence()
    const parentId = faker.datatype.number()
    const paginatedRelationships = factory.learningPathRelationships({
      count: 5,
      parent: parentId,
    })
    const items = paginatedRelationships.results
    const defaultProps: ItemsListingProps = {
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

    const patchUrl = (id: number) =>
      urls.learningPaths.resourceDetails({
        learning_resource_id: parentId,
        id,
      })

    return { simulateDrag, items, patchUrl }
  }

  test("Dragging an item to a new position calls API correctly", async () => {
    const { simulateDrag, items, patchUrl } = setup()
    const [from, to] = [1, 3]
    const active = items[from]
    const over = items[to]

    setMockResponse.patch(patchUrl(active.id))

    act(() => simulateDrag(from, to))

    await waitFor(() => {
      expect(makeRequest).toHaveBeenCalledWith("patch", patchUrl(active.id), {
        position: over.position,
      })
    })
  })

  test("Dragging is disabled while API call is made", async () => {
    const { simulateDrag, items, patchUrl } = setup()
    const [from, to] = [1, 3]
    const active = items[from]

    const patchResponse = new ControlledPromise<void>()
    setMockResponse.patch(patchUrl(active.id), patchResponse)

    act(() => simulateDrag(from, to))
    await waitFor(() => {
      expect(makeRequest).toHaveBeenCalledWith(
        "patch",
        patchUrl(active.id),
        expect.anything(),
      )
    })

    expectProps(spySortableItem, { disabled: true })

    await act(async () => {
      patchResponse.resolve()
      await patchResponse
    })

    expectProps(spySortableItem, { disabled: false })
  })

  test("UI order is correct while waiting for API response", async () => {
    const { simulateDrag, items, patchUrl } = setup()
    const titles = items.map((items) => items.resource.title)
    const [from, to] = [1, 3]
    const active = items[from]

    const patchResponse = new ControlledPromise<void>()
    setMockResponse.patch(patchUrl(active.id), patchResponse)

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
  })

  test("Sorting is disabled when isRefetching=true", async () => {
    setup({ isRefetching: true })
    expectProps(spySortableItem, { disabled: true })
  })
})
