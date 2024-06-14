import { css } from "@emotion/react"
import styled from "@emotion/styled"

type TruncateTextProps = {
  /**
   * Number of lines to display before truncating text.
   */
  lineClamp?: number | "none"
}

const truncateText = (lines?: number | "none") =>
  css({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    WebkitLineClamp: lines,
    [`@supports (-webkit-line-clamp: ${lines})`]: {
      whiteSpace: "initial",
      display: "-webkit-box",
      "-webkit-line-clamp": `${lines}`, // cast to any to avoid typechecking error in lines,
      "-webkit-box-orient": "vertical",
    },
  })

/**
 * Truncate the content after specified number of lines.
 */
const TruncateText = styled.div<TruncateTextProps>(({ lineClamp: lines }) =>
  truncateText(lines),
)

export { TruncateText, truncateText }
export type { TruncateTextProps }
