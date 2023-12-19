import { faker } from "@faker-js/faker/locale/en"
import { makePaginatedFactory, type Factory } from "ol-utilities/factories"
import type { Article } from "../../generated"

const article: Factory<Article> = (overrides = {}) => ({
  id: faker.datatype.number(),
  title: faker.lorem.sentence(),
  html: faker.lorem.paragraph(),
  ...overrides,
})

const articles = makePaginatedFactory(article)

export { article, articles }
