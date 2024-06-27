import React from "react"
import styled from "@emotion/styled"
import { css } from "@emotion/react"
import { theme } from "../ThemeProvider/ThemeProvider"

// prettier-ignore
const hoverStyles = css`background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z' fill='${encodeURIComponent(theme.custom.colors.silverGrayDark)}'/%3E%3C/svg%3E%0A");`

// prettier-ignore
const checkedStyles = css`background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17Z' fill='${encodeURIComponent(theme.custom.colors.red)}'/%3E%3C/svg%3E%0A");`

// prettier-ignore
const containerStyles = css`
  input[type="radio"] {
    margin-left: 0;
    margin-right: 0;
    height: 24px;
    width: 24px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z' fill='${encodeURIComponent(theme.custom.colors.silverGrayLight)}'/%3E%3C/svg%3E%0A");
    background-repeat: no-repeat;
    flex-shrink: 0;
    cursor: pointer;
  }

  input[type="radio"]:hover {
    ${hoverStyles}
  }

  input[type="radio"]:checked {
    ${checkedStyles}
  }
`

const Container = styled.div`
  height: 24px;

  label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  && input[type="radio"] {
    margin: 0;
  }

  ${containerStyles}

  &:hover input[type="radio"]:not(:checked),
  label:hover & input[type="radio"]:not(:checked) {
    ${hoverStyles}
  }
`

export type RadioProps = {
  label?: string
  value?: string
  name?: string
  checked?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

const Radio = ({
  label,
  value,
  name,
  checked,
  onChange,
  className,
}: RadioProps) => {
  return (
    <Container className={className}>
      {label ? (
        <label>
          <input
            type="radio"
            value={value}
            name={name}
            checked={checked}
            onChange={onChange}
          />
          {label}
        </label>
      ) : (
        <input
          type="radio"
          value={value}
          name={name}
          checked={checked}
          onChange={onChange}
        />
      )}
    </Container>
  )
}

Radio.styles = containerStyles

export { Radio }
