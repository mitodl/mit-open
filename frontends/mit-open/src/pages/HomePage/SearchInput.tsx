import React, { useCallback } from "react"
import { RiSearch2Line } from "@remixicon/react"
import ClearIcon from "@mui/icons-material/Clear"
import { Input, AdornmentButton } from "ol-components"
import type { InputProps } from "ol-components"

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
    <Input
      fullWidth={props.fullWidth}
      size={props.size}
      inputProps={muiInputProps}
      autoFocus={props.autoFocus}
      className={props.className}
      placeholder={props.placeholder}
      value={props.value}
      onChange={props.onChange}
      onKeyDown={onInputKeyDown}
      startAdornment={
        <AdornmentButton
          aria-label="Search"
          className={props.classNameSearch}
          onClick={handleSubmit}
        >
          <RiSearch2Line fontSize="inherit" />
        </AdornmentButton>
      }
      endAdornment={
        props.value && (
          <AdornmentButton
            className={props.classNameClear}
            aria-label="Clear search text"
            onClick={props.onClear}
          >
            <ClearIcon />
          </AdornmentButton>
        )
      }
    />
  )
}

export { SearchInput }
export type { SearchInputProps }
