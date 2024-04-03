import { faker } from "@faker-js/faker/locale/en"
import { makePaginatedFactory } from "ol-test-utilities"
import type { Factory } from "ol-test-utilities"
import type { FieldChannel } from "../../generated/v0"

const field: Factory<FieldChannel> = (overrides = {}) => ({
  name: faker.helpers.unique(faker.lorem.slug),
  about: faker.lorem.paragraph(),
  title: faker.lorem.words(faker.datatype.number({ min: 1, max: 4 })),
  public_description: faker.lorem.paragraph(),
  banner: new URL(faker.internet.url()).toString(),
  avatar_small: new URL(faker.internet.url()).toString(),
  avatar_medium: new URL(faker.internet.url()).toString(),
  avatar: new URL(faker.internet.url()).toString(),
  is_moderator: faker.datatype.boolean(),
  widget_list: faker.datatype.number(),
  subfields: [],
  featured_list: null,
  lists: [],
  updated_on: faker.date.recent().toString(),
  created_on: faker.date.recent().toString(),
  id: faker.datatype.number(),
  ga_tracking_id: faker.lorem.slug(),
  ...overrides,
})

const fields = makePaginatedFactory(field)

export { fields, field }
