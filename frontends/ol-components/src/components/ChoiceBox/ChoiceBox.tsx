import React from "react"
import styled from "@emotion/styled"
import { type GridProps } from "@mui/material/Grid"
import { Checkbox } from "../Checkbox/Checkbox"
import { Radio } from "../Radio/Radio"

const Container = styled.label(({ theme }) => {
  const colors = theme.custom.colors
  return {
    margin: 0,
    position: "relative",
    padding: "12px 16px",
    width: "100%",
    minHeight: "100%",
    borderRadius: "4px",
    display: "flex",
    gap: "2px",
    justifyContent: "space-between",
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

const Text = styled.div<{ centered: boolean }>(({ centered }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  wordBreak: "break-word",
  marginTop: centered ? "3px" : "0",
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

const Input = styled.div({
  flexShrink: 0,
})

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
    <Container className={checked ? "checked" : ""}>
      <Text centered={!description}>
        <Label>{label}</Label>
        {description ? <Description>{description}</Description> : null}
      </Text>
      <Input>
        {type === "checkbox" ? (
          <Checkbox value={value} checked={checked} onChange={onChange} />
        ) : null}
        {type === "radio" ? (
          <Radio
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
          />
        ) : null}
      </Input>
    </Container>
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
