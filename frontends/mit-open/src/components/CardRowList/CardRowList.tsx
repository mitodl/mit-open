import { styled } from "ol-components"

const SPACER = "1.5em"

const CardRowList = styled.ul<{ disabled?: boolean; marginTop: boolean }>`
  padding-left: 0;
  margin-left: 0;
  margin-right: 0;
  ${({ marginTop }) => (marginTop ? "" : "margin-top: 0;")}

  > li {
    list-style: none;
    margin-top: ${SPACER};
    margin-bottom: ${SPACER};
  }

  > li:first-of-type {
    margin-top: 0;
  }

  > li:last-child {
    margin-bottom: 0;
  }

  ${({ disabled }) => (disabled ? "opacity: 0.5;" : "")}
`

export default CardRowList
