import React from "react"
import FormControl from "@mui/material/FormControl"
import FormGroup from "@mui/material/FormGroup"
import FormLabel from "@mui/material/FormLabel"
import Grid, { type GridProps } from "@mui/material/Grid"
import { ChoiceBox } from "./ChoiceBox"
import type {
  ChoiceBoxGridProps,
  ChoiceBoxChoice,
  ChoiceBoxProps,
} from "./ChoiceBox"

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
  const fieldGridItemProps = {
    ...gridItemProps,
  }
  return (
    <FormControl
      className={className}
      component="fieldset"
      sx={{ width: "100%" }}
    >
      <FormLabel component="legend" sx={{ width: "100%" }}>
        {label}
      </FormLabel>
      <FormGroup>
        <Grid container {...fieldGridProps}>
          {choices.map((choice, index) => (
            <Grid item {...fieldGridItemProps} key={index}>
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
      isChecked={(choice) => values?.indexOf(choice.value) !== -1}
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

export { ChoiceBoxField, CheckboxChoiceBoxField, RadioChoiceBoxField }
export type { CheckboxChoiceBoxFieldProps, RadioChoiceBoxFieldProps }
