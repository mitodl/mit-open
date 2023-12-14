import { faker } from "@faker-js/faker/locale/en"
import {
  makePaginatedFactory,
  Factory,
  makeUserList,
} from "ol-utilities/factories"
import type { UserList } from "ol-common"
import { PrivacyLevel, LearningResourceType } from "ol-common"
import type { FieldChannel } from "../interfaces"

const makeFieldUserList: Factory<UserList> = (overrides) =>
  makeUserList({
    privacy_level: PrivacyLevel.Public,
    object_type: LearningResourceType.Userlist,
    ...overrides,
  })

const makeField: Factory<FieldChannel> = (overrides) => ({
  name: faker.helpers.unique(faker.lorem.slug),
  title: faker.lorem.words(faker.datatype.number({ min: 1, max: 4 })),
  public_description: faker.lorem.paragraph(),
  // standardize the url strings to match what browser puts on elements.
  banner: new URL(faker.internet.url()).toString(),
  avatar_small: new URL(faker.internet.url()).toString(),
  avatar_medium: new URL(faker.internet.url()).toString(),
  avatar: new URL(faker.internet.url()).toString(),
  featured_list: makeUserList(),
  lists: [makeUserList(), makeUserList()],
  is_moderator: faker.datatype.boolean(),
  widget_list: faker.datatype.number(),
  ...overrides,
})

const makeFieldsPaginated = makePaginatedFactory(makeField)

export { makeField, makeFieldsPaginated, makeFieldUserList }
