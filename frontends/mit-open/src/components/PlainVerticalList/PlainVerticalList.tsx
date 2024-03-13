import { styled } from "ol-components"

/**
 * A plain list: No markers, margin, or padding around the list.
 * Customizable margin between items.
 */
const PlainVerticalList = styled.ul<{ itemSpacing: string }>`
  list-style: none;
  margin: 0px;
  padding: 0px;

  > li {
    margin-bottom: ${({ itemSpacing }) => itemSpacing};
  }
  > li:last-child {
    margin-bottom: none;
  }
`

export default PlainVerticalList;