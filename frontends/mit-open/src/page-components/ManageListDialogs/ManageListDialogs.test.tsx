import { faker } from "@faker-js/faker/locale/en"
import { factories, urls, makeRequest } from "api/test-utils"
import {
  PrivacyLevelEnum,
  type LearningPathResource,
  type PaginatedLearningResourceTopicList,
  type UserList,
} from "api"
import { allowConsoleErrors, getDescriptionFor } from "ol-test-utilities"
import { manageListDialogs } from "./ManageListDialogs"
import {
  screen,
  renderWithProviders,
  setMockResponse,
  user,
  within,
  act,
} from "../../test-utils"
import type { TestAppOptions } from "../../test-utils"
import { waitForElementToBeRemoved } from "@testing-library/react"
import invariant from "tiny-invariant"

const selectFromAutocomplete = async (input: HTMLElement, label: string) => {
  await user.click(input)
  const listbox = await screen.findByRole("listbox")
  const option = within(listbox).getByRole("option", { name: label })
  await user.click(option)
  return
}

/**
 * Helpers to find various inputs.
 *
 * E.g., `inputs.object_type[LearningResourceType.LearningPath]()` will return
 * radio button for "Learning Path".
 *
 */
const inputs = {
  published: (value?: boolean) => {
    invariant(value !== undefined)
    const element = screen.getByLabelText(value ? "Public" : "Private")
    return element as HTMLInputElement
  },
  privacy_level: (value?: string) => {
    invariant(value !== undefined)
    const element = screen.getByDisplayValue(value)
    return element as HTMLInputElement
  },
  title: () => screen.getByLabelText("Title", { exact: false }),
  description: () => screen.getByLabelText("Description", { exact: false }),
  topics: () => screen.getByLabelText("Subjects", { exact: false }),
  submit: () => screen.getByRole("button", { name: "Save" }),
  cancel: () => screen.getByRole("button", { name: "Cancel" }),
  delete: () => screen.getByRole("button", { name: "Yes, delete" }),
}

