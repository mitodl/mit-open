import React from "react"
import { Checkbox, CheckboxProps } from "./Checkbox"
import FormControl from "@mui/material/FormControl"
import FormLabel from "@mui/material/FormLabel"
import styled from "@emotion/styled"

export type CheckboxGroupFieldProps = {
  label: React.ReactNode // We could make this optional, but we should demand one of (label, aria-label, aria-labelledby)
  value?: string[]
  name: string
  choices: Omit<CheckboxProps, "name" | "onChange">[]
  onChange?: CheckboxProps["onChange"]
  row?: boolean
  className?: string
}

const ColumnContainer = styled.div({
  display: "flex",
  flexDirection: "column",
})

const RowContainer = styled.div({
  display: "flex",
  flexDirection: "row",
})

const CheckboxGroupField: React.FC<CheckboxGroupFieldProps> = ({
  label,
  name,
  choices,
  onChange,
  row,
  className,
}) => {
  const Container = row ? RowContainer : ColumnContainer
  return (
    <FormControl
      component="fieldset"
      sx={{ width: "100%" }}
      className={className}
    >
      <FormLabel component="legend" sx={{ width: "100%" }}>
        {label}
      </FormLabel>
      <Container>
        {choices.map((choice) => {
          return (
            <Checkbox
              key={choice.value}
              name={name}
              onChange={onChange}
              {...choice}
            />
          )
        })}
      </Container>
    </FormControl>
  )
}

export { CheckboxGroupField }
