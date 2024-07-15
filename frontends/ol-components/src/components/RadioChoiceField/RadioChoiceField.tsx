import React, { useCallback, useMemo, useId } from "react"
import FormControl from "@mui/material/FormControl"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormLabel from "@mui/material/FormLabel"
import Radio from "@mui/material/Radio"
import RadioGroup from "@mui/material/RadioGroup"
import type { RadioGroupProps } from "@mui/material/RadioGroup"
import styled from "@emotion/styled"

const RadioGroupStyled = styled(RadioGroup)({
  gap: "16px",
})

const Label = styled(FormLabel)({
  marginTop: "0",
  marginBottom: "16px",
  width: "100%",
})

interface RadioChoiceProps {
  value: string
  label: React.ReactNode
  className?: string
}

interface RadioChoiceFieldProps {
  label: React.ReactNode // We could make this optional, but we should demand one of (label, aria-label, aria-labelledby)
  value?: string
  defaultValue?: string
  name: string
  choices: RadioChoiceProps[]
  row?: boolean
  onChange?: RadioGroupProps["onChange"]
  className?: string
}

/**
 * Wrapper around MUI components to make a form field with:
 *  - radio group input
 *  - label
 *  - help text and error message, if any
 *
 * Avoid using MUI's Radio and RadioGroup directly. Prefer this component.
 */
const RadioChoiceField: React.FC<RadioChoiceFieldProps> = ({
  label,
  value,
  row,
  defaultValue,
  name,
  choices,
  onChange,
  className,
}) => {
  const labelId = useId()
  return (
    <FormControl className={className}>
      <Label id={labelId}>{label}</Label>
      <RadioGroupStyled
        aria-labelledby={labelId}
        name={name}
        defaultValue={defaultValue}
        row={row}
        value={value}
        onChange={onChange}
      >
        {choices.map((choice) => {
          const { value, label, className } = choice
          return (
            <FormControlLabel
              key={value}
              value={value}
              control={<Radio />}
              label={label}
              className={className}
            />
          )
        })}
      </RadioGroupStyled>
    </FormControl>
  )
}

interface BooleanRadioChoiceProps {
  value: boolean
  label: React.ReactNode
  className?: string
}
interface BooleanRadioChoiceFieldProps {
  label: string
  value?: boolean
  defaultValue?: string
  name: string
  choices: BooleanRadioChoiceProps[]
  row?: boolean
  onChange?: (event: { name: string; value: boolean }) => void
  className?: string
}

const BooleanRadioChoiceField: React.FC<BooleanRadioChoiceFieldProps> = ({
  choices,
  onChange,
  name,
  value,
  ...others
}) => {
  const stringifiedChoices = useMemo(
    () =>
      choices.map((choice) => ({
        ...choice,
        value: choice.value ? "true" : "false",
      })),
    [choices],
  )
  const handleChange = useCallback<NonNullable<RadioGroupProps["onChange"]>>(
    (event) => {
      const value = event.target.value === "true"
      onChange?.({ name: name, value })
    },
    [name, onChange],
  )
  return (
    <RadioChoiceField
      value={value === undefined ? undefined : String(value)}
      name={name}
      onChange={handleChange}
      choices={stringifiedChoices}
      {...others}
    />
  )
}

export { RadioChoiceField, BooleanRadioChoiceField }
export type {
  RadioChoiceFieldProps,
  RadioChoiceProps,
  BooleanRadioChoiceFieldProps,
  BooleanRadioChoiceProps,
}
