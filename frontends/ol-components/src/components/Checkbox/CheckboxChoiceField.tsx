import React from "react"
import { Checkbox, CheckboxProps } from "./Checkbox"
import FormControl from "@mui/material/FormControl"
import FormLabel from "@mui/material/FormLabel"
import styled from "@emotion/styled"

export type CheckboxChoiceFieldProps = {
  label: React.ReactNode // We could make this optional, but we should demand one of (label, aria-label, aria-labelledby)
  value?: string[]
  name: string
  choices: Omit<CheckboxProps, "name" | "onChange">[]
  values?: string[]
  onChange?: CheckboxProps["onChange"]
  row?: boolean
  className?: string
}

const Container = styled.div({
  display: "flex",
  gap: "32px",
})

const ColumnContainer = styled(Container)({
  flexDirection: "column",
})

const RowContainer = styled(Container)({
  flexDirection: "row",
})

const CheckboxChoiceField: React.FC<CheckboxChoiceFieldProps> = ({
  label,
  name,
  choices,
  values,
  onChange,
  row,
  className,
}) => {
  const _Container = row ? RowContainer : ColumnContainer
  const isChecked = (choice: CheckboxProps) =>
    choice.value ? values?.includes(choice.value) ?? false : false
  return (
    <FormControl
      component="fieldset"
      sx={{ width: "100%" }}
      className={className}
    >
      <FormLabel component="legend" sx={{ width: "100%" }}>
        {label}
      </FormLabel>
      <_Container>
        {choices.map((choice) => {
          return (
            <Checkbox
              key={choice.value}
              name={name}
              checked={isChecked(choice)}
              onChange={onChange}
              {...choice}
            />
          )
        })}
      </_Container>
    </FormControl>
  )
}

export { CheckboxChoiceField }
