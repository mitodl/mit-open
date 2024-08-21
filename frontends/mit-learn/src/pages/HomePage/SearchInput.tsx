import React, { useCallback } from "react"
import { RiSearch2Line, RiCloseLine } from "@remixicon/react"
import { Input, AdornmentButton, styled, pxToRem } from "ol-components"
import type { InputProps } from "ol-components"

const StyledInput = styled(Input)({
  height: "72px",
  maxWidth: "calc(100% - 2px)",
  "&.MuiInputBase-adornedEnd": {
    paddingRight: "0 !important",
    button: {
      paddingRight: "10px",
    },
  },
  "&.Mui-focused": {
    paddingLeft: "15px",
    button: {
      paddingRight: "7px",
    },
  },
})

const StyledAdornmentButton = styled(AdornmentButton)(({ theme }) => ({
  ".MuiInputBase-sizeHero &": {
    // Extra padding to make button easier to click
    width: "72px",
    height: "100%",
    flexShrink: 0,
    ".MuiSvgIcon-root": {
      fontSize: pxToRem(24),
    },
    [theme.breakpoints.down("sm")]: {
      width: "37px",
      height: "100%",
      ".MuiSvgIcon-root": {
        fontSize: pxToRem(16),
      },
    },
  },
}))

export interface SearchSubmissionEvent {
  target: {
    value: string
  }
  /**
   * Deprecated. course-search-utils calls unnecessarily.
   */
  preventDefault: () => void
}

type SearchSubmitHandler = (event: SearchSubmissionEvent) => void

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
  const handleSubmit = useCallback(() => {
    const event = {
      target: { value },
      preventDefault: () => null,
    }
    onSubmit(event)
  }, [onSubmit, value])
  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        if (e.key !== "Enter") return
        handleSubmit()
      },
      [handleSubmit],
    )

  return (
    <StyledInput
      fullWidth={props.fullWidth}
      size={props.size}
      inputProps={muiInputProps}
      // Just passing props down. Will lint actual usage at point-of-use
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={props.autoFocus}
      className={props.className}
      placeholder={props.placeholder}
      value={props.value}
      onChange={props.onChange}
      onKeyDown={onInputKeyDown}
      endAdornment={
        <>
          {props.value && (
            <StyledAdornmentButton
              className={props.classNameClear}
              aria-label="Clear search text"
              onClick={props.onClear}
            >
              <RiCloseLine />
            </StyledAdornmentButton>
          )}
          <StyledAdornmentButton
            aria-label="Search"
            className={props.classNameSearch}
            onClick={handleSubmit}
          >
            <RiSearch2Line fontSize="inherit" />
          </StyledAdornmentButton>
        </>
      }
    />
  )
}

export { SearchInput }
export type { SearchInputProps }
