import React from "react"
import { Popover, Typography, styled, ButtonLink } from "ol-components"
import type { PopoverProps } from "ol-components"
import * as urls from "@/common/urls"
import { usePathname, useSearchParams } from "next/navigation"

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

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME

type SignupPopoverProps = Pick<
  PopoverProps,
  "anchorEl" | "onClose" | "placement"
>
const SignupPopover: React.FC<SignupPopoverProps> = (props) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <StyledPopover {...props} open={!!props.anchorEl}>
      <HeaderText variant="subtitle2">Join {SITE_NAME} for free.</HeaderText>
      <BodyText variant="body2">
        As a member, get personalized recommendations, curate learning lists,
        and follow your areas of interest.
      </BodyText>
      <Footer>
        <ButtonLink
          href={urls.login({
            pathname,
            search: searchParams?.toString(),
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
