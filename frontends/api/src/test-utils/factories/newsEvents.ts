import { faker } from "@faker-js/faker/locale/en"
import { makePaginatedFactory } from "ol-test-utilities"
import type { Factory } from "ol-test-utilities"
import type { FeedItem } from "../../generated/v0"

const newsItem: Factory<FeedItem> = () => ({
  resource_type: "news",
  id: faker.number.int(),
  feed_type: "news",
  title: faker.lorem.sentence(3),
  source: faker.number.int(),
  url: faker.internet.url(),
  image: {
    id: faker.number.int(),
    url: faker.internet.url(),
  },
  guid: faker.string.uuid(),
  news_details: {
    id: faker.number.int(),
    publish_date: faker.date.past().toISOString(),
  },
})

const newsItems = makePaginatedFactory(newsItem)

const eventItem: Factory<FeedItem> = () => ({
  resource_type: "events",
  id: faker.number.int(),
  feed_type: "events",
  title: faker.lorem.sentence(3),
  source: faker.number.int(),
  url: faker.internet.url(),
  image: {
    id: faker.number.int(),
    url: faker.internet.url(),
  },
  guid: faker.string.uuid(),
  event_details: {
    id: faker.number.int(),
    audience: [faker.lorem.word()],
    location: [faker.lorem.word()],
    event_type: [faker.lorem.word()],
    event_datetime: faker.date.future().toISOString(),
  },
})

const eventItems = makePaginatedFactory(eventItem)

export { newsItem, newsItems, eventItem, eventItems }
