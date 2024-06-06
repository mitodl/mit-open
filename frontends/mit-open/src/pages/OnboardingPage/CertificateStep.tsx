import React from "react"

import { Grid, Container, ChoiceBox } from "ol-components"
import { CertificateDesiredEnum } from "api/v0"

import { StepProps } from "./types"

import Prompt from "./Prompt"

const LABELS = {
  [CertificateDesiredEnum.No]: "No",
  [CertificateDesiredEnum.Yes]: "Yes",
  [CertificateDesiredEnum.NotSureYet]: "Not sure yet",
}

function CertificateStep({ profile, onUpdate }: StepProps) {
  const [certificateDesired, setCertificateDesired] = React.useState<
    CertificateDesiredEnum | ""
  >(profile.certificate_desired || "")

  const handleToggle = (event: React.SyntheticEvent) => {
    setCertificateDesired(() => {
      const target = event.target as HTMLInputElement
      return target.value as CertificateDesiredEnum
    })
  }

  React.useEffect(() => {
    onUpdate({ certificate_desired: certificateDesired })
  }, [certificateDesired, onUpdate])

  return (
    <>
      <h3>Are you seeking to receive a certificate?</h3>
      <Prompt>Select one:</Prompt>
      <Container maxWidth="md">
        <Grid
          container
          spacing={2}
          justifyContent="center"
          columns={{
            md: 12,
            xs: 4,
          }}
        >
          {Object.values(CertificateDesiredEnum).map((value, index) => {
            const checked = value === certificateDesired
            return (
              <Grid item xs={4} key={index}>
                <ChoiceBox
                  type="radio"
                  label={LABELS[value]}
                  value={value}
                  onChange={handleToggle}
                  checked={checked}
                />
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </>
  )
}

export default CertificateStep
