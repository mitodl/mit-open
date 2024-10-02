import React from "react"
import { RiSearch2Line, RiCloseLine } from "@remixicon/react"
import { Input, AdornmentButton } from "../Input/Input"
import type { InputProps } from "../Input/Input"
import styled from "@emotion/styled"

const StyledInput = styled(Input)(({ theme }) => ({
  boxShadow: "0px 8px 20px 0px rgba(120, 147, 172, 0.10)",
  [theme.breakpoints.down("sm")]: {
    gap: "8px",
  },
  [theme.breakpoints.up("sm")]: {
    "&.MuiInputBase-sizeHero": {
      borderRadius: "8px !important",
    },
  },
}))

const StyledClearButton = styled(AdornmentButton)({
  width: "32px !important",
  ["&:hover"]: {
    backgroundColor: "transparent",
  },
})

export interface SearchSubmissionEvent {
  target: {
    value: string
  }
  /**
   * Deprecated. course-search-utils calls unnecessarily.
   */
  preventDefault: () => void
}

type SearchSubmitHandler = (
  event: SearchSubmissionEvent,
  opts?: { isEnter?: boolean },
) => void

interface SearchInputProps {
  className?: string
  classNameClear?: string
  classNameSearch?: string
  value: string
  placeholder?: string
  autoFocus?: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onClear: React.MouseEventHandler
  onSubmit: SearchSubmitHandler
  size?: InputProps["size"]
  fullWidth?: boolean
}

const muiInputProps = { "aria-label": "Search for" }

const SearchInput: React.FC<SearchInputProps> = (props) => {
  const { onSubmit, value } = props
  const event = {
    target: { value },
    preventDefault: () => null,
  }

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return
    onSubmit(event, { isEnter: true })
  }

  return (
    <StyledInput
      fullWidth={props.fullWidth}
      size={props.size}
      inputProps={muiInputProps}
      // Just passing props down. Will lint actual usage at point-of-use
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={props.autoFocus}
      className={props.className}
      placeholder={
        props.placeholder ??
        "Search for courses, programs, and learning materials..."
      }
      value={props.value}
      onChange={props.onChange}
      onKeyDown={onInputKeyDown}
      endAdornment={
        <>
          {props.value && (
            <StyledClearButton
              className={props.classNameClear}
              aria-label="Clear search text"
              onClick={props.onClear}
            >
              <RiCloseLine />
            </StyledClearButton>
          )}
          <AdornmentButton
            aria-label="Search"
            className={props.classNameSearch}
            onClick={() => onSubmit(event, { isEnter: false })}
          >
            <RiSearch2Line fontSize="inherit" />
          </AdornmentButton>
        </>
      }
      responsive
    />
  )
}

export { SearchInput }
export type { SearchInputProps }
