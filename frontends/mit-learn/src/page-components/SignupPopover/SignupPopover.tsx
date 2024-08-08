import React from "react"
import { Popover, Typography, styled, ButtonLink } from "ol-components"
import type { PopoverProps } from "ol-components"
import * as urls from "@/common/urls"
import { useLocation } from "react-router"

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
>
const SignupPopover: React.FC<SignupPopoverProps> = (props) => {
  const loc = useLocation()
  return (
    <StyledPopover {...props} open={!!props.anchorEl}>
      <HeaderText variant="subtitle2">
        Join {APP_SETTINGS.SITE_NAME} for free.
      </HeaderText>
      <BodyText variant="body2">
        As a member, get personalized recommendations, curate learning lists,
        and follow your areas of interest.
      </BodyText>
      <Footer>
        <ButtonLink
          href={urls.login({
            pathname: loc.pathname,
            search: loc.search,
          })}
        >
          Sign Up
        </ButtonLink>
      </Footer>
    </StyledPopover>
  )
}

export { SignupPopover }
export type { SignupPopoverProps }
