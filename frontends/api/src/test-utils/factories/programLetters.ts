import { faker } from "@faker-js/faker/locale/en"
import type { Factory } from "ol-test-utilities"
import type { ProgramLetter } from "../../generated/v1"

const programLetter: Factory<ProgramLetter> = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  template_fields: {
    meta: {},
    id: faker.datatype.number(),
    program_id: faker.datatype.number(),
    title: faker.lorem.words(),
    program_letter_logo: {
      meta: {
        download_url: faker.image.imageUrl(),
      },
    },
    program_letter_text: faker.lorem.paragraph(),
    program_letter_footer: {},
    program_letter_footer_text: faker.lorem.paragraph(),
    program_letter_header_text: faker.lorem.paragraph(),
    program_letter_signatories: [
      {
        id: faker.datatype.number(),
        name: faker.name.fullName(),
        title_line_1: faker.name.jobTitle(),
        signature_image: {
          meta: {
            download_url: faker.image.imageUrl(),
          },
        },
      },
    ],
  },
  certificate: {
    id: faker.datatype.number(),
    record_hash: faker.datatype.uuid(),
    micromasters_program_id: faker.datatype.number(),
    user_email: faker.internet.email(),
    program_title: faker.lorem.words(),
    user_first_name: faker.name.firstName(),
    user_last_name: faker.name.lastName(),
    user_full_name: faker.name.fullName(),
    program_letter_generate_url: new URL(faker.internet.url()).toString(),
    program_letter_share_url: new URL(faker.internet.url()).toString(),
  },
  ...overrides,
})

export { programLetter }
