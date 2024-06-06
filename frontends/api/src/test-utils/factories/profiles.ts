import { faker } from "@faker-js/faker/locale/en"
import type { PartialFactory } from "ol-test-utilities"
import type { Profile } from "../../generated/v0"

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
  learning_format: "",
  certificate_desired: "",
  ...overrides,
})

export { profile }
