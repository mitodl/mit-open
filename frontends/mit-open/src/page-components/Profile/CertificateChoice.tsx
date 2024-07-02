import React from "react"

import {
  styled,
  Grid,
  Container,
  ChoiceBox,
  RadioChoiceField,
} from "ol-components"
import {
  CertificateDesiredEnum,
  CertificateDesiredEnumDescriptions,
} from "api/v0"

import type { ProfileFieldUpdateProps, ProfileFieldStateHook } from "./types"

const CHOICES = [
  CertificateDesiredEnum.Yes,
  CertificateDesiredEnum.No,
  CertificateDesiredEnum.NotSureYet,
].map((value) => ({
  value,
  label: CertificateDesiredEnumDescriptions[value],
}))

type State = CertificateDesiredEnum | ""
type Props = ProfileFieldUpdateProps<"certificate_desired">

const useCertificateChoiceState: ProfileFieldStateHook<
  "certificate_desired"
> = (value, onUpdate) => {
  const [certificateDesired, setCertificateDesired] = React.useState<State>(
    value || "",
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCertificateDesired(() => {
      return event.target.value as CertificateDesiredEnum
    })
  }

  React.useEffect(() => {
    onUpdate("certificate_desired", certificateDesired)
  }, [certificateDesired, onUpdate])

  return [certificateDesired, handleChange]
}

const CertificateChoiceBoxField: React.FC<Props> = ({
  value,
  label,
  onUpdate,
}) => {
  const [certificateDesired, handleChange] = useCertificateChoiceState(
    value,
    onUpdate,
  )

  return (
    <>
      {label}
      <Container maxWidth="md">
        <Grid
          container
          spacing="12px"
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
                  label={CertificateDesiredEnumDescriptions[value]}
                  value={value}
                  onChange={handleChange}
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

const RadioContainer = styled.div(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    "& .MuiFormGroup-root": {
      flexDirection: "row",
    },
  },
}))

const CertificateRadioChoiceField: React.FC<Props> = ({
  value,
  label,
  onUpdate,
}) => {
  const [certificateDesired, handleChange] = useCertificateChoiceState(
    value,
    onUpdate,
  )

  return (
    <RadioContainer>
      <RadioChoiceField
        name="certificate_desired"
        choices={CHOICES}
        label={label}
        value={certificateDesired}
        onChange={handleChange}
      />
    </RadioContainer>
  )
}

export {
  CertificateChoiceBoxField,
  CertificateRadioChoiceField,
  CHOICES as CERTIFICATE_CHOICES,
}
