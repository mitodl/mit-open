"use client"

import React from "react"
import { styled } from "ol-components"
import { useProgramLettersDetail } from "api/hooks/programLetters"
import { useParams } from "next/navigation"
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

const ProgramLetterFooter = styled.div`
  margin-top: 40px;
  display: flex;

  .footer-logo {
    width: 50%;
  }

  .footer-text {
    font-size: 12px;
    text-align: end;
    width: 100%;
  }

  .footer-text p {
    line-height: 0.5em;
  }

  .footer-text h2,
  .footer-text h3,
  .footer-text h4 {
    font-size: 13px;
    margin-top: 0;
  }

  .program-footer img {
    max-height: 50px;
    max-width: 300px;
  }
`

const ProgramLetterPage: React.FC = () => {
  const { id } = useParams<RouteParams>()
  const programLetter = useProgramLettersDetail(id)
  const templateFields = programLetter.data?.template_fields
  const certificateInfo = programLetter.data?.certificate

  return (
    <ProgramLetterPageContainer className="letter">
      <ProgramLetterHeader>
        <div className="header-text">
          <CkeditorDisplay
            dangerouslySetInnerHTML={
              templateFields?.program_letter_header_text ?? ""
            }
          />
        </div>
        <div className="letter-logo">
          <img
            src={templateFields?.program_letter_logo?.meta?.download_url}
            alt=""
          />
        </div>
      </ProgramLetterHeader>
      <div className="letter-content">
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
                <img
                  src={signatory.signature_image?.meta?.download_url}
                  alt="Signature"
                />
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
      </div>
      <ProgramLetterFooter>
        <div className="program-footer">
          {templateFields?.program_letter_footer ? (
            <img
              src={templateFields.program_letter_footer?.meta?.download_url}
              alt=""
            />
          ) : (
            <p>MITx MicroMasters program in {templateFields?.title}</p>
          )}
        </div>
        <div className="footer-text">
          <CkeditorDisplay
            dangerouslySetInnerHTML={
              templateFields?.program_letter_footer_text ?? ""
            }
          />
        </div>
      </ProgramLetterFooter>
    </ProgramLetterPageContainer>
  )
}

export default ProgramLetterPage