describe("manageListDialogs.upsertLearningPath", () => {
  const setup = ({
    resource,
    topics = factories.learningResources.topics({ count: 10 }),
    opts = {
      user: { is_authenticated: true, is_learning_path_editor: true },
    },
  }: {
    topics?: PaginatedLearningResourceTopicList
    resource?: LearningPathResource
    opts?: Partial<TestAppOptions>
  } = {}) => {
    // Add resource topics to topics list to ensure they appear in autocomplete
    resource?.topics?.forEach((topic) => {
      if (topics.results?.some((t) => t.id === topic.id)) return
      topics.results?.push(topic)
    })

    setMockResponse.get(urls.topics.list(), topics)

    renderWithProviders(null, opts)

    act(() => {
      manageListDialogs.upsertLearningPath(resource)
    })

    return { topics }
  }

  test.each([
    {
      resource: undefined,
      expectedTitle: "Create Learning Path",
    },
    {
      resource: factories.learningResources.learningPath(),
      expectedTitle: "Edit Learning Path",
    },
  ])(
    "Dialog title is $expectedTitle when resource=$resource",
    async ({ resource, expectedTitle }) => {
      setup({ resource })
      const dialog = screen.getByRole("heading", { name: expectedTitle })
      expect(dialog).toBeVisible()
    },
  )

  test("'Cancel' closes dialog (and does not make request)", async () => {
    // behavior does not depend on stafflist / userlist, so just pick one
    setup({
      resource: factories.learningResources.learningPath(),
    })
    const dialog = screen.getByRole("dialog")
    await user.click(inputs.cancel())
    expect(makeRequest).not.toHaveBeenCalledWith(
      "patch",
      expect.anything(),
      expect.anything(),
    )
    await waitForElementToBeRemoved(dialog)
  })

  test("Validates required fields", async () => {
    setup()
    await user.click(inputs.submit())

    const titleInput = inputs.title()
    const titleFeedback = getDescriptionFor(titleInput)
    expect(titleInput).toBeInvalid()
    expect(titleFeedback).toHaveTextContent("Title is required.")

    const descriptionInput = inputs.description()
    const descriptionFeedback = getDescriptionFor(descriptionInput)
    expect(descriptionInput).toBeInvalid()
    expect(descriptionFeedback).toHaveTextContent("Description is required.")

    const topicsInput = inputs.topics()
    const topicsFeedback = getDescriptionFor(topicsInput)
    expect(topicsInput).toBeInvalid()
    expect(topicsFeedback).toHaveTextContent("Select between 1 and 3 subjects.")
  })

  test("Form defaults are set", () => {
    setup()
    expect(inputs.published(false).checked).toBe(true)
    expect(inputs.published(true).checked).toBe(false)
    expect(inputs.title()).toHaveValue("")
    expect(inputs.description()).toHaveValue("")
    expect(inputs.topics()).toHaveValue("")
  })

  test("Editing form values", async () => {
    const topics = factories.learningResources.topics({ count: 10 })
    const [topic0, topic1] = topics.results
    const resource = factories.learningResources.learningPath({
      topics: [topic0],
    })
    setup({ resource, topics })
    const patch = {
      published: !resource.published,
      title: faker.lorem.words(),
      description: faker.lorem.paragraph(),
      // Pick a topic that is not already in the resource
      topics: [topic0, topic1],
    }

    // Published
    expect(inputs.published(false).checked).toBe(!resource.published)
    expect(inputs.published(true).checked).toBe(resource.published)
    await user.click(inputs.published(patch.published))

    // Title
    expect(inputs.title()).toHaveValue(resource.title)
    await user.click(inputs.title())
    await user.clear(inputs.title())
    await user.paste(patch.title)

    // Description
    expect(inputs.description()).toHaveValue(resource.description)
    await user.click(inputs.description())
    await user.clear(inputs.description())
    await user.paste(patch.description)

    // Topics:
    expect(inputs.topics()).toHaveValue("")
    await selectFromAutocomplete(inputs.topics(), topic1.name)

    // Submit
    const patchUrl = urls.learningPaths.details({ id: resource.id })
    setMockResponse.patch(patchUrl, { ...resource, ...patch })
    await user.click(inputs.submit())

    expect(makeRequest).toHaveBeenCalledWith(
      "patch",
      patchUrl,
      expect.objectContaining({ ...patch }),
    )
  }, 10000)

  test("Displays overall error if form validates but API call fails", async () => {
    allowConsoleErrors()
    const topics = factories.learningResources.topics({ count: 10 })
    const resource = factories.learningResources.learningPath({
      topics: [topics.results[0]],
    })
    await setup({ resource, topics })

    const patchUrl = urls.learningPaths.details({ id: resource.id })
    setMockResponse.patch(patchUrl, {}, { code: 408 })
    await user.click(inputs.submit())

    expect(makeRequest).toHaveBeenCalledWith(
      "patch",
      patchUrl,
      expect.anything(),
    )
    const alertMessage = await screen.findByRole("alert")

    expect(alertMessage).toHaveTextContent(
      "There was a problem saving your list.",
    )
  })
})

