import React from "react"
import styled from "@emotion/styled"
import {
  RiCheckboxFill,
  RiCheckboxBlankLine,
  RiRadioButtonLine,
  RiCheckboxBlankCircleLine,
} from "@remixicon/react"
import { type GridProps } from "@mui/material/Grid"

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
    gap: "6px",
    justifyContent: "space-between",
    boxShadow: `inset 0 0 0 1px ${colors.silverGrayLight}`,
    background: colors.white,
    "&.checked": {
      boxShadow: `inset 0 0 0 2px ${colors.darkGray2}`,
    },
    "&:hover": {
      boxShadow: `inset 0 0 0 1px ${colors.silverGray}`,
      cursor: "pointer",
    },
  }
})

const UpperContainer = styled.div({
  display: "flex",
  gap: "6px",
  alignItems: "center",
})

const Label = styled.span(({ theme }) => ({
  ...theme.typography.subtitle3,
  color: theme.custom.colors.darkGray2,
}))

const Description = styled.span(({ theme }) => {
  const colors = theme.custom.colors
  return {
    ...theme.typography.body3,
    color: theme.custom.colors.darkGray2,
    paddingRight: "26px",
    "label.checked &, label:hover &": {
      color: colors.darkGray2,
    },
  }
})

const ChoiceInput = styled.input(({ theme }) => ({
  appearance: "none",
  visibility: "hidden",
  backgroundColor: theme.custom.colors.white,
  margin: 0,
  position: "absolute",
}))

type IconsProps = {
  checked: boolean
}

const ChoiceIcon = styled.span<IconsProps>(({ theme, checked }) => {
  const colors = theme.custom.colors
  return {
    position: "absolute",
    right: 0,
    height: "24px",
    width: "24px",
    marginRight: "12px",
    color: checked ? colors.mitRed : colors.lightGray2,
    "label:hover &": {
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

const CheckboxIcons = ({ checked }: IconsProps) => {
  return checked ? <RiCheckboxFill /> : <RiCheckboxBlankLine />
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
        <ChoiceIcon checked={checked}>
          {type === "checkbox" ? <CheckboxIcons checked={checked} /> : null}
          {type === "radio" ? <RadioIcons checked={checked} /> : null}
        </ChoiceIcon>
      </UpperContainer>
      {description ? <Description>{description}</Description> : null}
      <ChoiceInput
        type={type}
        value={value}
        checked={checked}
        onChange={onChange}
      />
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
