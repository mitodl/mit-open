import React, { useCallback } from "react"

import ClearIcon from "@mui/icons-material/Clear"
import {
  Input,
  AdornmentButton,
  FormGroup,
  Button,
  styled,
  css,
} from "ol-components"
import type { InputProps } from "ol-components"
import { RiSearch2Line } from "@remixicon/react"

export interface SearchSubmissionEvent {
  target: {
    value: string
  }
  /**
   * Deprecated. course-search-utils calls unnecessarily.
   */
  preventDefault: () => void
}

const StyledInput = styled(Input)`
  border-radius: 0;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  max-width: 81%;
  border-right: none;
  height: 48px;

  &.Mui-focused {
    border-color: ${({ theme }) => theme.custom.colors.darkGray2};
    color: ${({ theme }) => theme.custom.colors.darkGray2};
  }

  ${({ theme }) => theme.breakpoints.down("md")} {
    height: 37px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
`

const StyledButton = styled(Button)`
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;

  ${({ theme }) => theme.breakpoints.up("md")} {
    ${({ theme }) => css({ ...theme.typography.body2 })};
    min-width: 64px;
    height: 48px;
    padding: 8px 16px;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;

    svg {
      height: 1.5em;
      width: 1.5em;
    }
  }

  ${({ theme }) => theme.breakpoints.down("md")} {
    ${({ theme }) => css({ ...theme.typography.body4 })};
    height: 37px;
    width: 40px;
    min-width: 40px;
    padding: 0;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;

    svg {
      height: 1em;
      width: 1em;
      font-size: 18px;
    }
  }
`

const StyledFormGroup = styled(FormGroup)`
  width: 100%;
`

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
    <StyledFormGroup row>
      <StyledInput
        fullWidth={props.fullWidth}
        size={props.size}
        inputProps={muiInputProps}
        autoFocus={props.autoFocus}
        className={props.className}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
        onKeyDown={onInputKeyDown}
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
      <StyledButton
        color="primary"
        size="medium"
        aria-label="Search"
        className={props.classNameSearch}
        onClick={handleSubmit}
      >
        <RiSearch2Line fontSize="inherit" />
      </StyledButton>
    </StyledFormGroup>
  )
}

export { SearchInput }
export type { SearchInputProps }
