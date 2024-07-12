import { faker } from "@faker-js/faker/locale/en"
import type { Factory } from "ol-test-utilities"
import type { ProgramLetter } from "../../generated/v1"

const programLetter: Factory<ProgramLetter> = (overrides = {}) => ({
  id: faker.string.uuid(),
  template_fields: {
    meta: {},
    id: faker.number.int(),
    program_id: faker.number.int(),
    title: faker.lorem.words(),
    program_letter_logo: {
      meta: {
        download_url: faker.image.url(),
      },
    },
    program_letter_text: faker.lorem.paragraph(),
    program_letter_footer: {},
    program_letter_footer_text: faker.lorem.paragraph(),
    program_letter_header_text: faker.lorem.paragraph(),
    program_letter_signatories: [
      {
        id: faker.number.int(),
        name: faker.person.fullName(),
        title_line_1: faker.person.jobTitle(),
        signature_image: {
          meta: {
            download_url: faker.image.url(),
          },
        },
      },
    ],
  },
  certificate: {
    record_hash: faker.string.uuid(),
    micromasters_program_id: faker.number.int(),
    user_email: faker.internet.email(),
    program_title: faker.lorem.words(),
    user_first_name: faker.person.firstName(),
    user_last_name: faker.person.lastName(),
    user_full_name: faker.person.fullName(),
    program_letter_generate_url: new URL(faker.internet.url()).toString(),
    program_letter_share_url: new URL(faker.internet.url()).toString(),
  },
  ...overrides,
})

export { programLetter }
