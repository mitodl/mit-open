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
import { UniqueEnforcer } from "enforce-unique"

const uniqueEnforcerWords = new UniqueEnforcer()
const uniqueEnforcerId = new UniqueEnforcer()

const userList: Factory<UserList> = (overrides = {}) => {
  const list: UserList = {
    id: uniqueEnforcerId.enforce(() => faker.number.int()),
    title: uniqueEnforcerWords.enforce(() => faker.lorem.words()),
    description: uniqueEnforcerWords.enforce(() => faker.lorem.paragraph()),
    privacy_level: faker.helpers.arrayElement(Object.values(PrivacyLevelEnum)),
    item_count: 4,
    image: {},
    author: uniqueEnforcerId.enforce(() => faker.number.int()),
    ...overrides,
  }
  return list
}
const userLists = makePaginatedFactory(userList)

const microUserListRelationship: Factory<MicroUserListRelationship> = (
  overrides = {},
) => {
  return {
    id: uniqueEnforcerId.enforce(() => faker.number.int()),
    child: uniqueEnforcerId.enforce(() => faker.number.int()),
    parent: uniqueEnforcerId.enforce(() => faker.number.int()),
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
    position: faker.number.int(),
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
