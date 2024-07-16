import React from "react"
import styled from "@emotion/styled"
import { css } from "@emotion/react"
import { theme } from "../ThemeProvider/ThemeProvider"

// prettier-ignore
const hoverSprite = css`background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0H17C17.5523 0 18 0.44772 18 1V17C18 17.5523 17.5523 18 17 18H1C0.44772 18 0 17.5523 0 17V1C0 0.44772 0.44772 0 1 0ZM2 2V16H16V2H2Z' fill='${encodeURIComponent(theme.custom.colors.silverGrayDark)}'/%3E%3C/svg%3E%0A");`

// prettier-ignore
const checkedSprite = css`background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0H17C17.5523 0 18 0.44772 18 1V17C18 17.5523 17.5523 18 17 18H1C0.44772 18 0 17.5523 0 17V1C0 0.44772 0.44772 0 1 0ZM8.0026 13L15.0737 5.92893L13.6595 4.51472L8.0026 10.1716L5.17421 7.3431L3.75999 8.7574L8.0026 13Z' fill='${encodeURIComponent(theme.custom.colors.red)}'/%3E%3C/svg%3E%0A");`

// prettier-ignore
const containerStyles = css`
  input[type="checkbox"] {
    margin-left: 0;
    margin-right: 0;
    height: 24px;
    width: 24px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0H17C17.5523 0 18 0.44772 18 1V17C18 17.5523 17.5523 18 17 18H1C0.44772 18 0 17.5523 0 17V1C0 0.44772 0.44772 0 1 0ZM2 2V16H16V2H2Z' fill='${encodeURIComponent(theme.custom.colors.silverGrayLight)}'/%3E%3C/svg%3E%0A");
    background-repeat: no-repeat;
    background-position: 3px 3px;
    flex-shrink: 0;
    cursor: pointer;
  }

  input[type="checkbox"]:hover {
    ${hoverSprite}
    + .checkbox-label {
      color: ${theme.custom.colors.darkGray2};
    }
  }

  input[type="checkbox"]:checked {
    ${checkedSprite}
    + .checkbox-label {
      color: ${theme.custom.colors.darkGray2};
    }
  }
`

const Container = styled.div`
  height: 24px;

  label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  && input[type="checkbox"] {
    margin: 0;
    margin-right: 4px;
  }

  input[type="checkbox"] + .checkbox-label {
    color: ${theme.custom.colors.silverGrayDark};
  }

  ${containerStyles}

  &:hover input[type="checkbox"]:not(:checked),
  label:hover & input[type="checkbox"]:not(:checked) {
    ${hoverSprite}
  }
`

export type CheckboxProps = {
  label?: string
  value?: string
  name?: string
  checked?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

const Checkbox = ({
  label,
  value,
  name,
  checked,
  onChange,
  className,
}: CheckboxProps) => {
  return (
    <Container className={className}>
      {label ? (
        <label>
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
          />
          <span className="checkbox-label">{label}</span>
        </label>
      ) : (
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
        />
      )}
    </Container>
  )
}

Checkbox.styles = containerStyles

export { Checkbox }
