import { Factory, makePaginatedFactory } from "ol-test-utilities"
import { UserList } from "api"
import { faker } from "@faker-js/faker/locale/en"

const userList: Factory<UserList> = (overrides = {}) => {
  const list: UserList = {
    id: faker.helpers.unique(faker.datatype.number),
    title: faker.helpers.unique(faker.lorem.words),
    item_count: 4,
    image: {},
    author: faker.helpers.unique(faker.datatype.number),
    ...overrides,
  }
  return list
}
const userLists = makePaginatedFactory(userList)

export { userList, userLists }
