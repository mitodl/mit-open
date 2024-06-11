import { faker } from "@faker-js/faker/locale/en"
import { makePaginatedFactory } from "ol-test-utilities"
import type { Factory } from "ol-test-utilities"
import type { Attestation } from "../../generated/v0"

const testimonial: Factory<Attestation> = (overrides = {}) => ({
  id: faker.number.int(),
  title: faker.lorem.sentence(),
  quote: faker.lorem.paragraph(),
  attestant_name: faker.person.fullName(),
  avatar: faker.image.url({ width: 500, height: 500 }),
  cover: faker.image.url(),
  avatar_medium: faker.image.url({ width: 90, height: 90 }),
  avatar_small: faker.image.url({ width: 22, height: 22 }),
  created_on: faker.date.past().toISOString(),
  updated_on: faker.date.past().toISOString(),
  publish_date: null,
  channels: [],
  offerors: [],
  ...overrides,
})

const testimonials = makePaginatedFactory(testimonial)

export { testimonial, testimonials }
