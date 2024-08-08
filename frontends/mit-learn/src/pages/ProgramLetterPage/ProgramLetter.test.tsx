import { renderTestApp, waitFor } from "../../test-utils"
import type { ProgramLetter } from "api"
import { letters as factory } from "api/test-utils/factories"
import { setMockResponse, urls } from "api/test-utils"
import { programLetterView } from "@/common/urls"

const setup = ({ programLetter }: { programLetter: ProgramLetter }) => {
  setMockResponse.get(
    urls.programLetters.details(programLetter.id),
    programLetter,
  )
  setMockResponse.get(urls.userMe.get(), {})
  renderTestApp({
    url: programLetterView(programLetter.id),
  })
}

describe("ProgramLetterDisplayPage", () => {
  it("Renders a program letter from api", async () => {
    const programLetter = factory.programLetter()
    setup({ programLetter })
    await waitFor(() => {
      const letterText = document.querySelector(".letter-text > .ck-content")
      expect(letterText?.innerHTML).toBe(
        programLetter?.template_fields?.program_letter_text,
      )
    })
    await waitFor(() => {
      const signatureImage = document.querySelector(
        ".sig-image > img",
      ) as HTMLImageElement
      expect(signatureImage?.src).toBe(
        programLetter?.template_fields?.program_letter_signatories![0]
          .signature_image?.meta?.download_url,
      )
    })
  })
})
