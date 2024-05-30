import React from "react"
import invariant from "tiny-invariant"

type CardVariant = "column" | "row" | "row-reverse"
type ChannelDetailsProps = {
  variant: CardVariant
  className?: string
}

const Details = styled.div``

const ChannelDetails = ({ variant, className }: ChannelDetailsProps) => {
  invariant(
    !sortable || variant === "row-reverse",
    "sortable only supported for variant='row-reverse'",
  )

  return <Details className={className} variant={variant}></Details>
}

export default ChannelDetails
export type { ChannelDetailsProps }
