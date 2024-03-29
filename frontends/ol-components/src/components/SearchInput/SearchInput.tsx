import React, { useCallback, useMemo } from "react"

import SearchIcon from "@mui/icons-material/Search"
import ClearIcon from "@mui/icons-material/Clear"
import OutlinedInput from "@mui/material/OutlinedInput"
import type { OutlinedInputProps } from "@mui/material/OutlinedInput"
import InputAdornment from "@mui/material/InputAdornment"
import IconButton from "@mui/material/IconButton"

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
  color?: OutlinedInputProps["color"]
  className?: string
  classNameClear?: string
  classNameSearch?: string
  value: string
  placeholder?: string
  autoFocus?: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onClear: React.MouseEventHandler
  onSubmit: SearchSubmitHandler
}

const searchIconAdjustments = {
  fontSize: "150%",
  /**
   * We want the icon to have its circle a bit closer to the baseline, which
   * this accounts for.
   */
  transform: "translateY(+5%)",
}

const SearchInput: React.FC<SearchInputProps> = (props) => {
  const { onSubmit, value, color } = props
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
  const muiInputProps = useMemo(() => ({ "aria-label": "Search for" }), [])
  return (
    <OutlinedInput
      inputProps={muiInputProps}
      autoFocus={props.autoFocus}
      className={props.className}
      placeholder={props.placeholder}
      color={color}
      value={props.value}
      onChange={props.onChange}
      onKeyDown={onInputKeyDown}
      startAdornment={
        <InputAdornment position="start">
          {props.value && (
            <IconButton
              className={props.classNameClear}
              aria-label="Clear search text"
              onClick={props.onClear}
            >
              <ClearIcon />
            </IconButton>
          )}
        </InputAdornment>
      }
      endAdornment={
        <InputAdornment position="end" color="secondary">
          <IconButton
            aria-label="Search"
            className={props.classNameSearch}
            onClick={handleSubmit}
          >
            <SearchIcon sx={searchIconAdjustments} />
          </IconButton>
        </InputAdornment>
      }
    />
  )
}

export { SearchInput }
export type { SearchInputProps }
