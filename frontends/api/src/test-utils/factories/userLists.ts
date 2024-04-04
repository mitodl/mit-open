import { Factory, makePaginatedFactory } from "ol-test-utilities"
import {
  MicroUserListRelationship,
  PaginatedUserListRelationshipList,
  PrivacyLevelEnum,
  UserList,
  UserListRelationship,
} from "api"
import { resource as learningResource } from "./learningResources"
import { faker } from "@faker-js/faker/locale/en"

const userList: Factory<UserList> = (overrides = {}) => {
  const list: UserList = {
    id: faker.helpers.unique(faker.datatype.number),
    title: faker.helpers.unique(faker.lorem.words),
    description: faker.helpers.unique(faker.lorem.paragraph),
    privacy_level: faker.helpers.arrayElement(Object.values(PrivacyLevelEnum)),
    item_count: 4,
    image: {},
    author: faker.helpers.unique(faker.datatype.number),
    ...overrides,
  }
  return list
}
const userLists = makePaginatedFactory(userList)

const microUserListRelationship: Factory<MicroUserListRelationship> = (
  overrides = {},
) => {
  return {
    id: faker.helpers.unique(faker.datatype.number),
    child: faker.helpers.unique(faker.datatype.number),
    parent: faker.helpers.unique(faker.datatype.number),
    ...overrides,
  }
}

const userListRelationship: Factory<UserListRelationship> = (
  overrides = {},
) => {
  const micro = microUserListRelationship()
  const resource = learningResource({
    id: micro.child,
    user_list_parents: [micro],
  })
  return {
    ...micro,
    position: faker.datatype.number(),
    resource,
    ...overrides,
  }
}

const userListRelationships = ({
  count,
  parent,
  pageSize,
  next = null,
  previous = null,
}: {
  count: number
  parent: number
  pageSize?: number
  next?: string | null
  previous?: string | null
}) => {
  const results: UserListRelationship[] = Array(pageSize ?? count)
    .fill(null)
    .map((_val, index) => {
      return userListRelationship({
        position: index + 1,
        parent,
      })
    })
  return {
    count,
    next,
    previous,
    results,
  } satisfies PaginatedUserListRelationshipList
}

export {
  userList,
  userLists,
  userListRelationship,
  userListRelationships,
  microUserListRelationship,
}
