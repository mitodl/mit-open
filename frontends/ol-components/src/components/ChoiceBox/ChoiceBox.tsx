import React from "react"
import styled from "@emotion/styled"
import { type GridProps } from "@mui/material/Grid"
import { Checkbox } from "../Checkbox/Checkbox"
import { Radio } from "../Radio/Radio"

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

const UpperContainer = styled.div<{ centered: boolean }>(({ centered }) => ({
  display: "flex",
  gap: "6px",
  alignItems: centered ? "center" : "flex-start",
  justifyContent: "space-between",
}))

const Label = styled.span(({ theme }) => ({
  ...theme.typography.subtitle3,
  color: theme.custom.colors.darkGray2,
}))

const Description = styled.span(({ theme }) => ({
  ...theme.typography.body3,
  color: theme.custom.colors.silverGrayDark,
  paddingRight: "26px",
  marginTop: "-4px",
  "label.checked &, label:hover &": {
    color: theme.custom.colors.darkGray2,
  },
}))

type ChoiceBoxProps = {
  label: string
  name?: string
  description?: string
  value: string
  type: "radio" | "checkbox"
  checked: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const ChoiceBox = ({
  label,
  name,
  description,
  value,
  checked,
  type,
  onChange,
}: ChoiceBoxProps) => {
  return (
    <ContainerLabel className={checked ? "checked" : ""}>
      <UpperContainer centered={!description}>
        <Label>{label}</Label>
        {type === "checkbox" ? (
          <Checkbox value={value} checked={checked} onChange={onChange} />
        ) : null}
        {type === "radio" ? (
          <Radio
            name={name!}
            value={value}
            checked={checked}
            onChange={onChange}
          />
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
