import React from "react"
import { styled } from "ol-components"
import { useProgramLettersDetail } from "api/hooks/programLetters"
import { useParams } from "react-router"
import { CkeditorDisplay } from "ol-ckeditor"

type RouteParams = {
  id: string
}

const ProgramLetterPageContainer = styled.div`
  background: #fff;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding: 50px 60px;

  .letter-content {
    margin-top: 50px;
  }

  .letter-logo > img {
    max-width: 300px;
    max-height: 150px;
  }

  .footer-logo > img {
    max-width: 300px;
    max-height: 150px;
  }
`

const ProgramLetterHeader = styled.div`
  display: flex;

  .header-text {
    width: 50%;
  }

  .header-text p {
    font-size: 14px;
    line-height: 1.2em;
    margin: 0;
  }

  .header-text h2,
  .header-text h3,
  .header-text h4 {
    font-size: 18px;
    margin: 0;
  }

  .letter-logo {
    width: 50%;
    text-align: end;
  }
`

const ProgramLetterSignatures = styled.div`
  .signatory {
    margin: 10px 0 5px;
  }

  .sig-image {
    max-height: 80px;
    margin-bottom: 3px;
  }

  .sig-image > img {
    max-height: 60px;
    max-width: 130px;
  }
`

const ProgramLetterPage: React.FC = () => {
  const id = String(useParams<RouteParams>().id)
  const programLetter = useProgramLettersDetail(id)
  const templateFields = programLetter.data?.template_fields
  const certificateInfo = programLetter.data?.certificate

  return (
    <ProgramLetterPageContainer className="letter">
      <ProgramLetterHeader>
        <div className="header-text">
          {templateFields?.program_letter_header_text}
        </div>
        <div className="letter-logo">
          <img src={templateFields?.program_letter_logo?.meta?.download_url} />
        </div>
      </ProgramLetterHeader>

      <strong>Dear {certificateInfo?.user_full_name},</strong>
      <div className="letter-text">
        <CkeditorDisplay
          dangerouslySetInnerHTML={templateFields?.program_letter_text ?? ""}
        />
      </div>
      <ProgramLetterSignatures>
        {templateFields?.program_letter_signatories?.map((signatory) => (
          <div key={signatory.id} className="signatory">
            <div className="sig-image">
              <img src={signatory.signature_image?.meta?.download_url} />
            </div>
            <div className="name">
              {signatory.name},{signatory.title_line_1}
              {signatory.title_line_2 ? (
                <p>, {signatory.title_line_2}</p>
              ) : (
                <p></p>
              )}
            </div>
          </div>
        ))}
      </ProgramLetterSignatures>
    </ProgramLetterPageContainer>
  )
}

export default ProgramLetterPage
