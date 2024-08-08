import { faker } from "@faker-js/faker/locale/en"
import type { Factory } from "ol-test-utilities"
import type { User } from "../types/settings"

const makeUserSettings: Factory<User> = (overrides = {}) => {
  const hasConflict =
    (Number.isFinite(overrides.id) && overrides.is_authenticated === false) ||
    (overrides.id === null && overrides.is_authenticated === true)
  if (hasConflict) {
    throw new Error(
      "Conflicting values of id and is_authenticated detected. Suggest supplying one or the other, not both.",
    )
  }

  const calculated: Partial<User> = {}
  if (Number.isFinite(overrides.id)) {
    calculated.is_authenticated = true
  } else if (overrides.is_authenticated) {
    calculated.id = faker.number.int()
  }
  return {
    id: null,
    first_name: null,
    last_name: null,
    is_authenticated: false,
    is_article_editor: false,
    is_learning_path_editor: false,
    ...calculated,
    ...overrides,
  }
}

export { makeUserSettings }
