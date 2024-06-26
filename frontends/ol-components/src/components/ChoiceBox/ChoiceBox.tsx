import React from "react"
import styled from "@emotion/styled"
import { RiRadioButtonLine, RiCheckboxBlankCircleLine } from "@remixicon/react"
import { type GridProps } from "@mui/material/Grid"
import { Checkbox } from "../Checkbox/Checkbox"

const ContainerLabel = styled.label(({ theme }) => {
  const colors = theme.custom.colors
  return {
    margin: 0,
    position: "relative",
    padding: "12px 16px",
    width: "100%",
    minHeight: "100%",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    boxShadow: `inset 0 0 0 1px ${colors.silverGrayLight}`,
    background: colors.white,
    "&:hover:not(.checked)": {
      boxShadow: `inset 0 0 0 1px ${colors.silverGrayDark}`,
    },
    "&:hover": {
      cursor: "pointer",
    },
    "&.checked": {
      boxShadow: `inset 0 0 0 2px ${colors.darkGray2}`,
    },
  }
})

const UpperContainer = styled.div({
  display: "flex",
  gap: "6px",
  alignItems: "center",
  justifyContent: "space-between",
})

const Label = styled.span(({ theme }) => ({
  ...theme.typography.subtitle3,
  color: theme.custom.colors.darkGray2,
}))

const Description = styled.span(({ theme }) => {
  const colors = theme.custom.colors
  return {
    ...theme.typography.body3,
    color: theme.custom.colors.silverGrayDark,
    paddingRight: "26px",
    "label.checked &, label:hover &": {
      color: colors.darkGray2,
    },
  }
})

type IconsProps = {
  checked: boolean
}

const ChoiceIcon = styled.span<IconsProps>(({ theme, checked }) => {
  const colors = theme.custom.colors
  return {
    height: "24px",
    width: "24px",
    color: checked ? colors.red : colors.lightGray2,
    "label:hover:not(.checked) &": {
      color: colors.silverGrayDark,
    },
  }
})

type ChoiceBoxProps = {
  label: string
  description?: string
  value: string
  type: "radio" | "checkbox"
  checked: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const RadioIcons = ({ checked }: IconsProps) => {
  return checked ? <RiRadioButtonLine /> : <RiCheckboxBlankCircleLine />
}

const ChoiceBox = ({
  label,
  description,
  value,
  checked,
  type,
  onChange,
}: ChoiceBoxProps) => {
  return (
    <ContainerLabel className={checked ? "checked" : ""}>
      <UpperContainer>
        <Label>{label}</Label>
        {type === "checkbox" ? (
          <Checkbox value={value} checked={checked} onChange={onChange} />
        ) : null}
        {type === "radio" ? (
          <ChoiceIcon checked={checked}>
            <RadioIcons checked={checked} />
          </ChoiceIcon>
        ) : null}
      </UpperContainer>
      {description ? <Description>{description}</Description> : null}
    </ContainerLabel>
  )
}

interface ChoiceBoxChoice {
  value: string
  label: string
  description?: string
}

type FieldGridProps = Omit<GridProps, "container" | "item">

interface ChoiceBoxGridProps {
  gridProps?: FieldGridProps
  gridItemProps?: FieldGridProps
}

export { ChoiceBox }
export type { ChoiceBoxProps, ChoiceBoxChoice, ChoiceBoxGridProps }
