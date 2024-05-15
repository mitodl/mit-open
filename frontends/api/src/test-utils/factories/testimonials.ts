import { faker } from "@faker-js/faker/locale/en"
import { makePaginatedFactory } from "ol-test-utilities"
import type { Factory } from "ol-test-utilities"
import type { Attestation } from "../../generated/v0"

const testimonial: Factory<Attestation> = (overrides = {}) => ({
  id: faker.datatype.number(),
  title: faker.lorem.sentence(),
  quote: faker.lorem.paragraph(),
  attestant_name: faker.name.fullName(),
  avatar: faker.image.imageUrl(500, 500),
  cover: faker.image.imageUrl(),
  avatar_medium: faker.image.imageUrl(90),
  avatar_small: faker.image.imageUrl(22),
  created_on: faker.date.past().toISOString(),
  updated_on: faker.date.past().toISOString(),
  publish_date: null,
  channels: [],
  ...overrides,
})

const testimonials = makePaginatedFactory(testimonial)

export { testimonial, testimonials }
