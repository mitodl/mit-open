import { faker } from "@faker-js/faker/locale/en"
import { makePaginatedFactory } from "ol-test-utilities"
import type { Factory } from "ol-test-utilities"
import type { ProgramLetter } from "../../generated"

const programLetter: Factory<ProgramLetter> = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  template_fields: {
    id: faker.datatype.number(),
    title: faker.lorem.words(),
    program_letter_logo: {
      meta: {
        download_url: faker.image.imageUrl(),
      },
    },
    program_letter_text: faker.lorem.paragraph(),
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
    micromasters_program_id: faker.datatype.number(),
    user_email: faker.internet.email(),
    program_title: faker.lorem.words(),
    user_first_name: faker.name.firstName(),
    user_last_name: faker.name.lastName(),
    user_full_name: faker.name.fullName(),
  },
  ...overrides,
})

const programLetters = makePaginatedFactory(programLetter)

export { programLetter, programLetters }
