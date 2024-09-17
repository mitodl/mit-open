import React from "react"
import type { PopoverProps } from "ol-components"
import styled from "@emotion/styled"
import { Popover } from "../Popover/Popover"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "../Button/Button"

const StyledPopover = styled(Popover)({
  width: "300px",
  maxWidth: "100vw",
})
const HeaderText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  marginBottom: "8px",
}))
const BodyText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
  marginBottom: "16px",
}))

const Footer = styled.div({
  display: "flex",
  justifyContent: "end",
})

type SignupPopoverProps = Pick<
  PopoverProps,
  "anchorEl" | "onClose" | "placement"
> & {
  signupUrl?: string
}
const SignupPopover: React.FC<SignupPopoverProps> = (props) => {
  const { signupUrl, ...popoverProps } = props
  return (
    <StyledPopover {...popoverProps} open={!!popoverProps.anchorEl}>
      <HeaderText variant="subtitle2">
        Join {APP_SETTINGS.SITE_NAME} for free.
      </HeaderText>
      <BodyText variant="body2">
        As a member, get personalized recommendations, curate learning lists,
        and follow your areas of interest.
      </BodyText>
      <Footer>
        <ButtonLink href={signupUrl}>Sign Up</ButtonLink>
      </Footer>
    </StyledPopover>
  )
}

export { SignupPopover }
export type { SignupPopoverProps }
