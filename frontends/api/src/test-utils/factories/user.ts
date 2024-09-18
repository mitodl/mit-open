import { faker } from "@faker-js/faker/locale/en"
import type { PartialFactory } from "ol-test-utilities"
import type { Profile, User } from "../../generated/v0"
import { UniqueEnforcer } from "enforce-unique"

const profile: PartialFactory<Profile> = (overrides = {}): Profile => ({
  name: faker.person.fullName(),
  username: faker.string.alphanumeric(),
  placename: "",
  image_file: "",
  image_small_file: "",
  image_medium_file: "",
  profile_image_small: "",
  profile_image_medium: "",
  topic_interests: [],
  goals: [],
  current_education: "",
  time_commitment: "",
  delivery: [],
  certificate_desired: "",
  preference_search_filters: {},
  ...overrides,
})

const enforcerId = new UniqueEnforcer()

const user: PartialFactory<User> = (overrides = {}): User => {
  const result: User = {
    id: enforcerId.enforce(faker.number.int),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    is_article_editor: false,
    is_learning_path_editor: false,
    username: faker.internet.userName(),
    ...overrides,
    profile: profile(overrides?.profile),
  }
  return result
}

export { profile, user }
