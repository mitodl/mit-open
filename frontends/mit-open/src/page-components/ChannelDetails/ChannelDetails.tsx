import React from "react"
import invariant from "tiny-invariant"
import CardTemplate from "../CardTemplate/CardTemplate"
import styled from "styled-components"
type CardVariant = "column" | "row" | "row-reverse"
type ChannelDetailsProps = {
  variant: CardVariant
  className?: string
}

const ChannelDetailsCard = styled(CardTemplate)<{ variant: CardVariant }>``

const ChannelDetails = ({ variant, className }: ChannelDetailsProps) => {
  invariant(
    !sortable || variant === "row-reverse",
    "sortable only supported for variant='row-reverse'",
  )

  return (
    <ChannelDetailsCard
      variant={variant}
      className={className}
      //bodySlot={body}
    ></ChannelDetailsCard>
  )
}

export default ChannelDetails
export type { ChannelDetailsProps }
