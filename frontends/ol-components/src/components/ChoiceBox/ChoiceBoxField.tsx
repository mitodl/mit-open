import React from "react"
import styled from "@emotion/styled"
import FormControl from "@mui/material/FormControl"
import FormGroup from "@mui/material/FormGroup"
import FormLabel from "@mui/material/FormLabel"
import Grid, { type GridProps } from "@mui/material/Grid"
import { theme } from "../ThemeProvider/ThemeProvider"
import { ChoiceBox } from "./ChoiceBox"
import type {
  ChoiceBoxGridProps,
  ChoiceBoxChoice,
  ChoiceBoxProps,
} from "./ChoiceBox"

const Label = styled.div`
  width: 100%;
  ${{ ...theme.typography.subtitle2 }}
  color: ${theme.custom.colors.darkGray2};
  margin-bottom: 8px;
`

interface BaseChoiceBoxFieldProps extends ChoiceBoxGridProps {
  label: React.ReactNode
  choices: ChoiceBoxChoice[]
  onChange: ChoiceBoxProps["onChange"]
  className?: string
}

interface ChoiceBoxFieldProps extends BaseChoiceBoxFieldProps {
  type: ChoiceBoxProps["type"]
  name?: string
  isChecked: (choice: ChoiceBoxChoice) => boolean
}

const ChoiceBoxField: React.FC<ChoiceBoxFieldProps> = ({
  label,
  name,
  choices,
  type,
  isChecked,
  onChange,
  className,
  gridProps,
  gridItemProps,
}: ChoiceBoxFieldProps) => {
  const fieldGridProps: GridProps = {
    spacing: "12px",
    justifyContent: "center",
    columns: {
      lg: 12,
      xs: 4,
    },
    ...gridProps,
  }
  return (
    <FormControl
      className={className}
      component="fieldset"
      sx={{ width: "100%" }}
    >
      <FormLabel component="legend" sx={{ width: "100%" }}>
        <Label>{label}</Label>
      </FormLabel>
      <FormGroup>
        <Grid container {...fieldGridProps}>
          {choices.map((choice, index) => (
            <Grid item {...gridItemProps} key={index}>
              <ChoiceBox
                type={type}
                name={name}
                checked={isChecked(choice)}
                onChange={onChange}
                {...choice}
              />
            </Grid>
          ))}
        </Grid>
      </FormGroup>
    </FormControl>
  )
}

interface CheckboxChoiceBoxFieldProps extends BaseChoiceBoxFieldProps {
  values?: string[]
}

const CheckboxChoiceBoxField: React.FC<CheckboxChoiceBoxFieldProps> = ({
  values,
  ...props
}) => {
  return (
    <ChoiceBoxField
      type="checkbox"
      isChecked={(choice) => !!values?.includes(choice.value)}
      {...props}
    />
  )
}

interface RadioChoiceBoxFieldProps extends BaseChoiceBoxFieldProps {
  value?: string
  name?: string
}

const RadioChoiceBoxField: React.FC<RadioChoiceBoxFieldProps> = ({
  value,
  ...props
}) => {
  return (
    <ChoiceBoxField
      type="radio"
      isChecked={(choice) => choice.value === value}
      {...props}
    />
  )
}

export { CheckboxChoiceBoxField, RadioChoiceBoxField }
export type { CheckboxChoiceBoxFieldProps, RadioChoiceBoxFieldProps }
