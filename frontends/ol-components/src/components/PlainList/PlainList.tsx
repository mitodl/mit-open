import styled from "@emotion/styled"

type PlainListProps = {
  /**
   * If disabled, list will be rendered with reduced opacity.
   */
  disabled?: boolean
  /**
   * Spacing between list items, in units of the theme's spacing.
   */
  itemSpacing?: number
}

const PlainList = styled.ul<PlainListProps>(
  ({ theme, itemSpacing, disabled }) => [
    {
      paddingLeft: 0,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0,
      "> li": {
        listStyle: "none",
        marginTop: theme.spacing(itemSpacing ?? 0),
        marginBottom: theme.spacing(itemSpacing ?? 0),
      },
      "> li:first-of-type": {
        marginTop: 0,
      },
      "> li:last-child": {
        marginBottom: 0,
      },
    },
    disabled && { opacity: 0.5 },
  ],
)

export { PlainList }
