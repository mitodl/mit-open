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

  .program-title {
    margin-top: 30px;
  }
  .program-footer {
    margin-top: 40px;
    display: flex;
  }
  .program-footer .footer-logo {
    width: 50%;
  }
  .program-footer .footer-text {
    font-size: 12px;
    text-align: end;
    width: 50%;
  }
  .program-footer .footer-text p {
    line-height: 0.5em;
  }
  .program-footer .footer-text h2,
  .program-footer .footer-text h3,
  .program-footer .footer-text h4 {
    font-size: 13px;
    margin-top: 0;
  }
  .header-row {
    display: flex;
  }
  .header-row .header-text {
    width: 50%;
  }
  .header-row .header-text p {
    font-size: 14px;
    line-height: 1.2em;
    margin: 0;
  }
  .header-row .header-text h2,
  .header-row .header-text h3,
  .header-row .header-text h4 {
    font-size: 18px;
    margin: 0;
  }
  .header-row .letter-logo {
    width: 50%;
    text-align: end;
  }
  .letter-content {
    margin-top: 50px;
  }
  .signatories .signatory {
    margin: 10px 0 5px;
  }
  .signatories .sig-image {
    max-height: 80px;
    margin-bottom: 3px;
  }
  .letter-logo > img {
    max-width: 300px;
    max-height: 150px;
  }
  .sig-image > img {
    max-height: 60px;
    max-width: 130px;
  }
  .footer-logo > img {
    max-width: 300px;
    max-height: 150px;
  }
`

const ProgramLetterPage: React.FC = () => {
  const id = String(useParams<RouteParams>().id)
  const programLetter = useProgramLettersDetail(id)
  const templateFields = programLetter.data?.template_fields
  const certificateInfo = programLetter.data?.certificate

  return (
    <ProgramLetterPageContainer className="letter">
      <div className="header-row">
        <div className="header-text">{templateFields?.header_text}</div>
        <div className="letter-logo">
          <img src={templateFields?.program_letter_logo.meta.download_url} />
        </div>
      </div>

      <strong>Dear {certificateInfo?.user_full_name},</strong>
      <div className="letter-text">
        <CkeditorDisplay
          dangerouslySetInnerHTML={templateFields?.program_letter_text ?? ""}
        />
      </div>
      <div className="signatories">
        {templateFields?.program_letter_signatories.map((signatory) => (
          <div key={signatory.id} className="signatory">
            <div className="sig-image">
              <img src={signatory.signature_image.meta.download_url} />
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
      </div>
    </ProgramLetterPageContainer>
  )
}

export default ProgramLetterPage