describe("manageListDialogs.upsertUserList", () => {
  const setup = ({
    userList,
    opts = {
      user: { is_authenticated: true },
    },
  }: {
    userList?: UserList
    opts?: Partial<TestAppOptions>
  } = {}) => {
    renderWithProviders(null, opts)

    act(() => {
      manageListDialogs.upsertUserList(userList)
    })
  }

  test.each([
    {
      userList: undefined,
      expectedTitle: "Create User List",
    },
    {
      userList: factories.userLists.userList(),
      expectedTitle: "Edit User List",
    },
  ])(
    "Dialog title is $expectedTitle when userList=$userList",
    async ({ userList, expectedTitle }) => {
      setup({ userList })
      const dialog = screen.getByRole("heading", { name: expectedTitle })
      expect(dialog).toBeVisible()
    },
  )

  test("'Cancel' closes dialog (and does not make request)", async () => {
    // behavior does not depend on stafflist / userlist, so just pick one
    setup({
      userList: factories.userLists.userList(),
    })
    const dialog = screen.getByRole("dialog")
    await user.click(inputs.cancel())
    expect(makeRequest).not.toHaveBeenCalledWith(
      "patch",
      expect.anything(),
      expect.anything(),
    )
    await waitForElementToBeRemoved(dialog)
  })

  test("Validates required fields", async () => {
    setup()
    await user.click(inputs.submit())

    const titleInput = inputs.title()
    const titleFeedback = getDescriptionFor(titleInput)
    expect(titleInput).toBeInvalid()
    expect(titleFeedback).toHaveTextContent("Title is required.")

    const descriptionInput = inputs.description()
    const descriptionFeedback = getDescriptionFor(descriptionInput)
    expect(descriptionInput).toBeInvalid()
    expect(descriptionFeedback).toHaveTextContent("Description is required.")
  })

  test("Form defaults are set", () => {
    setup()
    expect(inputs.title()).toHaveValue("")
    expect(inputs.description()).toHaveValue("")
    expect(inputs.privacy_level(PrivacyLevelEnum.Private).checked).toBe(true)
    expect(inputs.privacy_level(PrivacyLevelEnum.Unlisted).checked).toBe(false)
  })

  test("Editing form values", async () => {
    const userList = factories.userLists.userList()
    setup({ userList: userList })
    const patch = {
      title: faker.lorem.words(),
      description: faker.lorem.paragraph(),
      privacy_level: PrivacyLevelEnum.Unlisted,
    }

    // Title
    expect(inputs.title()).toHaveValue(userList.title)
    await user.click(inputs.title())
    await user.clear(inputs.title())
    await user.paste(patch.title)

    // Description
    expect(inputs.description()).toHaveValue(userList.description)
    await user.click(inputs.description())
    await user.clear(inputs.description())
    await user.paste(patch.description)

    // Privacy Level
    expect(inputs.privacy_level(PrivacyLevelEnum.Private).checked).toBe(
      userList.privacy_level === PrivacyLevelEnum.Private,
    )
    expect(inputs.privacy_level(PrivacyLevelEnum.Unlisted).checked).toBe(
      userList.privacy_level === PrivacyLevelEnum.Unlisted,
    )
    await user.click(inputs.privacy_level(patch.privacy_level))

    // Submit
    const patchUrl = urls.userLists.details({ id: userList.id })
    setMockResponse.patch(patchUrl, { ...userList, ...patch })
    await user.click(inputs.submit())

    expect(makeRequest).toHaveBeenCalledWith(
      "patch",
      patchUrl,
      expect.objectContaining({ ...patch }),
    )
  })

  test("Displays overall error if form validates but API call fails", async () => {
    allowConsoleErrors()
    const userList = factories.userLists.userList()
    await setup({ userList: userList })

    const patchUrl = urls.userLists.details({ id: userList.id })
    setMockResponse.patch(patchUrl, {}, { code: 408 })
    await user.click(inputs.submit())

    expect(makeRequest).toHaveBeenCalledWith(
      "patch",
      patchUrl,
      expect.anything(),
    )
    const alertMessage = await screen.findByRole("alert")

    expect(alertMessage).toHaveTextContent(
      "There was a problem saving your list.",
    )
  })
})

describe("manageListDialogs.destroyLearningPath", () => {
  const setup = () => {
    const resource = factories.learningResources.learningPath()
    renderWithProviders(null)
    act(() => {
      manageListDialogs.destroyLearningPath(resource)
    })
    return { resource }
  }

  test("Dialog title is 'Delete list'", async () => {
    setup()
    const dialog = screen.getByRole("heading", { name: "Delete Learning Path" })
    expect(dialog).toBeVisible()
  })

  test("Deleting a $label calls correct API", async () => {
    const { resource } = setup()

    const dialog = screen.getByRole("dialog")
    const url = urls.learningPaths.details({ id: resource.id })
    setMockResponse.delete(url, undefined)
    await user.click(inputs.delete())

    expect(makeRequest).toHaveBeenCalledWith("delete", url, undefined)
    await waitForElementToBeRemoved(dialog)
  })

  test("Clicking cancel does not delete list", async () => {
    setup()

    const dialog = screen.getByRole("dialog")
    await user.click(inputs.cancel())

    expect(makeRequest).not.toHaveBeenCalled()
    await waitForElementToBeRemoved(dialog)
  })
})

describe("manageListDialogs.destroyUserList", () => {
  const setup = () => {
    const userList = factories.userLists.userList()
    renderWithProviders(null)
    act(() => {
      manageListDialogs.destroyUserList(userList)
    })
    return { userList: userList }
  }

  test("Dialog title is 'Delete list'", async () => {
    setup()
    const dialog = screen.getByRole("heading", { name: "Delete User List" })
    expect(dialog).toBeVisible()
  })

  test("Deleting a $label calls correct API", async () => {
    const { userList } = setup()

    const dialog = screen.getByRole("dialog")
    const url = urls.userLists.details({ id: userList.id })
    setMockResponse.delete(url, undefined)
    await user.click(inputs.delete())

    expect(makeRequest).toHaveBeenCalledWith("delete", url, undefined)
    await waitForElementToBeRemoved(dialog)
  })

  test("Clicking cancel does not delete list", async () => {
    setup()

    const dialog = screen.getByRole("dialog")
    await user.click(inputs.cancel())

    expect(makeRequest).not.toHaveBeenCalled()
    await waitForElementToBeRemoved(dialog)
  })
})
