import * as React from "react"
import {
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  styled,
} from "ol-components"
import { RiBookOpenLine, RiBriefcase3Line } from "@remixicon/react"

const StyledToggleButtonGroup = styled(ToggleButtonGroup)`
  width: 100%;
  height: 40px;
  border-radius: 4px;
`
const StyledButtonGroupContainer = styled.div`
  margin-top: 10px;
  margin-bottom: 10px;
`
const ExplanationContainer = styled.div`
  margin: 10px;
  font-size: 0.875em;
  min-height: 35px;
`

const StyledRiBookOpenLine = styled(RiBookOpenLine)`
  height: 20px;
  margin-right: 3px;
  margin-left: -2px;
`

const StyledRiBriefcase3Line = styled(RiBriefcase3Line)`
  height: 20px;
  margin-right: 3px;
  margin-left: -2px;
`

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  height: "40px",
  backgroundColor: theme.custom.colors.lightGray2,
  color: theme.custom.colors.darkGray2,
  borderColor: theme.custom.colors.silverGrayLight,

  "&.Mui-selected": {
    backgroundColor: theme.custom.colors.white,
    "&:hover": {
      backgroundColor: theme.custom.colors.white,
    },
  },
  "&:hover": {
    backgroundColor: theme.custom.colors.white,
  },
  ...theme.typography.subtitle3,
}))

const ViewAllButton = styled(StyledToggleButton)`
  border-right: 2px solid;
  border-color: ${({ theme }) => theme.custom.colors.silverGrayLight};
  width: 20%;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
`
const AcademicButton = styled(StyledToggleButton)`
  border-right: 2px solid;
  border-color: ${({ theme }) => theme.custom.colors.silverGrayLight};
  width: 40%;
`
const ProfesionalButton = styled(StyledToggleButton)`
  width: 40%;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
`

const ProfessionalToggle: React.FC<{
  professionalSetting: boolean | null | undefined | string
  setParamValue: (_name: string, _rawValue: string | string[]) => void
}> = ({ professionalSetting, setParamValue }) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: string,
  ) => {
    setParamValue("professional", newValue)
  }

  if (professionalSetting === true || professionalSetting === false) {
    professionalSetting = professionalSetting.toString()
  } else {
    professionalSetting = ""
  }

  return (
    <StyledButtonGroupContainer>
      <StyledToggleButtonGroup
        value={professionalSetting}
        exclusive
        onChange={handleChange}
      >
        <ViewAllButton value="">All</ViewAllButton>
        <AcademicButton value="false">
          <StyledRiBookOpenLine /> Academic
        </AcademicButton>
        <ProfesionalButton value="true">
          <StyledRiBriefcase3Line /> Professional
        </ProfesionalButton>
      </StyledToggleButtonGroup>
      <Collapse in={professionalSetting === ""}>
        <ExplanationContainer>
          Content developed from MIT's academic and professional curriculum
        </ExplanationContainer>
      </Collapse>
      <Collapse in={professionalSetting === "false"}>
        <ExplanationContainer>
          Content developed from MIT’s academic curriculum
        </ExplanationContainer>
      </Collapse>
      <Collapse in={professionalSetting === "true"}>
        <ExplanationContainer>
          Content developed from MIT’s professional curriculum
        </ExplanationContainer>
      </Collapse>
    </StyledButtonGroupContainer>
  )
}

export default ProfessionalToggle
