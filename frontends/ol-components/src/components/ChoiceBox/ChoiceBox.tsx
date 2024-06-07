import React from "react"
import styled from "@emotion/styled"
import {
  RiCheckboxFill,
  RiCheckboxBlankLine,
  RiRadioButtonLine,
  RiCheckboxBlankCircleLine,
} from "@remixicon/react"

import FormControl from "@mui/material/FormControl"
import FormGroup from "@mui/material/FormGroup"
import FormLabel from "@mui/material/FormLabel"
import Grid, { type GridProps } from "@mui/material/Grid"

const Label = styled.label(({ theme }) => {
  const colors = theme.custom.colors
  return {
    margin: 0,
    position: "relative",
    padding: "12px 16px",
    width: "100%",
    minHeight: "100%",
    borderRadius: "4px",
    display: "flex",
    alignItems: "start",
    justifyContent: "space-between",
    boxShadow: `inset 0 0 0 1px ${colors.silverGrayLight}`,
    color: colors.darkGray2,
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: "12px",
    lineHeight: "16px",
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

const LabelContainer = styled.div({
  display: "flex",
  flexDirection: "column",
})

const Description = styled.span(({ theme }) => {
  const colors = theme.custom.colors
  return {
    color: colors.silverGrayDark,
    fontWeight: theme.typography.fontWeightRegular,
    "label.checked &, label:hover &": {
      color: colors.darkGray2,
    },
  }
})

const ChoiceInput = styled.input(({ theme }) => ({
  appearance: "none",
  visibility: "hidden",
  backgroundColor: theme.custom.colors.white,
  width: "18px",
  height: "18px",
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
    <Label className={checked ? "checked" : ""}>
      <LabelContainer>
        {label}
        {description ? <Description>{description}</Description> : null}
      </LabelContainer>
      <ChoiceInput
        type={type}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <ChoiceIcon checked={checked}>
        {type === "checkbox" ? <CheckboxIcons checked={checked} /> : null}
        {type === "radio" ? <RadioIcons checked={checked} /> : null}
      </ChoiceIcon>
    </Label>
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

interface BaseChoiceBoxFieldProps extends ChoiceBoxGridProps {
  label: React.ReactNode
  choices: ChoiceBoxChoice[]
  onChange: ChoiceBoxProps["onChange"]
  className?: string
}

interface ChoiceBoxFieldProps extends BaseChoiceBoxFieldProps {
  type: ChoiceBoxProps["type"]
  isChecked: (choice: ChoiceBoxChoice) => boolean
}

const ChoiceBoxField: React.FC<ChoiceBoxFieldProps> = ({
  label,
  choices,
  type,
  isChecked,
  onChange,
  className,
  gridProps,
  gridItemProps,
}: ChoiceBoxFieldProps) => {
  const fieldGridProps: GridProps = {
    spacing: 2,
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

export { ChoiceBox, CheckboxChoiceBoxField, RadioChoiceBoxField }
export type {
  ChoiceBoxProps,
  ChoiceBoxChoice,
  ChoiceBoxGridProps,
  CheckboxChoiceBoxFieldProps,
  RadioChoiceBoxFieldProps,
}
